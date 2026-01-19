// modules/accounting/reports/trialBalance.report.js
import { ObjectId } from "mongodb";

export const trialBalanceReport = async ({
  db,
  fromDate,
  toDate,
  branchId = null
}) => {
  const match = {
    date: { $lte: toDate }
  };

  if (fromDate) {
    match.date.$gte = fromDate;
  }

  if (branchId) {
    match.branchId = branchId;
  }

  const data = await db.collection("ledgers").aggregate([
    { $match: match },
    {
      $group: {
        _id: "$accountId",
        totalDebit: { $sum: "$debit" },
        totalCredit: { $sum: "$credit" },
        balance: { $last: "$balance" }
      }
    },
    {
      $lookup: {
        from: "accounts",
        localField: "_id",
        foreignField: "_id",
        as: "account"
      }
    },
    { $unwind: "$account" },
    {
      $project: {
        accountId: "$_id",
        code: "$account.code",
        name: "$account.name",
        type: "$account.type",
        totalDebit: 1,
        totalCredit: 1,
        balance: 1
      }
    },
    { $sort: { code: 1 } }
  ]).toArray();

  let grandDebit = 0;
  let grandCredit = 0;

  const rows = data.map(row => {
    const debitBalance =
      row.balance > 0 &&
      ["ASSET", "EXPENSE"].includes(row.type)
        ? row.balance
        : 0;

    const creditBalance =
      row.balance > 0 &&
      ["LIABILITY", "INCOME", "EQUITY"].includes(row.type)
        ? row.balance
        : 0;

    grandDebit += debitBalance;
    grandCredit += creditBalance;

    return {
      accountId: row.accountId,
      code: row.code,
      name: row.name,
      totalDebit: row.totalDebit,
      totalCredit: row.totalCredit,
      closingDebit: debitBalance,
      closingCredit: creditBalance
    };
  });

  return {
    rows,
    totalDebit: grandDebit,
    totalCredit: grandCredit,
    isBalanced: grandDebit === grandCredit
  };
};
