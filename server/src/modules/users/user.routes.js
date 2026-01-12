import { Router } from "express";
import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne
} from "../../controllers/base.controller.js";

import {
  createUserSchema,
  updateUserSchema
} from "./user.validation.js";

import {
  beforeCreateUser,
  beforeUpdateUser
} from "./user.hooks.js";

import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";

const router = Router();
const COLLECTION = "users";


router.post(
  "/",
  permit(PERMISSIONS.USER_MANAGE),
  beforeCreateUser,
  createOne({
    collection: COLLECTION,
    schema: createUserSchema
  })
);


router.get(
  "/",
  permit(PERMISSIONS.USER_MANAGE),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "email"],
    filterableFields: ["status", "branchId"],
    projection: { password: 0 }
  })
);


router.get(
  "/:id",
  permit(PERMISSIONS.USER_MANAGE),
  getOneById({
    collection: COLLECTION,
    projection: { password: 0 }
  })
);


router.put(
  "/:id",
  permit(PERMISSIONS.USER_MANAGE),
  beforeUpdateUser,
  updateOne({
    collection: COLLECTION,
    schema: updateUserSchema
  })
);


router.delete(
  "/:id",
  permit(PERMISSIONS.USER_MANAGE),
  deleteOne({
    collection: COLLECTION
  })
);

export default router;
