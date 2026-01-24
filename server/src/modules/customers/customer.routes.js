import express from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import * as controller from "./customer.controller.js";
import { beforeCreateCustomer } from "./customer.hooks.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
} from "./customer.schema.js";
import { deleteOne, getAll, getAllSmart, toggleStatus } from "../../controllers/base.controller.js";
import { COLLECTIONS } from "../../database/collections.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";

const router = express.Router();

router.post(
  "/",
  validate(createCustomerSchema),
  beforeCreateCustomer,
  controller.create,
);
router.get(
  "/",
  permit(PERMISSIONS.CUSTOMERS_VIEW),
  getAll({
    collection: COLLECTIONS.CUSTOMERS,
    searchableFields: ["name", "phone", "email"],
    filterableFields: ["status"],
  }),
);

router.get(
  "/pos",
  permit(PERMISSIONS.CUSTOMERS_VIEW),
  getAllSmart({
    collection: COLLECTIONS.CUSTOMERS,
    searchableFields: ["name", "phone"],
    filterableFields: ["status"],
  })
);

router.get("/:id", controller.getById);
router.patch("/:id", validate(updateCustomerSchema), controller.update);

router.post(
  "/:id/status",
  permit(PERMISSIONS.CUSTOMERS_MANAGE),
  toggleStatus({
    collection: COLLECTIONS.CUSTOMERS,
  })
);

router.delete(
  "/:id",
  permit(PERMISSIONS.CUSTOMERS_MANAGE),
  deleteOne({ collection: COLLECTIONS.CUSTOMERS })
);

export default router;
