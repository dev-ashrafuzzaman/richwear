import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
  toggleStatus,
} from "../../controllers/base.controller.js";

import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.validation.js";

import { beforeCreateSupplier } from "./supplier.hook.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.SUPPLIERS;

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.SUPPLIER_MANAGE),
  beforeCreateSupplier,
  createOne({
    collection: COLLECTION,
    schema: createSupplierSchema,
  }),
);

router.get(
  "/",
  permit(PERMISSIONS.SUPPLIER_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "phone", "email"],
    filterableFields: ["status"],
  }),
);

router.get(
  "/:id",
  permit(PERMISSIONS.SUPPLIER_VIEW),
  getOneById({
    collection: COLLECTION,
  }),
);

router.put(
  "/:id",
  permit(PERMISSIONS.SUPPLIER_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateSupplierSchema,
  }),
);

router.post(
  "/:id/status",
  permit(PERMISSIONS.SUPPLIER_MANAGE),
  toggleStatus({
    collection: COLLECTION,
  })
);


router.delete(
  "/:id",
  permit(PERMISSIONS.SUPPLIER_MANAGE),
  deleteOne({
    collection: COLLECTION,
  }),
);

export default router;
