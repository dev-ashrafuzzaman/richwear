import { ObjectId } from "mongodb";
import { insertJournal } from "./journals.collection.js";
import { insertLedger } from "../ledgers/ledgers.collection.js";
import { validateJournalBusinessRules } from "./journals.rules.js";
import { generateCode } from "../../../utils/codeGenerator.js";
import { COLLECTIONS } from "../../../database/collections.js";

export const postJournalEntry = async ({
  db,
  session,
  date,
  refType,
  refId,
  narration,
  entries,
  branchId = null,
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

  /* ======================
     2. BRANCH LOOKUP
  ====================== */
  let branchCode = null;

  if (branchId) {
    const branch = await db
      .collection("branches")
      .findOne({ _id: new ObjectId(branchId) }, { session });

    if (!branch) {
      throw new Error("Branch not found");
    }

    // assuming branch.code = "DHK" / "CTG"
    branchCode = branch.code;
  }
  const voucherNo = await generateCode({
    db,
    module: "JOURNAL",
    prefix: "JV",
    scope: "YEAR",
    branch: branchCode, // DHK | CTG
    padding: 10,
    session,
  });

  const journalRes = await insertJournal(db, {
    voucherNo,
    date,
    refType,
    refId,
    narration,
    entries,
    totalDebit,
    totalCredit,
    branchId,
    session,
  });

  const journalId = journalRes.insertedId;

  for (const e of entries) {
    const last = await db
      .collection(COLLECTIONS.LEDGERS)
      .find({ accountId: new ObjectId(e.accountId), branchId }, { session })
      .sort({ date: -1, createdAt: -1 }) // ✅ safer
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
      date,
      branchId,

      partyType: e.partyType,
      partyId: e.partyId,
      journalId,
      voucherNo,
      session,
    });
  }
    return {
    _id: journalId,
    voucherNo,
    totalDebit,
    totalCredit,
  };
  
};

export const createJournalService = async ({ db, payload, session }) => {
  const { entries } = payload;

  // 🔥 REAL validation
  const { totalDebit, totalCredit } = validateJournalBusinessRules(entries);

  await postJournalEntry({
    db,
    session,
    date: payload.date,
    refType: payload.refType,
    refId: payload.refId,
    narration: payload.narration,
    branchId: payload.branchId,
    entries,
    totalDebit,
    totalCredit,
  });

  return true;
};
