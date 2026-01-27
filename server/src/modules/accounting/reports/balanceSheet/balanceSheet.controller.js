// modules/accounting/reports/balanceSheet.controller.js
import { balanceSheetReport } from "./balanceSheet.report.js";

// balanceSheet.controller.js
export const getBalanceSheet = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    let toDate = new Date();

    if (req.query.to) {
      toDate = new Date(req.query.to);
      // 🔥 IMPORTANT: set end of day
      toDate.setHours(23, 59, 59, 999);
    }

    const report = await balanceSheetReport({
      db,
      toDate,
      branchId: req.query.branchId || null,
    });

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};
