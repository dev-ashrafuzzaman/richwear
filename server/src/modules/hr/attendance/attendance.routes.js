import { Router } from "express";
import { ObjectId } from "mongodb";

import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";
import { COLLECTIONS } from "../../../database/collections.js";

import { punchInSchema, punchOutSchema } from "./attendance.validation.js";

import { beforePunchIn } from "./attendance.hook.js";
import { calculateAttendance } from "./attendance.utils.js";
import { validate } from "../../../middlewares/validate.middleware.js";

const router = Router();
router.use(authenticate);

/* 🟢 Punch In */
router.post(
  "/punch-in",
  permit(PERMISSIONS.ATTENDANCE_MANAGE),
  validate(punchInSchema),
  beforePunchIn,
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;

      const doc = {
        ...req.attendanceData,
        punchIn: req.body.punchIn,
        source: req.body.source,
        status: "present",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection(COLLECTIONS.ATTENDANCES).insertOne(doc);

      res.json({
        success: true,
        message: "Punch in successful",
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  },
);

/* 🔵 Punch Out */
router.put(
  "/:id/punch-out",
  permit(PERMISSIONS.ATTENDANCE_MANAGE),
  validate(punchOutSchema),
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;

      const attendance = await db
        .collection(COLLECTIONS.ATTENDANCES)
        .findOne({ _id: new ObjectId(req.params.id) });

      if (!attendance || attendance.punchOut) {
        return res.status(400).json({
          success: false,
          message: "Invalid punch out",
        });
      }

      const calc = calculateAttendance({
        punchIn: attendance.punchIn,
        punchOut: req.body.punchOut,
      });

      await db.collection(COLLECTIONS.ATTENDANCES).updateOne(
        { _id: attendance._id },
        {
          $set: {
            punchOut: req.body.punchOut,
            ...calc,
            updatedAt: new Date(),
          },
        },
      );

      res.json({
        success: true,
        message: "Punch out successful",
        data: calc,
      });
    } catch (err) {
      next(err);
    }
  },
);

/* 📊 Get attendance */
router.get("/", permit(PERMISSIONS.ATTENDANCE_VIEW), async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const filter = {};
    if (req.query.employeeId)
      filter.employeeId = new ObjectId(req.query.employeeId);
    if (req.query.branchId) filter.branchId = new ObjectId(req.query.branchId);

    const data = await db
      .collection(COLLECTIONS.ATTENDANCES)
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
