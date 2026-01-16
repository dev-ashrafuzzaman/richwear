import { insertJournal } from "./journals.collection.js";
import { insertLedger } from "./ledgers.collection.js";
import { ObjectId } from "mongodb";

export const postJournalEntry = async ({
  db,
  date,
  refType,
  refId,
  narration,
  entries
}) => {

  let totalDebit = 0;
  let totalCredit = 0;

  entries.forEach(e => {
    totalDebit += e.debit || 0;
    totalCredit += e.credit || 0;
  });

  if (totalDebit !== totalCredit) {
    throw new Error("Debit and Credit mismatch");
  }

  const journalRes = await insertJournal(db, {
    date,
    refType,
    refId,
    narration,
    entries,
    totalDebit,
    totalCredit
  });

  for (const e of entries) {
    const last = await db.collection("ledgers")
      .find({ accountId: new ObjectId(e.accountId) })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const lastBalance = last[0]?.balance || 0;
    const balance = lastBalance + (e.debit || 0) - (e.credit || 0);

    await insertLedger(db, {
      accountId: e.accountId,
      debit: e.debit,
      credit: e.credit,
      balance,
      refType,
      refId,
      narration,
      date
    });
  }

  return journalRes;
};
