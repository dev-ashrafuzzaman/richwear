// modules/accounting/reports/balanceSheet.routes.js
import { Router } from "express";
import { authenticate } from "../../../../middlewares/auth.middleware.js";

import { getBalanceSheet } from "./balanceSheet.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  getBalanceSheet
);

export default router;
// GET /api/accounting/reports/balance-sheet?to=2026-01-31
