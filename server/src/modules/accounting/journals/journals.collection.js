import { ObjectId } from "mongodb";
import { nowDate } from "../../../utils/date.js";

export const insertJournal = async (db, journal) => {
  return db.collection("journals").insertOne({
    date: journal.date,
    refType: journal.refType,
    refId: journal.refId ? new ObjectId(journal.refId) : null,
    narration: journal.narration,
    branchId: journal.branchId || null,
    entries: journal.entries.map((e) => ({
      accountId: new ObjectId(e.accountId),
      debit: e.debit || 0,
      credit: e.credit || 0,
    })),
    totalDebit: journal.totalDebit,
    totalCredit: journal.totalCredit,
    createdAt: nowDate(),
  });
};
