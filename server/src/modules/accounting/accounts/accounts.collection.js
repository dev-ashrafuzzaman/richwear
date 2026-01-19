import { ObjectId } from "mongodb";
import { nowDate } from "../../../utils/date";

export const createAccount = async (db, payload) => {
  return db.collection("accounts").insertOne({
    code: payload.code,
    name: payload.name,
    type: payload.type,        // ASSET | LIABILITY | INCOME | EXPENSE | EQUITY
    subType: payload.subType,  // CASH | BANK | SALES | CUSTOMER | SUPPLIER
    parentId: payload.parentId ? new ObjectId(payload.parentId) : null,
    isSystem: payload.isSystem ?? true,
    branchId: payload.branchId || null,
    status: "ACTIVE",
    createdAt: nowDate(),
    updatedAt: nowDate()
  });
};
