import { ensureIndex } from "../../../database/indexManager.js";

export async function salarySheetIndexes(db) {
  const col = db.collection("salary_sheets");

  // Unique
  await ensureIndex(col, { branchId: 1, month: 1 }, { unique: true });
}
