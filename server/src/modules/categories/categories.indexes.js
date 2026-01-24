import { ensureIndex } from "../../database/indexManager.js";

export async function categoriesIndexes(db) {
  const col = db.collection("categories");

  await ensureIndex(col, { parentId: 1 }, { name: "idx_category_parent" });
  await ensureIndex(col, { level: 1 }, { name: "idx_category_level" });
  await ensureIndex(col, { name: 1 }, { name: "idx_category_name" });
}
