import { toObjectId } from "../../utils/safeObjectId.js";
import { generateCode } from "../../utils/codeGenerator.js";

import { writeAuditLog } from "../../utils/logger.js";
import { COLLECTIONS } from "../../database/collections.js";
import { getMainBranch } from "../../utils/getMainWarehouse.js";
import {
  purchaseAccounting,
  purchaseReturnAccounting,
} from "../accounting/accounting.adapter.js";
import { roundMoney } from "../../utils/money.js";
import { formatDocuments } from "../../utils/formatedDocument.js";
import {
  buildAggregationPipeline,
  castObjectId,
} from "../../database/buildAggregationPipeline.js";
import { aggregateList } from "../../database/aggregateList.js";

export const createPurchase = async ({ db, body, req }) => {
  const session = db.client.startSession();

  let purchaseNo;
  let totalQty = 0;
  let totalAmount = 0;
  let mainBranch;
  const barcodePayload = [];
  try {
    session.startTransaction();

    /* =====================
       1️⃣ MAIN WAREHOUSE
    ====================== */
    mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    /* =====================
       2️⃣ CORE DATA
    ====================== */
    const supplierId = toObjectId(body.supplierId, "supplierId");
    const paidAmount = Number(body.paidAmount || 0);

    /* =====================
       3️⃣ PURCHASE NO
    ====================== */
    purchaseNo = await generateCode({
      db,
      module: "PURCHASE",
      prefix: "PUR",
      scope: "YEAR",
      branch: mainBranch.code,
      session,
    });

    /* =====================
       4️⃣ ITEM LOOP
    ====================== */
    for (const item of body.items) {
      const variantId = toObjectId(item.variantId, "variantId");

      const variant = await db
        .collection(COLLECTIONS.VARIANTS)
        .aggregate(
          [
            { $match: { _id: variantId } },
            {
              $lookup: {
                from: "products",
                localField: "productId",
                foreignField: "_id",
                as: "product",
              },
            },
            { $unwind: "$product" },
            {
              $lookup: {
                from: "categories",
                localField: "product.categoryId",
                foreignField: "_id",
                as: "category",
              },
            },
            { $unwind: "$category" },
            {
              $lookup: {
                from: "categories",
                localField: "category.parentId",
                foreignField: "_id",
                as: "parentCategory",
              },
            },
            { $unwind: "$parentCategory" },
            {
              $project: {
                sku: 1,
                salePrice: 1,
                attributes: 1,
                productName: "$product.name",
                categoryName: "$category.name",
                parentCategoryName: "$parentCategory.name",
              },
            },
          ],
          { session },
        )
        .next();

      if (!variant) throw new Error("Variant not found");

      const stock = await db
        .collection(COLLECTIONS.STOCKS)
        .findOne({ branchId, variantId }, { session });

      if (!stock) {
        await db.collection(COLLECTIONS.STOCKS).insertOne(
          {
            branchId,
            variantId,
            sku: variant.sku,
            qty: item.qty,
            avgCost: roundMoney(item.costPrice),
            createdAt: new Date(),
          },
          { session },
        );
      } else {
        const newQty = stock.qty + item.qty;
        const newAvg =
          (stock.qty * stock.avgCost + item.qty * item.costPrice) / newQty;
        const roundedAvg = roundMoney(newAvg);

        await db.collection(COLLECTIONS.STOCKS).updateOne(
          { _id: stock._id },
          {
            $set: {
              qty: newQty,
              avgCost: roundedAvg,
              updatedAt: new Date(),
            },
          },
          { session },
        );
      }

      /* ---------- BARCODE PAYLOAD ---------- */
      barcodePayload.push({
        name: variant.productName,
        parentCategoryName: variant.parentCategoryName,
        categoryName: variant.categoryName,
        mrp: variant.salePrice,
        sku: variant.sku,
        attributes: variant.attributes,
        qty: item.qty,
      });

      /* ---------- SALE PRICE UPDATE ---------- */
      if (item.salePrice && item.salePrice !== variant.salePrice) {
        await db.collection(COLLECTIONS.VARIANTS).updateOne(
          { _id: variantId },
          {
            $set: {
              salePrice: item.salePrice,
              updatedAt: new Date(),
            },
            $push: {
              priceHistory: {
                oldPrice: variant.salePrice,
                newPrice: item.salePrice,
                source: "PURCHASE",
                date: new Date(),
              },
            },
          },
          { session },
        );
      }

      totalQty += item.qty;
      totalAmount += item.qty * item.costPrice;
    }

    totalAmount = roundMoney(totalAmount);

    /* =====================
       5️⃣ PAYMENT CALCULATION
    ====================== */
    const dueAmount = roundMoney(Math.max(totalAmount - paidAmount, 0), 2);

    const paidRounded = roundMoney(paidAmount, 2);

    const paymentStatus =
      dueAmount === 0 ? "PAID" : paidRounded > 0 ? "PARTIAL" : "DUE";

    /* =====================
       6️⃣ PURCHASE INSERT
    ====================== */
    const insertResult = await db.collection(COLLECTIONS.PURCHASES).insertOne(
      {
        purchaseNo,
        supplierId,
        branchId,

        invoiceNumber: body.invoiceNumber,
        invoiceDate: body.invoiceDate,

        items: body.items,
        totalQty,
        totalAmount,

        paidAmount,
        dueAmount,
        paymentStatus,

        notes: body.notes || null,
        createdAt: new Date(),
      },
      { session },
    );

    /* =====================
       7️⃣ ACCOUNTING (TX SAFE)
    ====================== */
    await purchaseAccounting({
      db,
      session,
      purchaseId: insertResult.insertedId,
      totalAmount,
      cashPaid: paidAmount,
      dueAmount,
      supplierId,
      branchId,
      narration: `Purchase #${purchaseNo}`,
    });

    /* =====================
       8️⃣ AUDIT LOG
    ====================== */
    await writeAuditLog({
      db,
      session,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_CREATE",
      collection: COLLECTIONS.PURCHASES,
      documentId: insertResult.insertedId,
      refType: "PURCHASE",
      refId: insertResult.insertedId,
      payload: {
        purchaseNo,
        branchCode: mainBranch.code,
        supplierId,
        totalQty,
        totalAmount,
        paidAmount,
        dueAmount,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      status: "SUCCESS",
    });

    await session.commitTransaction();

    return {
      purchaseNo,
      branch: mainBranch.code,
      invoiceNumber: body.invoiceNumber,
      totalQty,
      totalAmount,
      paidAmount,
      dueAmount,
      barcodes: barcodePayload,
    };
  } catch (error) {
    await session.abortTransaction();
    await writeAuditLog({
      db,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_CREATE_FAILED",
      collection: COLLECTIONS.PURCHASES,
      refType: "PURCHASE",
      refId: null,
      payload: {
        purchaseNo: purchaseNo || null,
        error: error.message,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      status: "FAILED",
    });

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getAllPurchases = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const match = {};

    if (req.query.supplierId) {
      match.supplierId = castObjectId(req.query.supplierId);
    }

    if (req.query.paymentStatus) {
      match.paymentStatus = req.query.paymentStatus;
    }

    const pipeline = buildAggregationPipeline({
      match,
      search: req.query.search,
      searchableFields: ["purchaseNo", "invoiceNumber"],
      page,
      limit,
      lookups: [
        {
          from: COLLECTIONS.SUPPLIERS,
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier",
        },
      ],
      project: {
        items: 0,
        "supplier.address": 0,
      },
    });

    const { data, total } = await aggregateList({
      db,
      collection: COLLECTIONS.PURCHASES,
      pipeline,
      match,
    });

    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: formatDocuments(data),
    });
  } catch (err) {
    next(err);
  }
};

