// modules/accounting/reports/profitLossAdvanced.report.js

import { trialBalanceReport } from "../trialBalance/trialBalance.report.js";

/**
 * Utility: sum rows safely
 */
const sum = (rows, filterFn, side) =>
  rows.filter(filterFn).reduce((t, r) => t + (r[side] || 0), 0);

/**
 * CORE P&L CALCULATION FROM TRIAL BALANCE
 */
const calculatePL = (tb) => {
  const rows = tb.rows;

  /**
   * SALES (INCOME)
   * - Sales return already reduces closingCredit
   */
  const sales = sum(
    rows,
    (r) => r.type === "INCOME" && r.code === "3001",
    "closingCredit"
  );

  /**
   * OTHER INCOME (optional)
   */
  const otherIncome = sum(
    rows,
    (r) => r.type === "INCOME" && r.code !== "3001",
    "closingCredit"
  );

  /**
   * COST OF GOODS SOLD
   */
  const cogs = sum(
    rows,
    (r) => r.type === "EXPENSE" && r.code === "4007",
    "closingDebit"
  );

  /**
   * OPERATING EXPENSE (EXCLUDING COGS)
   */
  const operatingExpense = sum(
    rows,
    (r) =>
      r.type === "EXPENSE" &&
      r.code !== "4007",
    "closingDebit"
  );

  /**
   * PROFIT CALCULATION
   */
  const grossProfit = sales - cogs;
  const netProfit = grossProfit - operatingExpense + otherIncome;

  return {
    sales,
    cogs,
    grossProfit,
    expense: operatingExpense,
    otherIncome,
    netProfit,
  };
};

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

  const current = calculatePL(currentTB);

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

    comparative = calculatePL(cmpTB);
  }

  /**
   * FINAL RESPONSE
   */
  return {
    period: {
      fromDate,
      toDate,
    },
    current,
    comparative,
  };
};
