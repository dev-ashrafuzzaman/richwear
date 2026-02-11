import { Router } from "express";

import { authenticate } from "../../../middlewares/auth.middleware.js";
import {
  createSalarySheetController,
  getSalarySheetDetails,
  getSalarySheets,
  paySalaryController,
} from "./payroll.controller.js";

const router = Router();
router.use(authenticate);

router.get("/salary-sheets", getSalarySheets);
router.get("/salary-sheets/:id", getSalarySheetDetails);

router.post("/salary-sheets", createSalarySheetController);
router.post("/pay-salary", paySalaryController);

export default router;
