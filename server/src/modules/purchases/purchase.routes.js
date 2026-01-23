import { Router } from "express";
import {
  createPurchaseController,
  createPurchaseReturnController,
} from "./purchase.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import {
  getAllPurchaseReturns,
  getAllPurchases,
  getSinglePurchaseInvoice,
  getSinglePurchaseReturnInvoice,
} from "./purchase.service.js";

const router = Router();

router.use(authenticate);

router.post("/", permit(PERMISSIONS.PURCHASE_MANAGE), createPurchaseController);
router.post(
  "/return",
  permit(PERMISSIONS.PURCHASE_MANAGE),
  createPurchaseReturnController,
);

router.get("/", permit(PERMISSIONS.PURCHASE_MANAGE), getAllPurchases);
router.get(
  "/return",
  permit(PERMISSIONS.PURCHASE_MANAGE),
  getAllPurchaseReturns,
);
router.get("/:id", getSinglePurchaseInvoice);

router.get("/return/:id", getSinglePurchaseReturnInvoice);

export default router;
