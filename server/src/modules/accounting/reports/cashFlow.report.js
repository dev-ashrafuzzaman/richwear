// modules/accounting/reports/cashFlow.report.js

import { balanceSheetReport } from "./balanceSheet/balanceSheet.report.js";
import { profitLossAdvancedReport } from "./profitLoss/profitLossAdvanced.report.js";

/**
 * Utility: get amount safely from BS section
 */
const getAmount = (list, code) =>
  list.find((x) => x.code === code)?.amount || 0;

export const cashFlowReport = async ({
  db,
  fromDate,
  toDate,
  branchId = null,
}) => {
  /* ===============================
     STEP 1: NET PROFIT (P&L)
  =============================== */
  const pnl = await profitLossAdvancedReport({
    db,
    fromDate,
    toDate,
    branchId,
  });

  const netProfit = pnl.current?.netProfit || 0;

  /* ===============================
     STEP 2: OPENING & CLOSING BS
  =============================== */
  const openingDate = new Date(fromDate);
  openingDate.setMilliseconds(openingDate.getMilliseconds() - 1);

  const openingBS = await balanceSheetReport({
    db,
    toDate: openingDate,
    branchId,
  });

  const closingBS = await balanceSheetReport({
    db,
    toDate,
    branchId,
  });

  /* ===============================
     STEP 3: WORKING CAPITAL
     (ASSET ↑ = CASH OUT,
      LIABILITY ↑ = CASH IN)
  =============================== */

  /* ---- Accounts Receivable ---- */
  const arOpening = getAmount(openingBS.assets, "1004");
  const arClosing = getAmount(closingBS.assets, "1004");
  const changeInAR = arClosing - arOpening;

  /* ---- Inventory ---- */
  const invOpening = getAmount(openingBS.assets, "1003");
  const invClosing = getAmount(closingBS.assets, "1003");
  const changeInInventory = invClosing - invOpening;

  /* ---- Accounts Payable (Supplier) ----
     CREDIT  → Payable (Liability)
     DEBIT   → Advance (Asset)
     Net AP  = Payable - Advance
  */
  const apOpening =
    getAmount(openingBS.liabilities, "2001") -
    getAmount(openingBS.assets, "2001");

  const apClosing =
    getAmount(closingBS.liabilities, "2001") -
    getAmount(closingBS.assets, "2001");

  const changeInAP = apClosing - apOpening;

  /* ===============================
     STEP 4: CASH FROM OPERATIONS
     (INDIRECT METHOD)
  =============================== */
  const cashFromOperations =
    netProfit
    - changeInAR            // ↑ AR = cash out
    - changeInInventory     // ↑ Inventory = cash out
    + changeInAP;           // ↑ AP = cash in

  /* ===============================
     FINAL RESPONSE
  =============================== */
  return {
    success: true,

    period: {
      from: fromDate,
      to: toDate,
    },

    operating: {
      netProfit,

      adjustments: {
        increaseInReceivable: changeInAR,
        increaseInInventory: changeInInventory,
        increaseInPayable: changeInAP,
      },

      cashFromOperations,
    },

    investing: [],   // future: fixed assets, investments
    financing: [],   // future: capital, loan, drawings

    netCashFlow: cashFromOperations,
  };
};
