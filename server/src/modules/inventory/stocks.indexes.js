import { ensureIndex } from "../../database/indexManager.js";

export async function stocksIndexes(db) {
  const col = db.collection("stocks");

  /* ------------------------------------------------
   * 1️⃣ Uniqueness (Data Integrity)
   * ------------------------------------------------
   * One variant per branch (ERP rule)
   */
  await ensureIndex(
    col,
    { branchId: 1, variantId: 1 },
    {
      unique: true,
      name: "uniq_stock_branch_variant",
    }
  );

  /* ------------------------------------------------
   * 2️⃣ POS Barcode / SKU lookup (🔥 MOST IMPORTANT)
   * ------------------------------------------------
   * Used for:
   * - Barcode scan
   * - ENTER key select
   */
  await ensureIndex(
    col,
    { branchId: 1, sku: 1 },
    {
      name: "idx_pos_branch_sku",
    }
  );

  /* ------------------------------------------------
   * 3️⃣ POS Typing Search (TEXT INDEX)
   * ------------------------------------------------
   * Used for:
   * - Product name
   * - SKU partial
   * - Size / color
   */
  await ensureIndex(
    col,
    { branchId: 1, searchableText: "text" },
    {
      name: "idx_pos_search_text",
      weights: {
        searchableText: 10,
      },
    }
  );

  /* ------------------------------------------------
   * 4️⃣ Cursor Pagination Safety
   * ------------------------------------------------
   * Used for:
   * - Infinite scroll
   * - Stable ordering
   */
  await ensureIndex(
    col,
    { branchId: 1, sku: 1, _id: 1 },
    {
      name: "idx_pos_cursor",
    }
  );

  /* ------------------------------------------------
   * 5️⃣ Optional: Low stock alert / dashboard
   * ------------------------------------------------ */
  await ensureIndex(
    col,
    { branchId: 1, qty: 1 },
    {
      name: "idx_stock_qty",
    }
  );
}
