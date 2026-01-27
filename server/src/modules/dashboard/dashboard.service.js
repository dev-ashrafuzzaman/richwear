import {
  getSummary,
  getSalesChart,
  getTopCategories,
  getLowStock,
  getRecentTransactions,
  getPerformanceMetrics,
} from "./dashboard.aggregations.js";

export const getDashboardService = async ({
  db,
  branchId,
  from,
  to,
}) => {
  const [summary, salesData, topCategories, lowStockProducts, recentTransactions, performance] =
    await Promise.all([
      getSummary(db, branchId, from, to),
      getSalesChart(db, branchId, from, to),
      getTopCategories(db, branchId, from, to),
      getLowStock(db, branchId),
      getRecentTransactions(db, branchId),
      getPerformanceMetrics(db, branchId, from, to),
    ]);

  return {
    summary,
    salesData,
    topCategories,
    lowStockProducts,
    recentTransactions,
    performance,
  };
};
