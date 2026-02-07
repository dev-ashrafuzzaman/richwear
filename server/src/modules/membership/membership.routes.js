// membership.routes.js
import express from "express";
import { createMembershipCtrl, getMembershipsCtrl } from "./membership.controller.js";
import { createMembershipSchema } from "./membership.schema.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = express.Router();

router.post(
  "/",
  validate(createMembershipSchema),
  createMembershipCtrl
);


router.get("/", getMembershipsCtrl);

export default router;
