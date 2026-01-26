import { Router } from "express";
import {
  createPurchaseController,
  createPurchaseReturnController,
} from "./purchase.controller.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  getAllPurchaseReturns,
  getAllPurchases,
  getSinglePurchaseInvoice,
  getSinglePurchaseReturnInvoice,
} from "./purchase.service.js";

const router = Router();

router.use(authenticate);

router.post("/", createPurchaseController);
router.post("/return", createPurchaseReturnController);

router.get("/", getAllPurchases);
router.get("/return", getAllPurchaseReturns);
router.get("/:id", getSinglePurchaseInvoice);

router.get("/return/:id", getSinglePurchaseReturnInvoice);

export default router;
