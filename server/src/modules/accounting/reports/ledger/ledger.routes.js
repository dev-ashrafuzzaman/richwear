// modules/accounting/reports/ledger/ledger.routes.js
import { Router } from "express";
import {
  getLedger,
  getLedgerSummary,
  getLedgerAging
} from "./ledger.controller.js";

const router = Router();

/**
 * Single Ledger Statement
 */
router.get("/:accountId", getLedger);

/**
 * Ledger Summary / Due
 */
router.post("/summary", getLedgerSummary);

/**
 * Aging Report
 */
router.get("/:accountId/aging", getLedgerAging);

export default router;
