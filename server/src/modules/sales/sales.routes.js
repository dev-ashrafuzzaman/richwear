import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  reprintSale,
  reprintSaleByInvoice,
} from "./reprint/sales.reprint.controller.js";

import { beforeCreateSale } from "./sales.hook.js";
import { createSale } from "./sales.controller.js";
import { getPaymentMethods } from "./sales.service.js";
import { getAll } from "../../controllers/base.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  beforeCreateSale,
  createSale,
);

router.get(
  "/:saleId/reprint",
  reprintSale,
);
router.get(
  "/",
  getAll({
    collection: "sales",
    searchableFields: ["name", "invoiceNo"],
    filterableFields: ["status", "type"]
  })
);

router.get(
  "/reprint/:invoiceNo",
  reprintSaleByInvoice,
);


router.get(
  "/payment-methods",
  getPaymentMethods,
);

export default router;
