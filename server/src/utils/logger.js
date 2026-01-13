import { nowDate } from "./date.js";

export const writeAuditLog = async ({
  db,
  userId = null,
  action,
  collection = "auth",
  documentId = null,
  payload = {},
  ipAddress = null,
  userAgent = null
}) => {
  await db.collection("audit_logs").insertOne({
    userId,
    action,
    collection,
    documentId,
    payload,
    ipAddress,
    userAgent,
    createdAt: nowDate()
  });
};
