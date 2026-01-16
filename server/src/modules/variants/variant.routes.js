import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne
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

const router = Router();
const COLLECTION = COLLECTIONS.VARIANTS;

router.use(authenticate);

/* CREATE VARIANT */
router.post(
  "/",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  beforeCreateVariant,
  createOne({
    collection: COLLECTION,
    schema: createVariantSchema
  })
);

/* GET ALL VARIANTS */
router.get(
  "/",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["sku", "attributes.size", "attributes.color"],
    filterableFields: ["productId", "status"]
  })
);

/* GET ONE */
router.get(
  "/:id",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getOneById({ collection: COLLECTION })
);

/* UPDATE */
router.put(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateVariantSchema
  })
);

/* DELETE */
router.delete(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  deleteOne({ collection: COLLECTION })
);

export default router;
