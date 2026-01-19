import { ObjectId } from "mongodb";
import { insertJournal } from "./journals.collection.js";
import { insertLedger } from "../ledgers/ledgers.collection.js";

export const postJournalEntry = async ({
  db,
  session,
  date,
  refType,
  refId,
  narration,
  entries,
  branchId = null
}) => {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const e of entries) {
    totalDebit += e.debit || 0;
    totalCredit += e.credit || 0;
  }

  if (totalDebit !== totalCredit) {
    throw new Error("Debit & Credit mismatch");
  }

  await insertJournal(db, {
    date,
    refType,
    refId,
    narration,
    entries,
    totalDebit,
    totalCredit,
    branchId,
    session
  });

  for (const e of entries) {
    const last = await db.collection("ledgers")
      .find({ accountId: new ObjectId(e.accountId), branchId }, { session })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();

    const lastBalance = last[0]?.balance || 0;
    const balance =
      lastBalance + (e.debit || 0) - (e.credit || 0);

    await insertLedger(db, {
      accountId: e.accountId,
      debit: e.debit,
      credit: e.credit,
      balance,
      refType,
      refId,
      narration,
      date,
      branchId,
      session

    });
  }
};
