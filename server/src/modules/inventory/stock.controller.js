import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";
import { formatDocuments } from "../../utils/formatedDocument.js";

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
