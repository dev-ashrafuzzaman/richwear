import { Router } from "express";

import {
    createOne,
    getAll,
    getOneById,
    updateOne,
    deleteOne
} from "../../controllers/base.controller.js";

import {
    createCategorySchema,
    updateCategorySchema
} from "./category.validation.js";

import { beforeCreateCategory } from "./category.hooks.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.CATEGORIES;

router.use(authenticate);

router.post(
    "/",
    permit(PERMISSIONS.CATEGORY_MANAGE),
    beforeCreateCategory,
    createOne({
        collection: COLLECTION,
        schema: createCategorySchema
    })
);

router.get(
    "/",
    permit(PERMISSIONS.CATEGORY_VIEW),
    getAll({
        collection: COLLECTION,
        searchableFields: ["name"],
        filterableFields: ["status", "level", "parentId"]
    })
);

router.get(
    "/:id",
    permit(PERMISSIONS.CATEGORY_VIEW),
    getOneById({
        collection: COLLECTION
    })
);
router.put(
    "/:id",
    permit(PERMISSIONS.CATEGORY_MANAGE),
    updateOne({
        collection: COLLECTION,
        schema: updateCategorySchema
    })
);

router.delete(
    "/:id",
    permit(PERMISSIONS.CATEGORY_MANAGE),
    deleteOne({
        collection: COLLECTION
    })
);

export default router;
