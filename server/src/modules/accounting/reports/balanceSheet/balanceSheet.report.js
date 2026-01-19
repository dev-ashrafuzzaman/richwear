import { ObjectId } from "mongodb";

export const balanceSheetReport = async ({ db, toDate, branchId = null }) => {
  /* =========================
     MATCH
  ========================== */
  const match = {
    date: { $lte: toDate },
  };

  if (branchId) {
    match.branchId = new ObjectId(branchId);
  }

  /* =========================
     AGGREGATE LEDGER
  ========================== */
  const rows = await db
    .collection("ledgers")
    .aggregate([
      { $match: match },

      {
        $group: {
          _id: "$accountId",
          totalDebit: { $sum: "$debit" },
          totalCredit: { $sum: "$credit" },
        },
      },

      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "_id",
          as: "account",
        },
      },
      { $unwind: "$account" },

      {
        $addFields: {
          net: { $subtract: ["$totalDebit", "$totalCredit"] },
        },
      },

      {
        $project: {
          code: "$account.code",
          name: "$account.name",
          type: "$account.type",
          net: 1,
        },
      },

      { $sort: { code: 1 } },
    ])
    .toArray();

  /* =========================
     SPLIT SECTIONS
  ========================== */
  const assets = [];
  const liabilities = [];
  const equity = [];

  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  for (const r of rows) {
    const net = r.net;
    const amount = Math.abs(net);
    if (amount === 0) continue;

    if (r.type === "ASSET") {
      if (net > 0) {
        assets.push({ code: r.code, name: r.name, amount: net });
        totalAssets += net;
      } else if (net < 0) {
        // negative asset → liability (overdraft)
        liabilities.push({
          code: r.code,
          name: `${r.name} (Overdraft)`,
          amount: Math.abs(net),
        });
        totalLiabilities += Math.abs(net);
      }
    }

    // LIABILITY
    if (r.type === "LIABILITY" && net < 0) {
      liabilities.push({
        code: r.code,
        name: r.name,
        amount: Math.abs(net),
      });
      totalLiabilities += Math.abs(net);
    }

    // EQUITY
    if (r.type === "EQUITY" && net < 0) {
      equity.push({
        code: r.code,
        name: r.name,
        amount: Math.abs(net),
      });
      totalEquity += Math.abs(net);
    }
  }

  /* =========================
     CURRENT PROFIT / LOSS
  ========================== */
  const pnl = await db
    .collection("ledgers")
    .aggregate([
      { $match: match },

      {
        $lookup: {
          from: "accounts",
          localField: "accountId",
          foreignField: "_id",
          as: "acc",
        },
      },
      { $unwind: "$acc" },

      {
        $match: {
          "acc.type": { $in: ["INCOME", "EXPENSE"] },
        },
      },

      {
        $group: {
          _id: "$acc.type",
          debit: { $sum: "$debit" },
          credit: { $sum: "$credit" },
        },
      },
    ])
    .toArray();

  const income = pnl.find((x) => x._id === "INCOME")?.credit || 0;
  const expense = pnl.find((x) => x._id === "EXPENSE")?.debit || 0;
  const profit = income - expense;

  if (profit !== 0) {
    equity.push({
      code: "P&L",
      name: "Current Period Profit/Loss",
      amount: profit,
    });
    totalEquity += profit;
  }

  /* =========================
     FINAL
  ========================== */
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
