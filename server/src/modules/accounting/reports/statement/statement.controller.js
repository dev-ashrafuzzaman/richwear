import { partyStatementReport } from "./statement.report.js";

export const getPartyStatement = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const data = await partyStatementReport({
      db,
      partyId: req.params.partyId,
      fromDate: req.query.from ? new Date(req.query.from) : null,
      toDate: req.query.to ? new Date(req.query.to) : null,
      branchId: req.query.branchId || null
    });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
