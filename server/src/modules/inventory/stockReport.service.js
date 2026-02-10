import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";

export async function buildStockReport({ user, filters }) {
  const db = getDB();

  /* =====================================================
     1️⃣ BRANCH RESOLUTION (RBAC SAFE)
  ===================================================== */
  let branchId = user.branchId;

  if (["Super Admin", "Admin"].includes(user.roleName)) {
    if (!filters.branchId)
      throw new Error("Branch required");
    branchId = filters.branchId;
  }

  const match = {
    branchId: new ObjectId(branchId),
  };

  if (filters.productId)
    match.productId = new ObjectId(filters.productId);

  if (filters.variantId)
    match.variantId = new ObjectId(filters.variantId);

  /* =====================================================
     2️⃣ BASE PIPELINE
  ===================================================== */
  const pipeline = [
    { $match: match },

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

    /* ---------- Product Type ---------- */
    {
      $lookup: {
        from: "product_types",
        localField: "product.productTypeId",
        foreignField: "_id",
        as: "productType",
      },
    },
    { $unwind: "$productType" },

    /* ---------- Sub Category ---------- */
    {
      $lookup: {
        from: "categories",
        localField: "product.categoryId",
        foreignField: "_id",
        as: "subCategory",
      },
    },
    { $unwind: "$subCategory" },

    /* ---------- Main Category ---------- */
    {
      $lookup: {
        from: "categories",
        localField: "subCategory.parentId",
        foreignField: "_id",
        as: "mainCategory",
      },
    },
    { $unwind: "$mainCategory" },

    /* =====================================================
       3️⃣ NORMALIZED PROJECTION
    ===================================================== */
    {
      $project: {
        branchId: 1,

        qty: "$qty",

        sku: "$variant.sku",
        size: "$variant.attributes.size",
        color: "$variant.attributes.color",

        productId: "$product._id",
        productName: "$product.name",

        productTypeId: "$productType._id",
        productTypeName: "$productType.name",

        subCategoryId: "$subCategory._id",
        subCategoryName: "$subCategory.name",

        mainCategoryId: "$mainCategory._id",
        mainCategoryName: "$mainCategory.name",

        costPrice: "$variant.costPrice",
        salePrice: "$variant.salePrice",

        costValue: {
          $multiply: ["$qty", "$variant.costPrice"],
        },
        saleValue: {
          $multiply: ["$qty", "$variant.salePrice"],
        },
        margin: {
          $multiply: [
            "$qty",
            {
              $subtract: [
                "$variant.salePrice",
                "$variant.costPrice",
              ],
            },
          ],
        },
      },
    },
  ];

  /* =====================================================
     4️⃣ DYNAMIC GROUP BY ENGINE
  ===================================================== */
  const groupBy = filters.groupBy || "variant";

  const groupMap = {
    branch: {
      _id: "$branchId",
      name: { $first: "$branchId" },
    },

    category_main: {
      _id: "$mainCategoryId",
      name: { $first: "$mainCategoryName" },
    },

    category_sub: {
      _id: "$subCategoryId",
      name: { $first: "$subCategoryName" },
    },

    product_type: {
      _id: "$productTypeId",
      name: { $first: "$productTypeName" },
    },

    product: {
      _id: "$productId",
      name: { $first: "$productName" },
    },

    variant: {
      _id: "$sku",
      sku: { $first: "$sku" },
      size: { $first: "$size" },
      color: { $first: "$color" },
    },
  };

  const groupStage = {
    $group: {
      ...groupMap[groupBy],
      totalQty: { $sum: "$qty" },
      totalCost: { $sum: "$costValue" },
      totalSale: { $sum: "$saleValue" },
      totalMargin: { $sum: "$margin" },
    },
  };

  pipeline.push(groupStage);

  /* =====================================================
     5️⃣ FINAL SORT (CLEAN OUTPUT)
  ===================================================== */
  pipeline.push({
    $sort: { totalQty: -1 },
  });

  /* =====================================================
     6️⃣ EXECUTE
  ===================================================== */
  return db.collection("stocks").aggregate(pipeline).toArray();
}
