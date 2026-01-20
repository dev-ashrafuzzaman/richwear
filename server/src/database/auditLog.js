
export const writeAuditLog = async ({
  db,
  userId,
  action,
  collection,
  documentId,
  payload = {},
}) => {
  await db.collection("audit_logs").insertOne({
    userId,
    action,
    collection,
    documentId,
    payload,
    createdAt: new Date(),
  });
};
