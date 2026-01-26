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
import { ObjectId } from "mongodb";
import { generateVariantSKU } from "../../utils/sku/generateVariantSKU.js";

/* ---------------------------------------
  Helpers
---------------------------------------- */
const toId = (id, label) => {
  if (!ObjectId.isValid(id)) throw new Error(`Invalid ${label}`);
  return new ObjectId(id);
};

/* ---------------------------------------
  Stock Upsert (AVG Cost Safe)
---------------------------------------- */
async function upsertStock({
  db,
  session,
  branchId,
  variantId,
  productId,
  sku,
  productName,
  attributes,
  qty,
  salePrice,
  costPrice,
  searchableText
}) {
  const stock = await db
    .collection(COLLECTIONS.STOCKS)
    .findOne({ branchId, variantId }, { session });

  if (!stock) {
    await db.collection(COLLECTIONS.STOCKS).insertOne(
      {
        branchId,
        variantId,
        productId,
        productName,
        attributes,
        salePrice,
        searchableText,
        sku,
        qty,
        avgCost: roundMoney(costPrice),
        createdAt: new Date(),
      },
      { session },
    );
  } else {
    const newQty = stock.qty + qty;
    const newAvg = (stock.qty * stock.avgCost + qty * costPrice) / newQty;

    await db.collection(COLLECTIONS.STOCKS).updateOne(
      { _id: stock._id },
      {
        $set: {
          qty: newQty,
          avgCost: roundMoney(newAvg),
          updatedAt: new Date(),
        },
      },
      { session },
    );
  }
}

