// modules/accounting/reports/customerStatement/customerStatement.controller.js
import { customerStatementReport } from "./customerStatement.report.js";

export const getCustomerStatement = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const data = await customerStatementReport({
      db,
      customerAccountId: req.params.customerAccountId,
      fromDate: req.query.from ? new Date(req.query.from) : null,
      toDate: req.query.to ? new Date(req.query.to) : null,
      branchId: req.query.branchId || null
    });

    res.json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};
