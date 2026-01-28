// modules/accounting/reports/balanceSheet.report.js
import { ObjectId } from "mongodb";
import { trialBalanceReport } from "../trialBalance/trialBalance.report.js";

export const balanceSheetReport = async ({ db, toDate, branchId = null }) => {
  /**
   * STEP 1: Get Trial Balance (single source of truth)
   */
  const tb = await trialBalanceReport({
    db,
    toDate,
    branchId,
  });

  const assets = [];
  const liabilities = [];
  const equity = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  /**
   * STEP 2: Classify using ACCOUNT TYPE + DR/CR
   * (NO net calculation here)
   */
  for (const row of tb.rows) {
    // ASSETS → Debit balance
    if (row.type === "ASSET" && row.closingDebit > 0) {
      assets.push({
        code: row.code,
        name: row.name,
        amount: row.closingDebit,
      });
      totalAssets += row.closingDebit;
    }

// LIABILITY with credit balance → Liability
if (row.type === "LIABILITY" && row.closingCredit > 0) {
  liabilities.push({
    code: row.code,
    name: row.name,
    amount: row.closingCredit,
  });
  totalLiabilities += row.closingCredit;
}

// LIABILITY with debit balance → Asset (Advance)
if (row.type === "LIABILITY" && row.closingDebit > 0) {
  assets.push({
    code: row.code,
    name: `${row.name} (Advance)`,
    amount: row.closingDebit,
  });
  totalAssets += row.closingDebit;
}

    // EQUITY → Credit balance
    if (row.type === "EQUITY" && row.closingCredit > 0) {
      equity.push({
        code: row.code,
        name: row.name,
        amount: row.closingCredit,
      });
      totalEquity += row.closingCredit;
    }
  }

  /**
   * STEP 3: Add Current Period Profit/Loss (ONCE)
   * (Only if Income & Expense are NOT closed)
   */
  let income = 0;
  let expense = 0;

  for (const row of tb.rows) {
    if (row.type === "INCOME") income += row.closingCredit;
    if (row.type === "EXPENSE") expense += row.closingDebit;
  }

  const profit = income - expense;

  if (profit !== 0) {
    equity.push({
      code: "P&L",
      name: "Current Period Profit / Loss",
      amount: profit,
    });
    totalEquity += profit;
  }

  /**
   * STEP 4: FINAL OUTPUT
   */
  return {
    asOf: toDate,
    assets,
    liabilities,
    equity,
    totals: {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalEquity,
      liabilitiesPlusEquity: totalLiabilities + totalEquity,
      isBalanced: totalAssets === totalLiabilities + totalEquity,
    },
  };
};
