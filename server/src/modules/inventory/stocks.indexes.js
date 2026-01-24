import { ensureIndex } from "../../database/indexManager.js";

export async function stocksIndexes(db) {
  const col = db.collection("stocks");

  await ensureIndex(
    col,
    { branchId: 1, variantId: 1 },
    { unique: true, name: "uniq_stock_branch_variant" }
  );

  await ensureIndex(col, { branchId: 1 }, { name: "idx_stock_branch" });
  await ensureIndex(col, { variantId: 1 }, { name: "idx_stock_variant" });
}
