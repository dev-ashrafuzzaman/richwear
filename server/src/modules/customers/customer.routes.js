import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne
} from "../../controllers/base.controller.js";

import {
  createCustomerSchema,
  updateCustomerSchema
} from "./customer.validation.js";

import { beforeCreateCustomer } from "./customer.hooks.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.CUSTOMERS;

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.CUSTOMER_MANAGE),
  beforeCreateCustomer,
  createOne({
    collection: COLLECTION,
    schema: createCustomerSchema
  })
);

router.get(
  "/",
  permit(PERMISSIONS.CUSTOMER_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "phone", "email"],
    filterableFields: ["status"]
  })
);

router.get(
  "/:id",
  permit(PERMISSIONS.CUSTOMER_VIEW),
  getOneById({
    collection: COLLECTION
  })
);

router.put(
  "/:id",
  permit(PERMISSIONS.CUSTOMER_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateCustomerSchema
  })
);

router.delete(
  "/:id",
  permit(PERMISSIONS.CUSTOMER_MANAGE),
  deleteOne({
    collection: COLLECTION
  })
);

export default router;
