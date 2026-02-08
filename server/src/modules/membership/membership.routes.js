// membership.routes.js
import express from "express";
import { createMembershipCtrl, getMembershipsCtrl } from "./membership.controller.js";
import { createMembershipSchema } from "./membership.schema.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { getAll } from "../../controllers/base.controller.js";
import { updateLoyaltySettings } from "./membership.service.js";

const router = express.Router();

router.post(
  "/",
  validate(createMembershipSchema),
  createMembershipCtrl
);

router.get(
  "/loyalty",
  getAll({
    collection: "loyalty_settings",
    searchableFields: ["name", "phone", "email","employment.role"],
    filterableFields: ["status","employment.role"],
  }),
);
router.put("/loyalty", updateLoyaltySettings);
router.get("/", getMembershipsCtrl);

export default router;
