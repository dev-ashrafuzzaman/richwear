import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
  toggleStatus
} from "../../controllers/base.controller.js";

import {
  createVariantSchema,
  updateVariantSchema
} from "./variant.validation.js";

import { beforeCreateVariant } from "./variant.hooks.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";
import { getVariants } from "./variants.controller.js";

const router = Router();
const COLLECTION = COLLECTIONS.VARIANTS;

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  beforeCreateVariant,
  createOne({
    collection: COLLECTION,
    schema: createVariantSchema
  })
);

router.get(
  "/attributes",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getAll({
    collection: COLLECTIONS.ATTRIBUTES,
    searchableFields: ["name", "type"],
    filterableFields: ["status", "type"]
  })
);


router.get(
  "/",
  authenticate,
  permit(PERMISSIONS.PRODUCT_VIEW),
  getVariants
);


router.get(
  "/:id",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getOneById({ collection: COLLECTION })
);


router.put(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateVariantSchema
  })
);


router.post(
  "/:id/status",
  permit(PERMISSIONS.VARIANT_MANAGE),
  toggleStatus({
    collection: COLLECTION,
  })
);

router.delete(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  deleteOne({ collection: COLLECTION })
);

export default router;