export const getSinglePurchaseInvoice = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const purchaseId = toObjectId(req.params.id, "purchaseId");

    const data = await db
      .collection(COLLECTIONS.PURCHASES)
      .aggregate([
        { $match: { _id: purchaseId } },

        /* =====================
           CAST variantId STRING → ObjectId
        ====================== */
        {
          $addFields: {
            items: {
              $map: {
                input: "$items",
                as: "i",
                in: {
                  variantIdObj: { $toObjectId: "$$i.variantId" },
                  qty: "$$i.qty",
                  costPrice: "$$i.costPrice",
                  salePrice: "$$i.salePrice",
                },
              },
            },
          },
        },

        /* =====================
           VARIANT LOOKUP (NOW WORKS)
        ====================== */
        {
          $lookup: {
            from: COLLECTIONS.VARIANTS,
            localField: "items.variantIdObj",
            foreignField: "_id",
            as: "variants",
          },
        },

        /* =====================
           PRODUCT LOOKUP
        ====================== */
        {
          $lookup: {
            from: COLLECTIONS.PRODUCTS,
            localField: "variants.productId",
            foreignField: "_id",
            as: "products",
          },
        },

        /* =====================
           SUPPLIER (LIMITED)
        ====================== */
        {
          $lookup: {
            from: COLLECTIONS.SUPPLIERS,
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },

        /* =====================
           BRANCH (LIMITED)
        ====================== */
        {
          $lookup: {
            from: COLLECTIONS.BRANCHES,
            localField: "branchId",
            foreignField: "_id",
            as: "branch",
          },
        },
        { $unwind: "$branch" },

        /* =====================
           MERGE ITEMS (FINAL)
        ====================== */
        {
          $addFields: {
            items: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $let: {
                    vars: {
                      variant: {
                        $first: {
                          $filter: {
                            input: "$variants",
                            as: "v",
                            cond: {
                              $eq: ["$$v._id", "$$item.variantIdObj"],
                            },
                          },
                        },
                      },
                    },
                    in: {
                      qty: "$$item.qty",
                      costPrice: "$$item.costPrice",
                      salePrice: "$$item.salePrice",

                      sku: "$$variant.sku",
                      variantId: "$$variant._id",
                      attributes: "$$variant.attributes",

                      productName: {
                        $first: {
                          $map: {
                            input: {
                              $filter: {
                                input: "$products",
                                as: "p",
                                cond: {
                                  $eq: ["$$p._id", "$$variant.productId"],
                                },
                              },
                            },
                            as: "p",
                            in: "$$p.name",
                          },
                        },
                      },

                      lineTotal: {
                        $multiply: ["$$item.qty", "$$item.costPrice"],
                      },
                    },
                  },
                },
              },
            },
          },
        },

        /* =====================
           CLEAN RESPONSE
        ====================== */
        {
          $project: {
            variants: 0,
            products: 0,

            "supplier._id": 0,
            "supplier.account": 0,
            "supplier.status": 0,
            "supplier.code": 0,
            "supplier.createdAt": 0,
            "supplier.updatedAt": 0,

            "branch._id": 0,
            "branch.status": 0,
            "branch.isMain": 0,
            "branch.createdAt": 0,
            "branch.updatedAt": 0,
          },
        },
      ])
      .toArray();

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });
    }
    const formattedData = formatDocuments(data);
    res.json({
      success: true,
      data: formattedData[0],
    });
  } catch (err) {
    next(err);
  }
};

