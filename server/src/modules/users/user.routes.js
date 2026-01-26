import { Router } from "express";
import {
  createOne,
  getAll,
  getOneById,
  updateOne,
  deleteOne,
} from "../../controllers/base.controller.js";
import { COLLECTIONS } from "../../database/collections.js";
import { createUser, me } from "./users.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();
const COLLECTION = COLLECTIONS.USERS;
router.use(authenticate);

router.get("/me", me);

router.post("/", createUser);

router.get(
  "/",
  getAll({
    collection: COLLECTION,
    searchableFields: ["name", "email", "roleName"],
    filterableFields: ["status", "branchId"],
    projection: { password: 0 },
  }),
);

router.get(
  "/:id",
  getOneById({
    collection: COLLECTION,
    projection: { password: 0 },
  }),
);

router.delete(
  "/:id",
  deleteOne({
    collection: COLLECTION,
  }),
);

export default router;
