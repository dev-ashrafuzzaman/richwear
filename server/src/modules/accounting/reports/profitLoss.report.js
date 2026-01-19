export const profitLossReport = async (db, from, to, branchId = null) => {
  const data = await db.collection("ledgers").aggregate([
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
      $match: {
        date: { $gte: from, $lte: to },
        "acc.type": { $in: ["INCOME", "EXPENSE"] },
        ...(branchId && { branchId })
      }
    },
    {
      $group: {
        _id: "$acc.type",
        debit: { $sum: "$debit" },
        credit: { $sum: "$credit" }
      }
    }
  ]).toArray();

  const income = data.find(d => d._id === "INCOME")?.credit || 0;
  const expense = data.find(d => d._id === "EXPENSE")?.debit || 0;

  return {
    income,
    expense,
    profit: income - expense
  };
};
