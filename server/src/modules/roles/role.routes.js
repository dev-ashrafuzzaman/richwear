import { Router } from "express";
import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne
} from "../../controllers/base.controller.js";

import {
  createRoleSchema,
  updateRoleSchema
} from "./role.validation.js";

import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";

const router = Router();
const COLLECTION = "roles";


router.post(
  "/",
  permit(PERMISSIONS.ROLE_MANAGE),
  createOne({
    collection: COLLECTION,
    schema: createRoleSchema
  })
);


router.get(
  "/",
  permit(PERMISSIONS.ROLE_MANAGE),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name"],
    filterableFields: ["status"]
  })
);


router.get(
  "/:id",
  permit(PERMISSIONS.ROLE_MANAGE),
  getOneById({
    collection: COLLECTION
  })
);


router.put(
  "/:id",
  permit(PERMISSIONS.ROLE_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateRoleSchema
  })
);


router.delete(
  "/:id",
  permit(PERMISSIONS.ROLE_MANAGE),
  deleteOne({
    collection: COLLECTION
  })
);

export default router;
