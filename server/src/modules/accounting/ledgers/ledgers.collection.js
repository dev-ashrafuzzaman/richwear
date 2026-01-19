import { ObjectId } from "mongodb";
import { nowDate } from "../../../utils/date";

export const insertLedger = async (db, payload) => {
  return db.collection("ledgers").insertOne({
    accountId: new ObjectId(payload.accountId),
    debit: payload.debit || 0,
    credit: payload.credit || 0,
    balance: payload.balance,
    refType: payload.refType,
    refId: payload.refId ? new ObjectId(payload.refId) : null,
    narration: payload.narration,
    date: payload.date,
    branchId: payload.branchId || null,
    createdAt: nowDate(),
  });
};
