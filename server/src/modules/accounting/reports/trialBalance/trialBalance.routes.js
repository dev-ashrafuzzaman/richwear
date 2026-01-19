// modules/accounting/reports/trialBalance.routes.js
import { Router } from "express";
import { authenticate } from "../../../../middlewares/auth.middleware.js";
import { permit } from "../../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../../config/permissions.js";

import { getTrialBalance } from "./trialBalance.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/accounting/reports/trial-balance
 * @query   from, to, branchId
 */
router.get("/", permit(PERMISSIONS.ACCOUNT_VIEW), getTrialBalance);

export default router;
// GET /api/accounting/reports/trial-balance?from=2026-01-01&to=2026-01-31
