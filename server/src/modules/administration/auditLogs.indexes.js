import { ensureIndex } from "../../database/indexManager.js";

export async function auditLogsIndexes(db) {
  const col = db.collection("audit_logs");

  await ensureIndex(col, { action: 1 }, { name: "idx_audit_action" });
  await ensureIndex(col, { refType: 1, refId: 1 }, { name: "idx_audit_ref" });
  await ensureIndex(
    col,
    { branchId: 1, createdAt: -1 },
    { name: "idx_audit_branch_date" }
  );
  await ensureIndex(
    col,
    { userId: 1, createdAt: -1 },
    { name: "idx_audit_user_date" }
  );
}
