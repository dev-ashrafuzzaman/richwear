import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
  toggleStatus,
  createOneTx
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
import { attachSession } from "../../middlewares/attachSession.js";
import { getProducts, getProductsForPurchase } from "./product.controller.js";

const router = Router();
const COLLECTION = COLLECTIONS.PRODUCTS;

router.use(authenticate);


// router.post(
//   "/",
//   permit(PERMISSIONS.PRODUCT_MANAGE),
//   beforeCreateProduct,
//   createOne({
//     collection: COLLECTION,
//     schema: createProductSchema
//   })
// );

router.post(
  "/",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  attachSession,
  beforeCreateProduct,
  createOneTx({
    collection: COLLECTION,
    schema: createProductSchema,
  })
);

// router.get(
//   "/",
//   permit(PERMISSIONS.PRODUCT_VIEW),
//   getAll({
//     collection: COLLECTION,
//     searchableFields: ["name", "sku", "brand"],
//     filterableFields: ["status", "categoryId"]
//   })
// );

router.get(
  "/",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getProducts
);
router.get(
  "/purchase",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getProductsForPurchase
);
router.get(
  "/types",
  permit(PERMISSIONS.PRODUCT_VIEW),
  getAll({
    collection: COLLECTIONS.PRODUCT_TYPES,
    searchableFields: ["name", "code"],
    filterableFields: ["status"]
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


router.post(
  "/:id/status",
  permit(PERMISSIONS.PRODUCT_MANAGE),
  toggleStatus({
    collection: COLLECTION,
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
