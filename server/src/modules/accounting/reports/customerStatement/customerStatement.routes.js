// modules/accounting/reports/customerStatement/customerStatement.routes.js
import { Router } from "express";
import { getCustomerStatement } from "./customerStatement.controller.js";

const router = Router();

/**
 * Customer Statement (Invoice Grouped)
 *
 * GET /api/accounting/reports/customer-statement/:customerAccountId
 * ?from=2026-01-01&to=2026-01-31&branchId=xxx
 */
router.get("/:customerAccountId", getCustomerStatement);

export default router;
