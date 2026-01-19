// modules/accounting/reports/balanceSheet.report.js

export const balanceSheetReport = async ({
  db,
  toDate,
  branchId = null
}) => {
  const match = {
    date: { $lte: toDate }
  };
  if (branchId) match.branchId = branchId;

  // Aggregate ledger balances by account
  const rows = await db.collection("ledgers").aggregate([
    { $match: match },
    {
      $group: {
        _id: "$accountId",
        debit: { $sum: "$debit" },
        credit: { $sum: "$credit" },
        balance: { $last: "$balance" }
      }
    },
    {
      $lookup: {
        from: "accounts",
        localField: "_id",
        foreignField: "_id",
        as: "acc"
      }
    },
    { $unwind: "$acc" },
    {
      $project: {
        accountId: "$_id",
        code: "$acc.code",
        name: "$acc.name",
        type: "$acc.type",
        subType: "$acc.subType",
        balance: 1
      }
    },
    { $sort: { code: 1 } }
  ]).toArray();

  // Split into sections
  const assets = [];
  const liabilities = [];
  const equity = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;

  for (const r of rows) {
    // Asset & Expense normally debit-balance (we only take ASSET here)
    if (r.type === "ASSET") {
      const amt = Math.max(r.balance || 0, 0);
      if (amt !== 0) {
        assets.push({ code: r.code, name: r.name, amount: amt });
        totalAssets += amt;
      }
    }

    // Liability / Equity normally credit-balance
    if (r.type === "LIABILITY") {
      const amt = Math.max(r.balance || 0, 0);
      if (amt !== 0) {
        liabilities.push({ code: r.code, name: r.name, amount: amt });
        totalLiabilities += amt;
      }
    }

    if (r.type === "EQUITY") {
      const amt = Math.max(r.balance || 0, 0);
      if (amt !== 0) {
        equity.push({ code: r.code, name: r.name, amount: amt });
        totalEquity += amt;
      }
    }
  }

  // If Retained Earnings not yet closed for the period,
  // compute current period profit and show it under Equity
  // (Income - Expense up to toDate)
  const pnlAgg = await db.collection("ledgers").aggregate([
    { $match: match },
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "acc"
      }
    },
    { $unwind: "$acc" },
    {
      $match: { "acc.type": { $in: ["INCOME", "EXPENSE"] } }
    },
    {
      $group: {
        _id: "$acc.type",
        debit: { $sum: "$debit" },
        credit: { $sum: "$credit" }
      }
    }
  ]).toArray();

  const income = pnlAgg.find(x => x._id === "INCOME")?.credit || 0;
  const expense = pnlAgg.find(x => x._id === "EXPENSE")?.debit || 0;
  const currentProfit = income - expense;

  if (currentProfit !== 0) {
    equity.push({
      code: "P&L",
      name: "Current Period Profit/Loss",
      amount: currentProfit
    });
    totalEquity += currentProfit;
  }

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
      isBalanced: totalAssets === (totalLiabilities + totalEquity)
    }
  };
};
