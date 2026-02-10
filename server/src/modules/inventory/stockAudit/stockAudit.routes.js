import express from "express";
import { validate } from "../../../middlewares/validate.middleware.js";

import {
  startAudit,
  scanItem,
  updateQty,
  submitAudit,
  approveAudit
} from "./stockAudit.controller.js";

import {
  startAuditSchema,
  scanSchema,
  updateQtySchema
} from "./stockAudit.validation.js";

const router = express.Router();

router.post(
  "/",
  validate(startAuditSchema),
  startAudit
);

router.post(
  "/:auditId/scan",
  validate(scanSchema),
  scanItem
);

router.patch(
  "/:auditId/items/:itemId",
  validate(updateQtySchema),
  updateQty
);

router.post(
  "/:auditId/submit",
  submitAudit
);

router.post(
  "/:auditId/approve",
  approveAudit
);

export default router;
