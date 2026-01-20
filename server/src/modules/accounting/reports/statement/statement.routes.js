// statement.routes.js
import { Router } from "express";
import { getPartyStatement } from "./statement.controller.js";

const router = Router();

/**
 * Universal Ledger Statement
 * GET /api/accounting/reports/statement/:accountId
?from=2026-01-01
&to=2026-01-31
&branchId=xxx
 *
 * GET /api/accounting/reports/statement/:accountId
 */
/**
 * Party Statement
 * Customer / Supplier / Employee
 */
router.get("/party/:partyId", getPartyStatement);


export default router;
