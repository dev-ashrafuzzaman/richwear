import { ensureIndex } from "../../database/indexManager.js";

export async function purchasesIndexes(db) {
  const col = db.collection("purchases");

  await ensureIndex(col, { purchaseNo: 1 }, { unique: true, name: "uniq_purchase_no" });
  await ensureIndex(col, { branchId: 1 }, { name: "idx_purchase_branch" });
  await ensureIndex(col, { supplierId: 1 }, { name: "idx_purchase_supplier" });
  await ensureIndex(col, { createdAt: -1 }, { name: "idx_purchase_createdAt" });
}
