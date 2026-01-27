import { COLLECTIONS } from "../../../database/collections.js";
import { ensureIndex } from "../../../database/indexManager.js";

export async function ledgersIndexes(db) {
  const col = db.collection(COLLECTIONS.LEDGERS);

  /* ------------------------------------------------
   * 1️⃣ Trial Balance / Year Closing
   * ------------------------------------------------
   * Used for:
   * - Trial Balance
   * - P&L
   * - Balance Sheet
   * - Year Closing
   */
  await ensureIndex(
    col,
    { branchId: 1, date: 1, accountId: 1 },
    { name: "idx_ledger_tb_match" }
  );

  /* ------------------------------------------------
   * 2️⃣ Party Running Statement (🔥 MOST USED)
   * ------------------------------------------------
   * Used for:
   * - Supplier statement
   * - Customer statement
   * - Opening balance
   * - Running balance
   */
  await ensureIndex(
    col,
    { partyId: 1, branchId: 1, date: 1, createdAt: 1 },
    { name: "idx_party_statement" }
  );

  /* ------------------------------------------------
   * 3️⃣ Invoice-wise Grouping + Aging
   * ------------------------------------------------
   * Used for:
   * - Invoice statement
   * - Aging report
   */
  await ensureIndex(
    col,
    { partyId: 1, branchId: 1, refId: 1, date: 1 },
    { name: "idx_party_invoice_group" }
  );

  /* ------------------------------------------------
   * 4️⃣ Reference lookup (Audit / Rollback)
   * ------------------------------------------------ */
  await ensureIndex(
    col,
    { refType: 1, refId: 1 },
    { name: "idx_ledger_ref" }
  );
}
