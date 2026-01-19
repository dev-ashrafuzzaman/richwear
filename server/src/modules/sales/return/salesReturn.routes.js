import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";
import { createSalesReturn } from "./salesReturn.controller.js";

const router = Router();

router.use(authenticate);

router.post(
  "/:saleId/return",
  permit(PERMISSIONS.SALES_RETURN),
  createSalesReturn,
);

export default router;
