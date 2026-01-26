import { ObjectId } from "mongodb";

export const getProducts = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    /* ---------------- Pagination ---------------- */
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    /* ---------------- Query Params ---------------- */
    const {
      search,
      categoryId,
      parentCategoryId,
      hasVariant,
      status = "active",
      color,
      size,
      sort = "latest",
    } = req.query;

    /* ---------------- Match Builder ---------------- */
    const match = { status };

    if (hasVariant !== undefined) {
      match.hasVariant = hasVariant === "true";
    }

    if (categoryId) {
      match.categoryId = new ObjectId(categoryId);
    }

    /* ---------------- Aggregation ---------------- */
    const pipeline = [
      { $match: match },

      /* 🔗 Sub Category */
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: "$subCategory" },

      /* 🔗 Parent Category */
      {
        $lookup: {
          from: "categories",
          localField: "subCategory.parentId",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      { $unwind: "$parentCategory" },

      /* 🎯 Parent Category Filter */
      ...(parentCategoryId
        ? [
            {
              $match: {
                "parentCategory._id": new ObjectId(parentCategoryId),
              },
            },
          ]
        : []),

      /* 🔗 Variants */
      {
        $lookup: {
          from: "product_variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$productId"] },
              },
            },

            ...(color ? [{ $match: { "attributes.color": color } }] : []),
            ...(size ? [{ $match: { "attributes.size": size } }] : []),
          ],
          as: "variants",
        },
      },

      /* 🔍 Search */
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { brand: { $regex: search, $options: "i" } },
                  { productCode: { $regex: search, $options: "i" } },
                  { "variants.sku": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      /* 💰 Min Price (for sorting) */
      {
        $addFields: {
          minSalePrice: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] },
              { $min: "$variants.salePrice" },
              null,
            ],
          },
        },
      },
      {
        $addFields: {
          defaultCostPrice: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] },
              { $min: "$variants.costPrice" },
              null,
            ],
          },
          defaultSalePrice: {
            $cond: [
              { $gt: [{ $size: "$variants" }, 0] },
              { $min: "$variants.salePrice" },
              null,
            ],
          },
        },
      },

      /* ↕ Sorting */
      {
        $sort:
          sort === "price"
            ? { minSalePrice: 1 }
            : sort === "name"
              ? { name: 1 }
              : { createdAt: -1 },
      },

      /* 📄 Facet for pagination */
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                brand: 1,
                productCode: 1,
                unit: 1,
                status: 1,
                defaultCostPrice: 1,
                defaultSalePrice: 1,
                sizeConfig: 1,
                colors: 1,
                hasVariant: 1,
                category: {
                  parent: "$parentCategory.name",
                  sub: "$subCategory.name",
                },
                variants: {
                  $map: {
                    input: "$variants",
                    as: "v",
                    in: {
                      _id: "$$v._id",
                      sku: "$$v.sku",
                      attributes: "$$v.attributes",
                      salePrice: "$$v.salePrice",
                      costPrice: "$$v.costPrice",
                    },
                  },
                },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await db
      .collection("products")
      .aggregate(pipeline)
      .toArray();

    const data = result[0].data;
    const total = result[0].total[0]?.count || 0;

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getProductsForPurchase = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    /* ---------------- Pagination ---------------- */
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    /* ---------------- Query ---------------- */
    const { search, categoryId, parentCategoryId } = req.query;

    const match = { status: "active" };

    if (categoryId) {
      match.categoryId = new ObjectId(categoryId);
    }

    /* ---------------- Pipeline ---------------- */
    const pipeline = [
      { $match: match },

      /* 🔗 Sub Category */
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: "$subCategory" },

      /* 🔗 Parent Category */
      {
        $lookup: {
          from: "categories",
          localField: "subCategory.parentId",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      { $unwind: "$parentCategory" },

      /* 🎯 Parent Category Filter */
      ...(parentCategoryId
        ? [
            {
              $match: {
                "parentCategory._id": new ObjectId(parentCategoryId),
              },
            },
          ]
        : []),

      /* 🔗 EXISTING VARIANTS (PRICE MEMORY ONLY) */
      {
        $lookup: {
          from: "product_variants",
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$productId", "$$productId"] },
              },
            },
            {
              $project: {
                _id: 0,
                size: "$attributes.size",
                color: "$attributes.color",
                costPrice: 1,
                salePrice: 1,
              },
            },
          ],
          as: "variantPrices",
        },
      },

      /* 🔍 Search */
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { name: { $regex: search, $options: "i" } },
                  { brand: { $regex: search, $options: "i" } },
                  { productCode: { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),

      /* 📄 Facet */
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                name: 1,
                brand: 1,
                productCode: 1,
                unit: 1,
                hasVariant: 1,
                sizeType: 1,
                sizeConfig: 1,
                colors: 1,

                /* 👇 OLD PRICE MEMORY */
                variantPrices: 1,

                category: {
                  parent: "$parentCategory.name",
                  sub: "$subCategory.name",
                },
              },
            },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const result = await db
      .collection("products")
      .aggregate(pipeline)
      .toArray();

    const data = result[0]?.data || [];
    const total = result[0]?.total[0]?.count || 0;

    res.json({
      success: true,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    });
  } catch (err) {
    next(err);
  }
};
