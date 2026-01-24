import { Router } from "express";

import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
  toggleStatus,
  getAllSmart,
} from "../../controllers/base.controller.js";

import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employee.validation.js";

import { beforeCreateEmployee } from "./employee.hook.js";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

const router = Router();
const COLLECTION = COLLECTIONS.EMPLOYEES;

router.use(authenticate);

router.post(
  "/",
  permit(PERMISSIONS.EMPLOYEE_MANAGE),
  beforeCreateEmployee,
  createOne({
    collection: COLLECTION,
    schema: createEmployeeSchema,
  }),
);

router.get(
  "/",
  permit(PERMISSIONS.EMPLOYEE_VIEW),
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "phone", "email"],
    filterableFields: ["status"],
  }),
);

router.get(
  "/pos",
  permit(PERMISSIONS.EMPLOYEE_VIEW),
  getAllSmart({
    collection: COLLECTIONS.EMPLOYEES,
    searchableFields: ["code", "name", "phone"],
    filterableFields: ["status"],
  })
);

router.get(
  "/:id",
  permit(PERMISSIONS.EMPLOYEE_VIEW),
  getOneById({
    collection: COLLECTION,
  }),
);

router.put(
  "/:id",
  permit(PERMISSIONS.EMPLOYEE_MANAGE),
  updateOne({
    collection: COLLECTION,
    schema: updateEmployeeSchema,
  }),
);

router.post(
  "/:id/status",
  permit(PERMISSIONS.EMPLOYEE_MANAGE),
  toggleStatus({
    collection: COLLECTION,
  })
);

router.delete(
  "/:id",
  permit(PERMISSIONS.EMPLOYEE_MANAGE),
  deleteOne({
    collection: COLLECTION,
  }),
);

export default router;
