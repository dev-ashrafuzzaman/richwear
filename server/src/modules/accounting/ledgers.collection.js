import { ObjectId } from "mongodb";

export const insertLedger = async (db, payload) => {
  return db.collection("ledgers").insertOne({
    accountId: new ObjectId(payload.accountId),
    relatedEntityType: payload.relatedEntityType || null,
    relatedEntityId: payload.relatedEntityId
      ? new ObjectId(payload.relatedEntityId)
      : null,
    debit: payload.debit || 0,
    credit: payload.credit || 0,
    balance: payload.balance,
    refType: payload.refType,
    refId: payload.refId ? new ObjectId(payload.refId) : null,
    narration: payload.narration,
    date: payload.date,
    createdAt: new Date()
  });
};
