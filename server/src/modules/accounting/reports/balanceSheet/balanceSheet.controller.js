// modules/accounting/reports/balanceSheet.controller.js
import { balanceSheetReport } from "./balanceSheet.report.js";

export const getBalanceSheet = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const report = await balanceSheetReport({
      db,
      toDate: req.query.to ? new Date(req.query.to) : new Date(),
      branchId: req.query.branchId || null
    });

    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    next(err);
  }
};
