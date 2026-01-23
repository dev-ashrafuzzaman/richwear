import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { getActivityLogs } from "./admin.controller.js";

const router = Router();

/**
 * GET /activities
 * Filters:
 * - search
 * - action
 * - refType
 * - userId
 * - branchId
 * - dateFrom
 * - dateTo
 * - page, limit
 */
router.get(
  "/",
  authenticate,
  permit(PERMISSIONS.ACTIVITY_LOG_VIEW),
  getActivityLogs
);

export default router;
