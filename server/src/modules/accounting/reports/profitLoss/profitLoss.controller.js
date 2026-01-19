// modules/accounting/reports/profitLoss.controller.js
import { profitLossReport } from "./profitLoss.report.js";

export const getProfitLoss = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const from = req.query.from
      ? new Date(req.query.from)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const to = req.query.to
      ? new Date(req.query.to)
      : new Date();

    const report = await profitLossReport({
      db,
      fromDate: from,
      toDate: to,
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
