// modules/accounting/closing/yearClosing.routes.js
import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";

import { closeFinancialYear } from "./yearClosing.controller.js";

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/accounting/close-year
 * @body    fiscalYearEndDate, branchId?
 */
router.post(
  "/close-year",
  permit(PERMISSIONS.ACCOUNT_MANAGE),
  closeFinancialYear,
);

export default router;

// {
//   "fiscalYearEndDate": "2026-06-30",
//   "branchId": null
// }
