import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";
import { smartAttendance } from "./attendance.smart.controller.js";

const router = Router();
router.use(authenticate);


router.post(
  "/today",
  authenticate,
  permit(PERMISSIONS.ATTENDANCE_MANAGE),
  smartAttendance
);


export default router;
