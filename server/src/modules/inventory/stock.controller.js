import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";
import { formatDocuments } from "../../utils/formatedDocument.js";
import { ensureObjectId } from "../../utils/ensureObjectId.js";

export const getAllStocks = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

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
    const db = req.app.locals.db;

    const {
      search = "",
      limit = 20,
      lastSku, // cursor pagination
      lastId,
    } = req.query;

    /* ---------------- Resolve Branch ---------------- */
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

    /* ---------------- Match (SOURCE OF TRUTH) ---------------- */
    const match = {
      branchId: new ObjectId(branchId),
      qty: { $gt: 0 },
    };

    /* ---------------- Search Strategy ---------------- */
    if (search) {
      // 🔥 Barcode / SKU mode
      if (isNumeric(search) && search.length >= 6) {
        match.sku = search;
      }
      // 🔥 Typing mode (indexed)
      else {
        match.$text = { $search: search };
      }
    }

    /* ---------------- Cursor Pagination ---------------- */
    if (lastSku && lastId) {
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
        productId: 1,
        variantId: 1,
        sku: 1,
        productName: 1,
        attributes: 1,
        salePrice: 1,
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

export const getTransferItems = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

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
    const db = req.app.locals.db;

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

export const createStockTransfer = async (req, res) => {
  const db = req.app.locals.db;
  const session = db.client.startSession();

  try {
    const { fromBranchId, toBranchId, items } = req.body;
    const userId = req.user?._id;

    /* ===================== BASIC VALIDATION ===================== */
    if (!fromBranchId || !toBranchId)
      throw new Error("Both branches are required");

    if (fromBranchId === toBranchId)
      throw new Error("Source and destination branch cannot be same");

    if (!Array.isArray(items) || !items.length)
      throw new Error("Transfer items are required");

    const normalizedItems = items.map((i) => {
      if (!i.variantId || !i.qty || i.qty <= 0)
        throw new Error("Invalid item payload");

      return {
        variantId: ensureObjectId(i.variantId),
        qty: Number(i.qty),
      };
    });

    /* ===================== TRANSACTION ===================== */
    await session.withTransaction(async () => {
      const fromBranch = ensureObjectId(fromBranchId);
      const toBranch = ensureObjectId(toBranchId);

      /* ===================== CREATE TRANSFER MASTER ===================== */
      const { insertedId: transferId } = await db
        .collection("stock_transfers")
        .insertOne(
          {
            fromBranchId: fromBranch,
            toBranchId: toBranch,
            items: normalizedItems,
            status: "COMPLETED",
            createdBy: userId ? ensureObjectId(userId) : null,
            createdAt: new Date(),
          },
          { session }
        );

      /* ===================== PROCESS EACH ITEM ===================== */
      for (const item of normalizedItems) {
        let remainingQty = item.qty;

        /* ---------- Load source stock snapshot (VERY IMPORTANT) ---------- */
        const sourceStockSnapshot = await db.collection("stocks").findOne(
          {
            branchId: fromBranch,
            variantId: item.variantId,
          },
          { session }
        );

        if (!sourceStockSnapshot)
          throw new Error("Source stock snapshot not found");

        if (sourceStockSnapshot.qty < item.qty)
          throw new Error("Insufficient stock for transfer");

        /* ---------- FIFO layers from stock_movements ---------- */
        const fifoLayers = await db
          .collection("stock_movements")
          .find(
            {
              branchId: fromBranch,
              variantId: item.variantId,
              balanceQty: { $gt: 0 },
              type: { $in: ["PURCHASE", "SALE_RETURN"] },
            },
            { session }
          )
          .sort({ createdAt: 1 }) // FIFO
          .toArray();

        const totalAvailable = fifoLayers.reduce(
          (sum, l) => sum + l.balanceQty,
          0
        );

        if (totalAvailable < remainingQty)
          throw new Error("FIFO layers mismatch with stock snapshot");

        /* ===================== FIFO CONSUMPTION ===================== */
        for (const layer of fifoLayers) {
          if (remainingQty <= 0) break;

          const consumeQty = Math.min(layer.balanceQty, remainingQty);
          remainingQty -= consumeQty;

          /* Reduce balanceQty of PURCHASE / RETURN layer */
          await db.collection("stock_movements").updateOne(
            { _id: layer._id },
            { $inc: { balanceQty: -consumeQty } },
            { session }
          );

          /* ---------- TRANSFER OUT (ledger only) ---------- */
          await db.collection("stock_movements").insertOne(
            {
              branchId: fromBranch,
              variantId: item.variantId,
              productId: sourceStockSnapshot.productId,
              type: "TRANSFER_OUT",
              qty: -consumeQty,
              costPrice: layer.costPrice,
              salePrice: layer.salePrice,
              refType: "STOCK_TRANSFER",
              refId: transferId,
              createdAt: new Date(),
            },
            { session }
          );

          /* ---------- DESTINATION PURCHASE LAYER (FIFO preserved) ---------- */
          await db.collection("stock_movements").insertOne(
            {
              branchId: toBranch,
              variantId: item.variantId,
              productId: sourceStockSnapshot.productId,
              type: "PURCHASE",
              qty: consumeQty,
              balanceQty: consumeQty,
              costPrice: layer.costPrice,
              salePrice: layer.salePrice,
              refType: "STOCK_TRANSFER",
              refId: transferId,
              createdAt: new Date(),
            },
            { session }
          );
        }

        /* ===================== UPDATE STOCK SNAPSHOTS ===================== */

        /* Source branch stock */
        await db.collection("stocks").updateOne(
          {
            branchId: fromBranch,
            variantId: item.variantId,
            qty: { $gte: item.qty },
          },
          {
            $inc: { qty: -item.qty },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        /* Destination branch stock (FULL HYDRATION) */
        await db.collection("stocks").updateOne(
          {
            branchId: toBranch,
            variantId: item.variantId,
          },
          {
            $inc: { qty: item.qty },

            $setOnInsert: {
              branchId: toBranch,
              variantId: item.variantId,

              productId: sourceStockSnapshot.productId,
              productName: sourceStockSnapshot.productName,
              attributes: sourceStockSnapshot.attributes,
              sku: sourceStockSnapshot.sku,
              salePrice: sourceStockSnapshot.salePrice,
              searchableText: sourceStockSnapshot.searchableText,

              createdAt: new Date(),
            },

            $set: {
              updatedAt: new Date(),
            },
          },
          { upsert: true, session }
        );
      }
    });

    /* ===================== SUCCESS ===================== */
    res.status(201).json({
      message: "Stock transferred successfully (FIFO compliant)",
    });
  } catch (err) {
    console.error("Stock Transfer Error:", err);
    res.status(400).json({
      message: err.message || "Stock transfer failed",
    });
  } finally {
    await session.endSession();
  }
};