export const createPurchaseReturn = async ({ db, body, req }) => {
  const session = db.client.startSession();

  let returnNo;
  let totalQty = 0;
  let totalAmount = 0;
  let mainBranch;

  try {
    session.startTransaction();

    /* =====================
       1️⃣ MAIN BRANCH
    ====================== */
    mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    /* =====================
       2️⃣ PURCHASE FETCH
    ====================== */
    const purchaseId = toObjectId(body.purchaseId, "purchaseId");

    const purchase = await db
      .collection(COLLECTIONS.PURCHASES)
      .findOne({ _id: purchaseId }, { session });

    if (!purchase) throw new Error("Purchase not found");

    /* =====================
       3️⃣ RETURN NUMBER
    ====================== */
    returnNo = await generateCode({
      db,
      module: "PURCHASE_RETURN",
      prefix: "PRT",
      scope: "YEAR",
      branch: mainBranch.code,
      session,
    });

    /* =====================
       4️⃣ ITEM LOOP
    ====================== */
    for (const item of body.items) {
      const variantId = toObjectId(item.variantId, "variantId");

      const purchaseItem = purchase.items.find(
        (i) => i.variantId.toString() === variantId.toString(),
      );

      if (!purchaseItem) {
        throw new Error("Variant not found in purchase");
      }

      if (item.qty <= 0 || item.qty > purchaseItem.qty) {
        throw new Error("Invalid return quantity");
      }

      /* ---------- STOCK CHECK ---------- */
      const stock = await db
        .collection(COLLECTIONS.STOCKS)
        .findOne({ branchId, variantId }, { session });

      if (!stock || stock.qty < item.qty) {
        throw new Error("Insufficient stock for return");
      }

      /* ---------- STOCK UPDATE ---------- */
      await db.collection(COLLECTIONS.STOCKS).updateOne(
        { _id: stock._id },
        {
          $inc: { qty: -item.qty },
          $set: { updatedAt: new Date() },
        },
        { session },
      );

      totalQty += item.qty;
      totalAmount += item.qty * purchaseItem.costPrice;
    }

    totalAmount = roundMoney(totalAmount);

    /* =====================
       5️⃣ PURCHASE RETURN INSERT
    ====================== */
    const insertResult = await db
      .collection(COLLECTIONS.PURCHASE_RETURNS)
      .insertOne(
        {
          returnNo,
          purchaseId,
          supplierId: purchase.supplierId,
          branchId,

          returnDate: body.returnDate || new Date(),
          reason: body.reason || null,

          items: body.items,
          totalQty,
          totalAmount,

          createdAt: new Date(),
        },
        { session },
      );

    /* =====================
       6️⃣ PURCHASE BALANCE UPDATE
    ====================== */
    const newTotalAmount = roundMoney(
      Math.max(purchase.totalAmount - totalAmount, 0),
    );

    const newDueAmount = roundMoney(
      Math.max(newTotalAmount - purchase.paidAmount, 0),
    );

    const newPaymentStatus =
      newDueAmount === 0 ? "PAID" : purchase.paidAmount > 0 ? "PARTIAL" : "DUE";

    await db.collection(COLLECTIONS.PURCHASES).updateOne(
      { _id: purchaseId },
      {
        $set: {
          totalAmount: newTotalAmount,
          dueAmount: newDueAmount,
          paymentStatus: newPaymentStatus,
          updatedAt: new Date(),
        },
      },
      { session },
    );

    /* =====================
       7️⃣ ACCOUNTING (TX SAFE)
    ====================== */
    await purchaseReturnAccounting({
      db,
      session,
      purchaseReturnId: insertResult.insertedId,
      returnAmount: totalAmount,
      cashRefund: Number(body.cashRefund || 0),
      dueAdjust: Number(body.dueAdjust || 0),
      supplierId: purchase.supplierId,
      branchId,
      narration: `Purchase Return #${returnNo}`,
    });

    /* =====================
       8️⃣ AUDIT LOG
    ====================== */
    await writeAuditLog({
      db,
      session,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_RETURN_CREATE",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      documentId: insertResult.insertedId,
      refType: "PURCHASE_RETURN",
      refId: purchase._id,
      branchId,
      payload: {
        returnNo,
        purchaseId,
        supplierId: purchase.supplierId,
        totalQty,
        totalAmount,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
    });

    await session.commitTransaction();

    return {
      returnNo,
      purchaseId,
      totalQty,
      totalAmount,
      branch: mainBranch.code,
    };
  } catch (error) {
    await session.abortTransaction();

    await writeAuditLog({
      db,
      userId: toObjectId(req?.user?.id),
      action: "PURCHASE_RETURN_FAILED",
      collection: COLLECTIONS.PURCHASE_RETURNS,
      refType: "PURCHASE_RETURN",
      refId: purchase._id || null,
      payload: {
        returnNo: returnNo || null,
        error: error.message,
      },
      ipAddress: req?.ip,
      userAgent: req?.headers?.["user-agent"],
      status: "FAILED",
    });

    throw error;
  } finally {
    await session.endSession();
  }
};

export const getAllPurchaseReturns = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);

    const match = {};

    if (req.query.supplierId) {
      match.supplierId = castObjectId(req.query.supplierId);
    }

    if (req.query.purchaseId) {
      match.purchaseId = castObjectId(req.query.purchaseId);
    }

    const pipeline = buildAggregationPipeline({
      match,
      search: req.query.search,
      searchableFields: ["returnNo"],
      page,
      limit,
      lookups: [
        {
          from: COLLECTIONS.PURCHASES,
          localField: "purchaseId",
          foreignField: "_id",
          as: "purchase",
        },
        {
          from: COLLECTIONS.SUPPLIERS,
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier",
        },
      ],
      project: {
        items: 0,
        "supplier.address": 0,
      },
    });

    const { data, total } = await aggregateList({
      db,
      collection: COLLECTIONS.PURCHASE_RETURNS,
      pipeline,
      match,
    });

    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: formatDocuments(data),
    });
  } catch (err) {
    next(err);
  }
};

