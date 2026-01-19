// modules/accounting/closing/yearClosing.controller.js
import { yearClosingService } from "./yearClosing.service.js";

export const closeFinancialYear = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const result = await yearClosingService({
      db,
      fiscalYearEndDate: new Date(req.body.fiscalYearEndDate),
      retainedEarningsAccountId: req.accounts.RETAINED_EARNINGS,
      branchId: req.body.branchId || null
    });

    res.json({
      success: true,
      message: "Financial year closed successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
