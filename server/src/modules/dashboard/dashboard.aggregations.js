export const getSummary = async (db, branchId, from, to) => {
  const match = {
    ...(branchId && { branchId }),
    ...(from && to && { date: { $gte: new Date(from), $lte: new Date(to) } }),
  };

  const [sales] = await db
    .collection("sales")
    .aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const products = await db.collection("products").countDocuments();
  const customers = await db.collection("customers").countDocuments();

  return {
    revenue: { value: sales?.revenue || 0, change: 0, trend: "up" },
    orders: { value: sales?.orders || 0, change: 0, trend: "up" },
    products: { value: products, change: 0, trend: "down" },
    customers: { value: customers, change: 0, trend: "up" },
  };
};
export const getSalesChart = async (db, branchId, from, to) => {
  return db
    .collection("sales")
    .aggregate([
      {
        $match: {
          ...(branchId && { branchId }),
          ...(from && to && {
            date: { $gte: new Date(from), $lte: new Date(to) },
          }),
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$date" },
          sales: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $arrayElemAt: [
              ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
              { $subtract: ["$_id", 1] },
            ],
          },
          sales: 1,
          orders: 1,
        },
      },
      { $sort: { date: 1 } },
    ])
    .toArray();
};

export const getTopCategories = async (db, branchId, from, to) => {
  return db
    .collection("sales_items")
    .aggregate([
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
        $group: {
          _id: "$product.categoryId",
          sales: { $sum: "$lineTotal" },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          name: "$category.name",
          value: { $round: [{ $multiply: [{ $divide: ["$sales", 100000] }, 100] }, 1] },
          sales: "$sales",
          color: "#3B82F6",
        },
      },
      { $limit: 5 },
    ])
    .toArray();
};

export const getLowStock = async (db, branchId) => {
  return db
    .collection("variants")
    .find({
      ...(branchId && { branchId }),
      stockQty: { $lte: 10 },
    })
    .project({
      name: 1,
      sku: 1,
      stock: "$stockQty",
      threshold: "$minStock",
      category: 1,
    })
    .limit(5)
    .toArray();
};
export const getRecentTransactions = async (db, branchId) => {
  return db
    .collection("sales")
    .find({ ...(branchId && { branchId }) })
    .sort({ createdAt: -1 })
    .limit(5)
    .project({
      id: "$invoiceNo",
      customer: "$customerName",
      amount: "$totalAmount",
      items: "$totalQty",
      status: "$status",
      time: {
        $dateToString: { format: "%I:%M %p", date: "$createdAt" },
      },
    })
    .toArray();
};
export const getPerformanceMetrics = async (db, branchId, from, to) => {
  const [result] = await db
    .collection("sales")
    .aggregate([
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          items: { $sum: "$totalQty" },
        },
      },
    ])
    .toArray();

  return {
    conversion: 4.2, // optional analytics later
    avgOrder: result ? result.revenue / result.orders : 0,
    itemsPerOrder: result ? result.items / result.orders : 0,
  };
};
