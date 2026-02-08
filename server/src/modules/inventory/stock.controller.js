import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";
import { formatDocuments } from "../../utils/formatedDocument.js";
import { ensureObjectId } from "../../utils/ensureObjectId.js";
import { getDB } from "../../config/db.js";
import { getBusinessDateBD } from "../../utils/businessDate.js";
import { calculateDiscount, getBDMidnight } from "./discount/discount.utils.js";
import { getActiveProductDiscounts } from "./discount/discount.service.js";
import { generateCode } from "../../utils/codeGenerator.js";

export const getAllStocks = async (req, res, next) => {
  try {
    const db = getDB();

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    /* ---------------------------
       Base match (FAST FILTER)
    ---------------------------- */
    const match = {};

    if (req.query.branchId && ObjectId.isValid(req.query.branchId)) {
      match.branchId = new ObjectId(req.query.branchId);
    }

    if (req.query.minQty) {
      match.qty = { $lte: Number(req.query.minQty) };
    }

    if (req.query.supplierId && ObjectId.isValid(req.query.supplierId)) {
      match.lastSupplierId = new ObjectId(req.query.supplierId);
    }

    const search = req.query.search?.trim();

    /* ---------------------------
       Aggregation Pipeline
    ---------------------------- */
    const pipeline = [
      { $match: match },

      /* ---------- Supplier ---------- */
      {
        $lookup: {
          from: COLLECTIONS.SUPPLIERS,
          localField: "lastSupplierId",
          foreignField: "_id",
          as: "supplier",
        },
      },
      {
        $unwind: {
          path: "$supplier",
          preserveNullAndEmptyArrays: true,
        },
      },

      /* ---------- Branch ---------- */
      {
        $lookup: {
          from: COLLECTIONS.BRANCHES,
          localField: "branchId",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: "$branch" },

      /* ---------- Variant ---------- */
      {
        $lookup: {
          from: COLLECTIONS.VARIANTS,
          localField: "variantId",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },

      /* ---------- Attribute Filters ---------- */
      ...(req.query.size
        ? [{ $match: { "variant.attributes.size": req.query.size } }]
        : []),

      ...(req.query.color
        ? [{ $match: { "variant.attributes.color": req.query.color } }]
        : []),

      /* ---------- Product ---------- */
      {
        $lookup: {
          from: COLLECTIONS.PRODUCTS,
          localField: "variant.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      /* ---------- Search ---------- */
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { sku: { $regex: search, $options: "i" } },
                  { "product.name": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      /* ---------- Computed ---------- */
      {
        $addFields: {
          stockValue: { $multiply: ["$qty", "$avgCost"] },
        },
      },

      /* ---------- Projection ---------- */
      {
        $project: {
          branchId: 1,
          branchName: "$branch.name",
          branchCode: "$branch.code",

          sku: 1,
          qty: 1,
          avgCost: 1,
          stockValue: 1,
          updatedAt: 1,

          salePrice: "$variant.salePrice",
          size: "$variant.attributes.size",
          color: "$variant.attributes.color",

          productName: "$product.name",
          productSku: "$product.sku",
          brand: "$product.brand",

          supplierName: "$supplier.name",
          supplierPhone: "$supplier.contact.phone",
        },
      },

      { $sort: { updatedAt: -1 } },

      /* ---------- Pagination ---------- */
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await db
      .collection(COLLECTIONS.STOCKS)
      .aggregate(pipeline)
      .toArray();

    const data = result[0]?.data || [];
    const total = result[0]?.total?.[0]?.count || 0;

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

const isNumeric = (val) => /^[0-9]+$/.test(val);

export const getPosItems = async (req, res, next) => {
  try {
    const db = getDB();

    /* ===============================
       BUSINESS DATE (BD)
    =============================== */
    const today = getBDMidnight();

    const { search = "", limit = 20, lastSku, lastId } = req.query;

    /* ===============================
       RESOLVE BRANCH
    =============================== */
    let branchId = req.user?.branchId;

    if (!branchId && req.user?.isSuperAdmin) {
      const main = await db
        .collection(COLLECTIONS.BRANCHES)
        .findOne({ isMain: true }, { projection: { _id: 1 } });

      if (!main) {
        return res.status(400).json({
          success: false,
          message: "Main branch not found",
        });
      }

      branchId = main._id;
    }

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch unresolved",
      });
    }

    /* ===============================
       STOCK QUERY (SOURCE OF TRUTH)
    =============================== */
    const match = {
      branchId: new ObjectId(branchId),
      qty: { $gt: 0 },
    };

    if (search) {
      if (!isNaN(search) && search.length >= 6) {
        match.sku = search; // barcode
      } else {
        match.$text = { $search: search };
      }
    }

    if (lastSku && lastId) {
      match.$or = [
        { sku: { $gt: lastSku } },
        {
          sku: lastSku,
          _id: { $gt: new ObjectId(lastId) },
        },
      ];
    }

    /* ===============================
       FETCH STOCK
    =============================== */
    const items = await db
      .collection(COLLECTIONS.STOCKS)
      .find(match)
      .sort({ sku: 1, _id: 1 })
      .limit(Number(limit))
      .project({
        productId: 1,
        variantId: 1,
        sku: 1,
        productName: 1,
        salePrice: 1,
        qty: 1,
        unit: 1,
      })
      .toArray();

    if (!items.length) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          limit: Number(limit),
          hasMore: false,
          lastSku: null,
          lastId: null,
        },
      });
    }

    /* ===============================
       DISCOUNT RESOLVE (PRODUCT)
    =============================== */
    const productIds = [
      ...new Set(items.map((i) => i.productId.toString())),
    ].map((id) => new ObjectId(id));

    const discounts = await getActiveProductDiscounts({
      db,
      productIds,
    });

    const discountMap = new Map();
    for (const d of discounts) {
      discountMap.set(d.targetId.toString(), d);
    }

    /* ===============================
       APPLY DISCOUNT
    =============================== */
    const data = items.map((item) => {
      const d = discountMap.get(item.productId.toString());

      if (!d) {
        return {
          ...item,
          discountType: null,
          discountValue: 0,
          discountAmount: 0,
          finalPrice: item.salePrice,
        };
      }

      const { discountAmount, finalPrice } = calculateDiscount({
        salePrice: item.salePrice,
        type: d.type,
        value: Number(d.value),
      });

      return {
        ...item,
        discountType: d.type,
        discountId: d._id,
        discountValue: d.value,
        discountAmount,
        finalPrice,
      };
    });

    const last = data[data.length - 1];

    /* ===============================
       RESPONSE
    =============================== */
    res.json({
      success: true,
      data,
      pagination: {
        limit: Number(limit),
        hasMore: items.length === Number(limit),
        lastSku: last?.sku || null,
        lastId: last?._id || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTransferItems = async (req, res, next) => {
  try {
    const db = getDB();

    const {
      fromBranchId,
      search = "",
      limit = 20,
      lastSku,
      lastId,
    } = req.query;

    /* ---------------- Validate Branch ---------------- */
    if (!fromBranchId || !ObjectId.isValid(fromBranchId)) {
      return res.status(400).json({
        success: false,
        message: "Source branch is required for stock transfer",
      });
    }

    const branchId = new ObjectId(fromBranchId);

    /* ---------------- Match (STRICT) ---------------- */
    const match = {
      branchId,
      qty: { $gt: 0 },
    };

    /* ---------------- Search Strategy ---------------- */
    if (search) {
      // Barcode / SKU scan
      if (isNumeric(search) && search.length >= 6) {
        match.sku = search;
      }
      // Typing search (TEXT INDEX)
      else {
        match.$text = { $search: search };
      }
    }

    /* ---------------- Cursor Pagination ---------------- */
    if (lastSku && lastId && ObjectId.isValid(lastId)) {
      match.$or = [
        { sku: { $gt: lastSku } },
        {
          sku: lastSku,
          _id: { $gt: new ObjectId(lastId) },
        },
      ];
    }

    /* ---------------- Query ---------------- */
    const data = await db
      .collection(COLLECTIONS.STOCKS)
      .find(match)
      .sort({ sku: 1, _id: 1 })
      .limit(Number(limit))
      .project({
        _id: 1,
        productId: 1,
        variantId: 1,
        sku: 1,
        productName: 1,
        attributes: 1,
        qty: 1,
        unit: 1,
      })
      .toArray();

    const last = data[data.length - 1];

    res.json({
      success: true,
      data,
      pagination: {
        limit: Number(limit),
        hasMore: data.length === Number(limit),
        lastSku: last?.sku || null,
        lastId: last?._id || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getLowStock = async (req, res, next) => {
  try {
    const db = getDB();

    const page = Math.max(+req.query.page || 1, 1);
    const limit = Math.min(+req.query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const match = {};

    if (req.query.branchId) {
      match.branchId = new ObjectId(req.query.branchId);
    }

    const pipeline = [
      /* ---------- Base ---------- */
      { $match: match },

      /* ---------- Branch ---------- */
      {
        $lookup: {
          from: "branches",
          localField: "branchId",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: "$branch" },

      /* ---------- Variant ---------- */
      {
        $lookup: {
          from: "product_variants",
          localField: "variantId",
          foreignField: "_id",
          as: "variant",
        },
      },
      { $unwind: "$variant" },

      /* ---------- Product ---------- */
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },

      /* ---------- Low Stock Logic ---------- */
      {
        $addFields: {
          reorderLevel: {
            $ifNull: ["$product.reorderLevel", 3],
          },
        },
      },
      {
        $match: {
          $expr: { $lte: ["$qty", "$reorderLevel"] },
        },
      },

      /* ---------- Projection ---------- */
      {
        $project: {
          branchName: "$branch.name",
          branchCode: "$branch.code",

          productName: "$product.name",
          brand: "$product.brand",

          sku: "$variant.sku",
          size: "$variant.attributes.size",
          color: "$variant.attributes.color",

          qty: 1,
          salePrice: "$variant.salePrice",
          reorderLevel: 1,

          updatedAt: 1,
        },
      },

      { $sort: { qty: 1 } },

      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await db
      .collection("stocks")
      .aggregate(pipeline)
      .toArray();

    res.json({
      success: true,
      pagination: {
        total: result.total[0]?.count || 0,
        page,
        limit,
      },
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

export const createStockTransfer = async (req, res, next) => {
  const session = getDB().client.startSession();

  try {
    const db = getDB();
    const { fromBranchId, toBranchId, items } = req.body;

    if (fromBranchId === toBranchId)
      throw new Error("Source & destination cannot be same");

    session.startTransaction();

    const transferNo = await generateCode({
      db,
      session,
      module: "STOCK_TRANSFER",
      prefix: "ST",
      scope: "YEAR",
    });

    const transfer = {
      transferNo,
      fromBranchId: new ObjectId(fromBranchId),
      toBranchId: new ObjectId(toBranchId),
      status: "PENDING",
      totalItems: items.length,
      createdBy: req.user._id,
      createdAt: new Date(),
    };

    const { insertedId } = await db
      .collection("stock_transfers")
      .insertOne(transfer, { session });

    for (const item of items) {
      // 🔒 Lock stock (deduct immediately but reversible)
      const result = await db.collection("stocks").updateOne(
        {
          branchId: new ObjectId(fromBranchId),
          variantId: new ObjectId(item.variantId),
          qty: { $gte: item.qty },
        },
        { $inc: { qty: -item.qty } },
        { session },
      );

      if (!result.modifiedCount)
        throw new Error("Insufficient stock during transfer");

      await db.collection("stock_transfer_items").insertOne(
        {
          transferId: insertedId,
          variantId: new ObjectId(item.variantId),
          sentQty: item.qty,
          receivedQty: 0,
          status: "PENDING",
        },
        { session },
      );
    }

    await db.collection("stock_transfer_logs").insertOne(
      {
        transferId: insertedId,
        action: "CREATED",
        userId: req.user._id,
        createdAt: new Date(),
      },
      { session },
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Stock transfer created",
      transferNo,
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

export const receiveStockTransfer = async (req, res, next) => {
  const session = getDB().client.startSession();

  try {
    const db = getDB();
    const transferId = new ObjectId(req.params.id);
    const { items } = req.body;

    session.startTransaction();

    let mismatch = false;

    for (const item of items) {
      if (item.receivedQty !== item.sentQty) mismatch = true;

      await db.collection("stock_transfer_items").updateOne(
        { _id: new ObjectId(item._id) },
        {
          $set: {
            receivedQty: item.receivedQty,
            status: item.receivedQty === item.sentQty ? "OK" : "MISMATCH",
          },
        },
        { session },
      );

      // ➕ Add to destination stock
      await upsertStock({
        db,
        session,
        branchId: req.body.toBranchId,
        variantId: item.variantId,
        qty: item.receivedQty,
      });
    }

    await db.collection("stock_transfers").updateOne(
      { _id: transferId },
      {
        $set: {
          status: mismatch ? "MISMATCH" : "RECEIVED",
          receivedAt: new Date(),
          receivedBy: req.user._id,
        },
      },
      { session },
    );

    await session.commitTransaction();

    res.json({ success: true });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


export const listTransfersService = async ({ user, query }) => {
  const db = getDB();

  const {
    status,
    fromBranchId,
    toBranchId,
    limit = 20,
    page = 1,
  } = query;

  /* ===============================
     MATCH BUILDER (QUERY DRIVEN)
  =============================== */
  const match = {};

  /* ---------- Status ---------- */
  if (status) {
    match.status = status;
  }

  /* ---------- Explicit Branch Filters (Highest Priority) ---------- */
  if (fromBranchId && ObjectId.isValid(fromBranchId)) {
    match.fromBranchId = new ObjectId(fromBranchId);
  }

  if (toBranchId && ObjectId.isValid(toBranchId)) {
    match.toBranchId = new ObjectId(toBranchId);
  }

  /* ---------- Default User Scope ---------- */
  if (
    !fromBranchId &&
    !toBranchId &&
    user?.branchId &&
    ObjectId.isValid(user.branchId)
  ) {
    // POS / Branch user → incoming transfers only
    match.toBranchId = new ObjectId(user.branchId);
  }

  /* ===============================
     AGGREGATION PIPELINE
  =============================== */
  const pipeline = [
    { $match: match },

    {
      $lookup: {
        from: "branches",
        localField: "fromBranchId",
        foreignField: "_id",
        as: "fromBranch",
      },
    },
    {
      $lookup: {
        from: "branches",
        localField: "toBranchId",
        foreignField: "_id",
        as: "toBranch",
      },
    },

    { $unwind: "$fromBranch" },
    { $unwind: "$toBranch" },

    {
      $project: {
        _id: 1,
        transferNo: 1,
        status: 1,
        totalItems: 1,
        createdAt: 1,

        fromBranchId: 1,
        toBranchId: 1,

        fromBranchName: "$fromBranch.name",
        toBranchName: "$toBranch.name",
      },
    },

    { $sort: { createdAt: -1 } },

    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ];

  const data = await db
    .collection("stock_transfers")
    .aggregate(pipeline)
    .toArray();

  /* ===============================
     RESPONSE (getTransferItems STYLE)
  =============================== */
  return {
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      hasMore: data.length === Number(limit),
    },
  };
};
/* ===============================
   TRANSFER DETAILS (RECEIVE PAGE)
=============================== */
export const getTransferDetailsService = async ({
  user,
  transferId,
}) => {
  const db = getDB();

  if (!ObjectId.isValid(transferId)) {
    throw new Error("Invalid transfer id");
  }

  const [transfer] = await db
    .collection("stock_transfers")
    .aggregate([
      /* ================= TRANSFER ================= */
      {
        $match: { _id: new ObjectId(transferId) },
      },

      /* ================= BRANCHES ================= */
      {
        $lookup: {
          from: "branches",
          localField: "fromBranchId",
          foreignField: "_id",
          as: "fromBranch",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "toBranchId",
          foreignField: "_id",
          as: "toBranch",
        },
      },
      { $unwind: "$fromBranch" },
      { $unwind: "$toBranch" },

      /* ================= ITEMS ================= */
      {
        $lookup: {
          from: "stock_transfer_items",
          localField: "_id",
          foreignField: "transferId",
          as: "items",
        },
      },

      /* ================= VARIANTS ================= */
      {
        $lookup: {
          from: "product_variants",
          localField: "items.variantId",
          foreignField: "_id",
          as: "variants",
        },
      },

      /* ================= PRODUCTS ================= */
      {
        $lookup: {
          from: "products",
          localField: "variants.productId",
          foreignField: "_id",
          as: "products",
        },
      },

      /* ================= MERGE ITEMS ================= */
      {
        $addFields: {
          items: {
            $map: {
              input: "$items",
              as: "it",
              in: {
                _id: "$$it._id",
                sentQty: "$$it.sentQty",
                receivedQty: "$$it.receivedQty",
                status: "$$it.status",

                variant: {
                  $let: {
                    vars: {
                      v: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$variants",
                              as: "v",
                              cond: {
                                $eq: ["$$v._id", "$$it.variantId"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: {
                      _id: "$$v._id",
                      sku: "$$v.sku",
                      attributes: "$$v.attributes",
                      productId: "$$v.productId",
                    },
                  },
                },

                productName: {
                  $let: {
                    vars: {
                      p: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$products",
                              as: "p",
                              cond: {
                                $eq: ["$$p._id", "$$it.productId"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$p.name",
                  },
                },
              },
            },
          },
        },
      },

      /* ================= CLEAN OUTPUT ================= */
      {
        $project: {
          _id: 1,
          transferNo: 1,
          status: 1,
          totalItems: 1,
          createdAt: 1,

          fromBranch: {
            _id: "$fromBranch._id",
            name: "$fromBranch.name",
            code: "$fromBranch.code",
          },
          toBranch: {
            _id: "$toBranch._id",
            name: "$toBranch.name",
            code: "$toBranch.code",
          },

          items: 1,
        },
      },
    ])
    .toArray();

  if (!transfer) {
    throw new Error("Transfer not found");
  }

  return {
    success: true,
    data: transfer,
  };
};