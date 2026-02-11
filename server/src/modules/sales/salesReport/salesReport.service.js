import { ObjectId } from "mongodb";
import { getDB } from "../../../config/db.js";
import { getBDToUTCRange } from "../../../utils/dateRangeBD.js";

export async function generateSalesReport({ user, filters }) {
  const db = getDB();

  /* =====================================================
     1️⃣ RBAC
  ===================================================== */

  let branchId = user.branchId;

  if (["Admin", "Super Admin"].includes(user.roleName)) {
    if (!filters.branchId) throw new Error("Branch is required");
    branchId = filters.branchId;
  }

  if (!branchId) throw new Error("Unauthorized branch access");

  const branchObjectId = new ObjectId(branchId);

  /* =====================================================
     2️⃣ DATE RANGE
  ===================================================== */

  const { startUTC, endUTC } = getBDToUTCRange(filters.from, filters.to);

  const baseMatch = {
    branchId: branchObjectId,
    createdAt: { $gte: startUTC, $lte: endUTC },
  };

  if (filters.salespersonId) {
    baseMatch.createdBy = new ObjectId(filters.salespersonId);
  }

  /* =====================================================
     3️⃣ SALES PIPELINE
  ===================================================== */

  const pipeline = [
    { $match: baseMatch },

    {
      $lookup: {
        from: "sale_items",
        localField: "_id",
        foreignField: "saleId",
        as: "items",
      },
    },
    { $unwind: "$items" },

    {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    ...(filters.categoryId
      ? [
          {
            $match: {
              "product.categoryId": new ObjectId(filters.categoryId),
            },
          },
        ]
      : []),

    {
      $lookup: {
        from: "sales_return_items",
        localField: "items._id",
        foreignField: "saleItemId",
        as: "returns",
      },
    },

    {
      $addFields: {
        returnAmount: { $sum: "$returns.returnGross" },
        returnQty: { $sum: "$returns.qty" },
      },
    },

    {
      $project: {
        createdAt: 1,
        productId: "$items.productId",
        variantId: "$items.variantId",
        name: "$product.name",

        grossAmount: "$items.lineTotal",
        grossQty: "$items.qty",
        discountAmount: {
          $ifNull: ["$items.discount.amount", 0],
        },

        returnAmount: { $ifNull: ["$returnAmount", 0] },
        returnQty: { $ifNull: ["$returnQty", 0] },

        netRevenue: {
          $subtract: ["$items.lineTotal", { $ifNull: ["$returnAmount", 0] }],
        },

        netQty: {
          $subtract: ["$items.qty", { $ifNull: ["$returnQty", 0] }],
        },
      },
    },
  ];

  /* =====================================================
     4️⃣ GROUPING
  ===================================================== */

  const groupBy = filters.groupBy || "product";

  const groupMap = {
    product: {
      _id: "$productId",
      name: { $first: "$name" },
    },
    variant: {
      _id: "$variantId",
    },
    day: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt",
        },
      },
    },
  };

  pipeline.push({
    $group: {
      ...groupMap[groupBy],
      totalQty: { $sum: "$netQty" },
      totalRevenue: { $sum: "$netRevenue" },
      totalGross: { $sum: "$grossAmount" },
      totalReturns: { $sum: "$returnAmount" },
      totalDiscount: { $sum: "$discountAmount" },
    },
  });

  pipeline.push({ $sort: { totalRevenue: -1 } });

  const rows = await db.collection("sales").aggregate(pipeline).toArray();

  /* =====================================================
     5️⃣ NET COGS (SALE - RETURN)
  ===================================================== */

  const cogsAgg = await db.collection("journals").aggregate([
    {
      $match: {
        branchId: branchObjectId,
        refType: { $in: ["SALE_COGS", "SALE_RETURN_COGS"] },
        date: { $gte: startUTC, $lte: endUTC },
      },
    },
    { $unwind: "$entries" },
    {
      $group: {
        _id: null,
        totalCOGS: {
          $sum: {
            $cond: [
              { $eq: ["$refType", "SALE_COGS"] },
              "$entries.debit",
              { $multiply: ["$entries.credit", -1] },
            ],
          },
        },
      },
    },
  ]).toArray();

  const totalCOGS = cogsAgg[0]?.totalCOGS || 0;

  /* =====================================================
     6️⃣ PROFIT CALCULATION
  ===================================================== */

  const totalRevenue = rows.reduce((acc, r) => acc + r.totalRevenue, 0);

  rows.forEach((row) => {
    const ratio = totalRevenue > 0 ? row.totalRevenue / totalRevenue : 0;

    row.allocatedCOGS = totalCOGS * ratio;
    row.profit = row.totalRevenue - row.allocatedCOGS;
    row.margin =
      row.totalRevenue > 0
        ? (row.profit / row.totalRevenue) * 100
        : 0;
  });

  /* =====================================================
     7️⃣ SUMMARY
  ===================================================== */

  const totalOrders = await db.collection("sales").countDocuments(baseMatch);

  const totalQty = rows.reduce((acc, r) => acc + r.totalQty, 0);
  const totalGross = rows.reduce((acc, r) => acc + r.totalGross, 0);
  const totalReturns = rows.reduce((acc, r) => acc + r.totalReturns, 0);
  const totalDiscount = rows.reduce((acc, r) => acc + r.totalDiscount, 0);

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const returnRate =
    totalGross > 0 ? (totalReturns / totalGross) * 100 : 0;

  const grossMargin =
    totalRevenue > 0
      ? ((totalRevenue - totalCOGS) / totalRevenue) * 100
      : 0;

  /* =====================================================
     8️⃣ SALESPERSON ANALYTICS
  ===================================================== */

  const salespersonAnalytics = await db.collection("sales").aggregate([
    { $match: baseMatch },
    {
      $group: {
        _id: "$createdBy",
        totalSales: { $sum: "$grandTotal" },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { totalSales: -1 } },
  ]).toArray();

  /* =====================================================
     🔟 FINAL RESPONSE
  ===================================================== */

  return {
    summary: {
      totalOrders,
      totalProductsSold: totalQty,
      totalRevenue,
      totalGross,
      totalReturns,
      totalDiscount,
      totalCOGS,
      avgOrderValue,
      returnRate,
      grossMargin,
      bestSelling: rows[0] || null,
      slowSelling: rows[rows.length - 1] || null,
    },
    comparison: null,
    salespersonAnalytics,
    rows,
  };
}
