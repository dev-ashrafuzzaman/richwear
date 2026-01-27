// modules/accounting/reports/profitLossAdvanced.report.js

import { trialBalanceReport } from "../trialBalance/trialBalance.report.js";

const sumByType = (rows, type, side) =>
  rows
    .filter((r) => r.type === type)
    .reduce((t, r) => t + (r[side] || 0), 0);

export const profitLossAdvancedReport = async ({
  db,
  fromDate,
  toDate,
  compareFrom = null,
  compareTo = null,
  branchId = null,
}) => {
  /**
   * CURRENT PERIOD
   */
  const currentTB = await trialBalanceReport({
    db,
    fromDate,
    toDate,
    branchId,
  });

  const sales = sumByType(currentTB.rows, "INCOME", "closingCredit");
  const cogs = currentTB.rows
    .filter((r) => r.subType === "COGS")
    .reduce((t, r) => t + r.closingDebit, 0);

  const expense = sumByType(currentTB.rows, "EXPENSE", "closingDebit");
  const otherIncome = currentTB.rows
    .filter((r) => r.subType === "OTHER")
    .reduce((t, r) => t + r.closingCredit, 0);

  const grossProfit = sales - cogs;
  const netProfit = grossProfit - (expense - cogs) + otherIncome;

  const current = {
    sales,
    cogs,
    grossProfit,
    expense,
    otherIncome,
    netProfit,
  };

  /**
   * COMPARATIVE PERIOD
   */
  let comparative = null;

  if (compareFrom && compareTo) {
    const cmpTB = await trialBalanceReport({
      db,
      fromDate: compareFrom,
      toDate: compareTo,
      branchId,
    });

    const cmpSales = sumByType(cmpTB.rows, "INCOME", "closingCredit");
    const cmpCogs = cmpTB.rows
      .filter((r) => r.subType === "COGS")
      .reduce((t, r) => t + r.closingDebit, 0);

    const cmpExpense = sumByType(cmpTB.rows, "EXPENSE", "closingDebit");
    const cmpOtherIncome = cmpTB.rows
      .filter((r) => r.subType === "OTHER")
      .reduce((t, r) => t + r.closingCredit, 0);

    const cmpGross = cmpSales - cmpCogs;
    const cmpNet = cmpGross - (cmpExpense - cmpCogs) + cmpOtherIncome;

    comparative = {
      sales: cmpSales,
      cogs: cmpCogs,
      grossProfit: cmpGross,
      expense: cmpExpense,
      otherIncome: cmpOtherIncome,
      netProfit: cmpNet,
    };
  }

  return {
    period: { fromDate, toDate },
    current,
    comparative,
  };
};
