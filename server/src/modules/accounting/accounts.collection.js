import { ObjectId } from "mongodb";

export const createAccount = async (db, payload) => {
  return db.collection("accounts").insertOne({
    code: payload.code,
    name: payload.name,
    type: payload.type,       // ASSET | LIABILITY | INCOME | EXPENSE | EQUITY
    subType: payload.subType, // CASH | BANK | SUPPLIER | CUSTOMER | etc
    parentId: payload.parentId ? new ObjectId(payload.parentId) : null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
