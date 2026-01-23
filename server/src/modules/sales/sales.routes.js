import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import {
  reprintSale,
  reprintSaleByInvoice,
} from "./reprint/sales.reprint.controller.js";

import { beforeCreateSale } from "./sales.hook.js";
import { createSale } from "./sales.controller.js";
import { getPaymentMethods, getPosItems } from "./sales.service.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.SALES_CREATE),
  beforeCreateSale,
  createSale,
);

router.get(
  "/:saleId/reprint",
  permit(PERMISSIONS.SALES_VIEW),
  reprintSale,
);

router.get(
  "/reprint/:invoiceNo",
  permit(PERMISSIONS.SALES_VIEW),
  reprintSaleByInvoice,
);

// POS CONTROLLER
router.get(
  "/pos-items",
  permit(PERMISSIONS.SALES_VIEW),
  getPosItems,
);
router.get(
  "/payment-methods",
  permit(PERMISSIONS.SALES_VIEW),
  getPaymentMethods,
);

export default router;
