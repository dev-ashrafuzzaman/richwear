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
  createBranchSchema,
  updateBranchSchema
} from "./branch.validation.js";

import {
  beforeCreateBranch,
  beforeUpdateBranch
} from "./branch.hooks.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.BRANCHES;

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.BRANCH_MANAGE),
  beforeCreateBranch,
  createOne({
    collection: COLLECTION,
    schema: createBranchSchema
  })
);

router.get(
  "/",
  permit(PERMISSIONS.BRANCH_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "code", "address"],
    filterableFields: ["status", "isMain"]
  })
);

router.get(
  "/:id",
  permit(PERMISSIONS.BRANCH_VIEW),
  getOneById({
    collection: COLLECTION
  })
);

router.put(
  "/:id",
  permit(PERMISSIONS.BRANCH_MANAGE),
  beforeUpdateBranch,
  updateOne({
    collection: COLLECTION,
    schema: updateBranchSchema
  })
);

router.post(
  "/:id/status",
  permit(PERMISSIONS.BRANCH_MANAGE),
  toggleStatus({
    collection: COLLECTION,
  })
);

router.delete(
  "/:id",
  permit(PERMISSIONS.BRANCH_MANAGE),
  deleteOne({
    collection: COLLECTION
  })
);

export default router;
