import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne
} from "../../controllers/base.controller.js";

import {
  createProductSchema,
  updateProductSchema
} from "./product.validation.js";

import { beforeCreateProduct } from "./product.hooks.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.PRODUCTS;

router.use(authenticate);


router.post(
  "/",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  beforeCreateProduct,
  createOne({
    collection: COLLECTION,
    schema: createProductSchema
  })
);


router.get(
  "/",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "sku", "brand"],
    filterableFields: ["status", "categoryId"]
  })
);

router.get(
  "/:id",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getOneById({
    collection: COLLECTION
  })
);


router.put(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateProductSchema
  })
);


router.delete(
  "/:id",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  deleteOne({
    collection: COLLECTION
  })
);

export default router;
