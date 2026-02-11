import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { getAll } from "../../../controllers/base.controller.js";
import { createExpense } from "./expense.controller.js";


const router = Router();

router.use(authenticate);


router.post(
  "/",
  createExpense,
);

router.get(
  "/",
  getAll({
    collection: "expenses",
    searchableFields: ["name", "code", "address"],
    filterableFields: ["status", "isMain"]
  })
);



export default router;
