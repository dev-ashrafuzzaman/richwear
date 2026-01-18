import express from "express";
import {validate} from "../../middlewares/validate.middleware.js";
import * as controller from "./customer.controller.js";
import { beforeCreateCustomer } from "./customer.hooks.js";
import {
  createCustomerSchema,
  updateCustomerSchema
} from "./customer.schema.js";

const router = express.Router();

router.post(
  "/",
  validate(createCustomerSchema),
  beforeCreateCustomer,
  controller.create
);

router.get("/:id", controller.getById);
router.patch(
  "/:id",
  validate(updateCustomerSchema),
  controller.update
);

export default router;