export const getSinglePurchaseReturnInvoice = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const returnId = toObjectId(req.params.id, "returnId");

    const data = await db
      .collection(COLLECTIONS.PURCHASE_RETURNS)
      .aggregate([
        { $match: { _id: returnId } },

        /* ---------- PURCHASE ---------- */
        {
          $lookup: {
            from: COLLECTIONS.PURCHASES,
            localField: "purchaseId",
            foreignField: "_id",
            as: "purchase",
          },
        },
        { $unwind: "$purchase" },

        /* ---------- SUPPLIER ---------- */
        {
          $lookup: {
            from: COLLECTIONS.SUPPLIERS,
            localField: "supplierId",
            foreignField: "_id",
            as: "supplier",
          },
        },
        { $unwind: "$supplier" },

        /* ---------- BRANCH ---------- */
        {
          $lookup: {
            from: COLLECTIONS.BRANCHES,
            localField: "branchId",
            foreignField: "_id",
            as: "branch",
          },
        },
        { $unwind: "$branch" },

        /* ---------- VARIANTS ---------- */
        {
          $lookup: {
            from: COLLECTIONS.VARIANTS,
            localField: "items.variantId",
            foreignField: "_id",
            as: "variantDocs",
          },
        },

        /* ---------- MERGE ITEMS ---------- */
        {
          $addFields: {
            items: {
              $map: {
                input: "$items",
                as: "item",
                in: {
                  $mergeObjects: [
                    "$$item",
                    {
                      variant: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$variantDocs",
                              as: "v",
                              cond: {
                                $eq: ["$$v._id", "$$item.variantId"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $project: {
            variantDocs: 0,
          },
        },
      ])
      .toArray();

    if (!data.length) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    res.json({
      success: true,
      data: formatDocuments(data[0]),
    });
  } catch (err) {
    next(err);
  }
};
