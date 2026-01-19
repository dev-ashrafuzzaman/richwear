export const cashFlowReport = async (db, from, to, branchId = null) => {
  return db.collection("ledgers").aggregate([
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
        "acc.subType": { $in: ["CASH", "BANK"] },
        ...(branchId && { branchId })
      }
    },
    {
      $group: {
        _id: "$acc.subType",
        inflow: { $sum: "$debit" },
        outflow: { $sum: "$credit" }
      }
    }
  ]).toArray();
};
