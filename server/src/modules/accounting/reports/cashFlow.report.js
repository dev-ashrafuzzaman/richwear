// modules/accounting/reports/cashFlow.report.js

import { balanceSheetReport } from "./balanceSheet/balanceSheet.report.js";
import { profitLossAdvancedReport } from "./profitLoss/profitLossAdvanced.report.js";

export const cashFlowReport = async ({
  db,
  fromDate,
  toDate,
  branchId = null,
}) => {
  /**
   * STEP 1: Net Profit (from ADVANCED P&L)
   */
  const pnl = await profitLossAdvancedReport({
    db,
    fromDate,
    toDate,
    branchId,
  });

  const netProfit = pnl.current?.netProfit || 0;

  /**
   * STEP 2: Opening & Closing Balance Sheet
   */
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

  /**
   * Helpers
   */
  const getAmount = (list, code) =>
    list.find((x) => x.code === code)?.amount || 0;

  /**
   * STEP 3: Working Capital Changes
   */
  const arOpening = getAmount(openingBS.assets, "1004"); // Accounts Receivable
  const arClosing = getAmount(closingBS.assets, "1004");

  const apOpening = getAmount(openingBS.liabilities, "2001"); // Accounts Payable
  const apClosing = getAmount(closingBS.liabilities, "2001");

  const changeInAR = arClosing - arOpening; // ↑ AR = cash out
  const changeInAP = apClosing - apOpening; // ↑ AP = cash in

  /**
   * STEP 4: Cash From Operations (Indirect Method)
   */
  const cashFromOperations =
    netProfit - changeInAR + changeInAP;

  return {
    period: { from: fromDate, to: toDate },

    operating: {
      netProfit,
      adjustments: {
        increaseInReceivable: changeInAR,
        increaseInPayable: changeInAP,
      },
      cashFromOperations,
    },

    investing: [],
    financing: [],

    netCashFlow: cashFromOperations,
  };
};