import { Router } from "express";
import * as roleController from "./role.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createRoleSchema,
  updateRoleSchema
} from "./role.validation.js";
import { PERMISSIONS } from "../../config/permissions.js";

const router = Router();

router.post(
  "/",
  authenticate,
  permit(PERMISSIONS.ROLE_MANAGE),
  validate(createRoleSchema),
  roleController.create
);

router.get(
  "/",
  authenticate,
  permit(PERMISSIONS.ROLE_MANAGE),
  roleController.list
);

router.get(
  "/:id",
  authenticate,
  permit(PERMISSIONS.ROLE_MANAGE),
  roleController.getById
);

router.put(
  "/:id",
  authenticate,
  permit(PERMISSIONS.ROLE_MANAGE),
  validate(updateRoleSchema),
  roleController.update
);

router.delete(
  "/:id",
  authenticate,
  permit(PERMISSIONS.ROLE_MANAGE),
  roleController.remove
);

export default router;
