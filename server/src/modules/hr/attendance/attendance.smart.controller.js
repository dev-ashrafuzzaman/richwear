import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../database/collections.js";
import { calculateAttendance } from "./attendance.utils.js";
import { getDB } from "../../../config/db.js";

export const smartAttendance = async (req, res, next) => {
  try {
    const db = getDB();
    const { employeeId, branchId } = req.body;

    /* 🔍 Employee */
    const employee = await db.collection(COLLECTIONS.EMPLOYEES).findOne({
      _id: new ObjectId(employeeId),
      "employment.status": "active",
    });

    if (!employee)
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive employee",
      });

    /* 🔍 Branch */
    const branch = await db.collection(COLLECTIONS.BRANCHES).findOne({
      _id: new ObjectId(branchId),
      status: "active",
    });

    if (!branch)
      return res.status(400).json({
        success: false,
        message: "Invalid branch",
      });

    /* 📅 Today normalize */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceCol = db.collection(COLLECTIONS.ATTENDANCES);

    const existing = await attendanceCol.findOne({
      employeeId: employee._id,
      date: today,
    });

    /* 🟢 CASE A: Punch In */
    if (!existing) {
      const doc = {
        employeeId: employee._id,
        branchId: branch._id,
        date: today,
        punchIn: new Date(),
        status: "present",
        source: "system",

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await attendanceCol.insertOne(doc);

      return res.json({
        success: true,
        action: "PUNCH_IN",
        message: "Punch in successful",
        data: doc,
      });
    }

    /* 🔵 CASE B: Punch Out */
    if (existing && !existing.punchOut) {
      const punchOut = new Date();

      const calc = calculateAttendance({
        punchIn: existing.punchIn,
        punchOut,
      });

      await attendanceCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            punchOut,
            ...calc,
            updatedAt: new Date(),
          },
        },
      );

      return res.json({
        success: true,
        action: "PUNCH_OUT",
        message: "Punch out successful",
        data: {
          workingMinutes: calc.workingMinutes,
          lateMinutes: calc.lateMinutes,
          status: calc.status,
        },
      });
    }

    return res.status(400).json({
      success: false,
      action: "COMPLETED",
      message: "Attendance already completed for today",
    });
  } catch (err) {
    next(err);
  }
};
