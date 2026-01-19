import { openingBalanceAccounting } from "./accounting.adapter.js";

export const createOpeningBalance = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    await openingBalanceAccounting({
      db,
      openingDate: new Date(req.body.openingDate),
      balances: req.body.balances,
      openingOffsetAccountId: req.accounts.OPENING_OFFSET, // system
      branchId: req.body.branchId || null
    });

    res.json({
      success: true,
      message: "Opening balance posted successfully"
    });
  } catch (err) {
    next(err);
  }
};
