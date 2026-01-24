import { ensureIndex } from "../../database/indexManager.js";

export async function usersIndexes(db) {
  const col = db.collection("users");

  await ensureIndex(col, { email: 1 }, { unique: true, name: "uniq_user_email" });
  await ensureIndex(col, { status: 1 }, { name: "idx_user_status" });
  await ensureIndex(col, { "branches.branchId": 1 }, { name: "idx_user_branch" });
}
