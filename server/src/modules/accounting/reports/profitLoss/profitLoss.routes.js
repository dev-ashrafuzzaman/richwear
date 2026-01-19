// modules/accounting/reports/profitLoss.routes.js
import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";

import { getProfitLoss } from "./profitLoss.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/accounting/reports/profit-loss
 * @query   from, to, branchId
 */
router.get(
  "/profit-loss",
  permit(PERMISSIONS.ACCOUNT_VIEW),
  getProfitLoss
);

export default router;
// GET /api/accounting/reports/profit-loss?from=2026-01-01&to=2026-01-31
