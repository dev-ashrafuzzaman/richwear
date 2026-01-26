// modules/accounting/reports/profitLoss.routes.js
import { Router } from "express";
import { getProfitLoss } from "./profitLoss.controller.js";
import { authenticate } from "../../../../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/profit-loss",
  getProfitLoss
);

export default router;
// GET /api/accounting/reports/profit-loss?from=2026-01-01&to=2026-01-31
