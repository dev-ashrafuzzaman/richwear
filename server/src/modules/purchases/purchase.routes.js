import { Router } from "express";
import { createPurchaseController, createPurchaseReturnController } from "./purchase.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.PURCHASE_MANAGE),
  createPurchaseController
);
router.post(
  "/return",
  permit(PERMISSIONS.PURCHASE_MANAGE),
  createPurchaseReturnController
);

export default router;
