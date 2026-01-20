// partyStatement.report.js
import { ObjectId } from "mongodb";

/**
 * Party Statement
 * Customer | Supplier | Employee | Bank
 */
export const partyStatementReport = async ({
  db,
  partyId,
  fromDate,
  toDate,
  branchId
}) => {

  const match = {
    refId: new ObjectId(partyId)
  };

  if (branchId) match.branchId = new ObjectId(branchId);

  if (fromDate || toDate) {
    match.date = {};
    if (fromDate) match.date.$gte = fromDate;
    if (toDate) match.date.$lte = toDate;
  }

  /* ---------- OPENING BALANCE ---------- */
  const opening = await db.collection("ledgers").aggregate([
    {
      $match: {
        refId: new ObjectId(partyId),
        ...(branchId && { branchId: new ObjectId(branchId) }),
        ...(fromDate && { date: { $lt: fromDate } })
      }
    },
    {
      $group: {
        _id: null,
        balance: { $sum: { $subtract: ["$debit", "$credit"] } }
      }
    }
  ]).toArray();

  let runningBalance = opening[0]?.balance || 0;

  /* ---------- STATEMENT ROWS ---------- */
  const rows = await db.collection("ledgers")
    .find(match)
    .sort({ date: 1, createdAt: 1 })
    .toArray();

  const statement = rows.map(r => {
    runningBalance += (r.debit || 0) - (r.credit || 0);

    return {
      date: r.date,
      refType: r.refType,
      voucherNo: r.narration,
      accountId: r.accountId,
      debit: r.debit || 0,
      credit: r.credit || 0,
      balance: runningBalance
    };
  });

  return {
    partyId,
    openingBalance: opening[0]?.balance || 0,
    closingBalance: runningBalance,
    totalDebit: statement.reduce((s, r) => s + r.debit, 0),
    totalCredit: statement.reduce((s, r) => s + r.credit, 0),
    rows: statement
  };
};
