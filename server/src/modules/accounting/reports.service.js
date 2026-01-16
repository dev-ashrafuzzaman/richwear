export const profitLossReport = async (db) => {

  const income = await db.collection("ledgers").aggregate([
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "acc"
      }
    },
    { $unwind: "$acc" },
    { $match: { "acc.type": "INCOME" } },
    { $group: { _id: null, total: { $sum: "$credit" } } }
  ]).toArray();

  const expense = await db.collection("ledgers").aggregate([
    {
      $lookup: {
        from: "accounts",
        localField: "accountId",
        foreignField: "_id",
        as: "acc"
      }
    },
    { $unwind: "$acc" },
    { $match: { "acc.type": "EXPENSE" } },
    { $group: { _id: null, total: { $sum: "$debit" } } }
  ]).toArray();

  return {
    income: income[0]?.total || 0,
    expense: expense[0]?.total || 0,
    profit: (income[0]?.total || 0) - (expense[0]?.total || 0)
  };
};
