// modules/accounting/reports/trialBalance.controller.js
import { trialBalanceReport } from "./trialBalance.report.js";

export const getTrialBalance = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const report = await trialBalanceReport({
      db,
      fromDate: req.query.from ? new Date(req.query.from) : null,
      toDate: req.query.to ? new Date(req.query.to) : new Date(),
      branchId: req.query.branchId || null,
    });

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
};