/* ---------------------------------------
  CREATE PURCHASE (NEW FLOW)
---------------------------------------- */
export const createPurchase = async ({ db, body, req }) => {
  const session = db.client.startSession();
  let purchaseNo = null;
  let transactionStarted = false;
  try {
    const payload = body;
    session.startTransaction();
    transactionStarted = true;
    /* =====================
       Branch
    ====================== */
    const mainBranch = await getMainBranch(db, session);
    const branchId = mainBranch._id;

    /* =====================
       Core Data
    ====================== */
    const supplierId = toId(payload.supplierId, "supplierId");
    const paidAmount = roundMoney(payload.paidAmount || 0);

    /* =====================
       Purchase No
    ====================== */
    purchaseNo = await generateCode({
      db,
      module: "PURCHASE",
      prefix: "PUR",
      scope: "YEAR",
      branch: mainBranch.code,
      session,
    });

    let totalQty = 0;
    let totalAmount = 0;
    const barcodePayload = [];

    /* =====================
       Preload Categories (NO N+1)
    ====================== */
    const productIds = payload.items.map((i) => toId(i.productId, "productId"));

    const products = await db
      .collection(COLLECTIONS.PRODUCTS)
      .aggregate(
        [
          { $match: { _id: { $in: productIds } } },
          {
            $lookup: {
              from: COLLECTIONS.CATEGORIES,
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
          },
          { $unwind: "$category" },
          {
            $lookup: {
              from: COLLECTIONS.CATEGORIES,
              localField: "category.parentId",
              foreignField: "_id",
              as: "parentCategory",
            },
          },
          { $unwind: "$parentCategory" },
        ],
        { session },
      )
      .toArray();

    const productMap = new Map(products.map((p) => [String(p._id), p]));

    /* =====================
       ITEM LOOP
    ====================== */
    for (const item of payload.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("Product not found");

      const colors =
        Array.isArray(product.colors) && product.colors.length
          ? product.colors
          : ["NA"];

      for (const [size, colorMap] of Object.entries(item.sizes)) {
        for (const color of colors) {
          const qty = Number(colorMap?.[color] || 0);
          if (qty <= 0) continue;

          /* =====================
             Variant Find/Create
          ====================== */
          let variant = await db.collection(COLLECTIONS.VARIANTS).findOne(
            {
              productId: product._id,
              "attributes.size": size,
              "attributes.color": color,
            },
            { session },
          );

          let oldSalePrice = null;

          if (!variant) {
            const sku = await generateVariantSKU({
              db,
              productId: product._id,
              productCode: product.productCode,
              session,
            });

            const insert = await db.collection(COLLECTIONS.VARIANTS).insertOne(
              {
                productId: product._id,
                sku,
                attributes: { size, color },
                costPrice: item.costPrice,
                salePrice: item.salePrice,
                priceHistory: [],
                status: "active",
                createdAt: new Date(),
              },
              { session },
            );

            variant = {
              _id: insert.insertedId,
              sku,
              attributes: { size, color },
              salePrice: item.salePrice,
            };
          } else if (item.salePrice !== variant.salePrice) {
            oldSalePrice = variant.salePrice;

            await db.collection(COLLECTIONS.VARIANTS).updateOne(
              { _id: variant._id },
              {
                $set: {
                  salePrice: item.salePrice,
                  updatedAt: new Date(),
                },
                $push: {
                  priceHistory: {
                    oldPrice: oldSalePrice,
                    newPrice: item.salePrice,
                    source: "PURCHASE",
                    refType: "PURCHASE",
                    refId: purchaseNo,
                    date: new Date(),
                  },
                },
              },
              { session },
            );
          }

          /* =====================
             Stock Update
          ====================== */
          await upsertStock({
            db,
            session,
            branchId,
            variantId: variant._id,
            productId: product._id,
            productName: product.name,
            attributes: variant.attributes,
            salePrice: item.salePrice,
            searchableText: `${product.name} ${product.productCode} ${variant.sku} ${size} ${color}`,
            sku: variant.sku,
            qty,
            costPrice: item.costPrice,
          });

          /* =====================
             Barcode Payload (PER UNIT)
          ====================== */
          for (let i = 0; i < qty; i++) {
            barcodePayload.push({
              productName: product.name,
              sku: variant.sku,
              parentCategory: product.parentCategory.name,
              subCategory: product.category.name,
              salesPrice: item.salePrice,
              qtn: item.qtn,
              attribute: variant.attributes,
            });
          }

          totalQty += qty;
          totalAmount += qty * item.costPrice;
        }
      }
    }

    totalAmount = roundMoney(totalAmount);
    const dueAmount = roundMoney(Math.max(totalAmount - paidAmount, 0));

    const paymentStatus =
      dueAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "DUE";

    /* =====================
       Purchase Insert
    ====================== */
    const insertResult = await db.collection(COLLECTIONS.PURCHASES).insertOne(
      {
        purchaseNo,
        supplierId,
        branchId,
        invoiceNumber: payload.invoiceNumber,
        invoiceDate: payload.invoiceDate,
        items: payload.items,
        totalQty,
        totalAmount,
        paidAmount,
        dueAmount,
        paymentStatus,
        notes: payload.notes || null,
        createdAt: new Date(),
      },
      { session },
    );

    /* =====================
       Accounting
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
       Audit Log
    ====================== */
    await writeAuditLog({
      db,
      session,
      userId: toId(req?.user?._id, "userId"),
      action: "PURCHASE_CREATE",
      collection: COLLECTIONS.PURCHASES,
      documentId: insertResult.insertedId,
      refType: "PURCHASE",
      refId: insertResult.insertedId,
      payload: {
        purchaseNo,
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
      totalQty,
      totalAmount,
      paidAmount,
      dueAmount,
      barcodes: barcodePayload,
    };
  } catch (error) {
    if (transactionStarted) {
      await session.abortTransaction();
    }

    await writeAuditLog({
      db,
      userId: toId(req?.user?._id, "userId"),
      action: "PURCHASE_CREATE_FAILED",
      collection: COLLECTIONS.PURCHASES,
      payload: {
        purchaseNo,
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
      userId: toObjectId(req?.user?._id),
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
      userId: toObjectId(req?.user?._id),
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
