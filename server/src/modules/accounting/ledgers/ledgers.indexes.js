import { ensureIndex } from "../../../database/indexManager.js";

export async function ledgersIndexes(db) {
  const col = db.collection("ledgers");

  await ensureIndex(
    col,
    { branchId: 1, accountId: 1, date: 1 },
    { name: "idx_ledger_account_date" }
  );

  await ensureIndex(
    col,
    { refType: 1, refId: 1 },
    { name: "idx_ledger_ref" }
  );
}
