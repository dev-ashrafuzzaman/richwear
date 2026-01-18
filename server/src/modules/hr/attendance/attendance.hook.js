import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../database/collections.js";

export const beforePunchIn = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { employeeId, branchId } = req.body;

    /* 🔍 Employee check */
    const employee = await db.collection(COLLECTIONS.EMPLOYEES).findOne({
      _id: new ObjectId(employeeId),
      "employment.status": "active",
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive employee",
      });
    }

    /* 🔍 Branch check */
    const branch = await db.collection(COLLECTIONS.BRANCHES).findOne({
      _id: new ObjectId(branchId),
      status: "active",
    });

    if (!branch) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch",
      });
    }

    /* 📅 Normalize date */
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* 🚫 Duplicate punch-in check */
    const exists = await db.collection(COLLECTIONS.ATTENDANCES).findOne({
      employeeId: new ObjectId(employeeId),
      date: today,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Attendance already punched in today",
      });
    }

    req.attendanceData = {
      employeeId: employee._id,
      employeeCode: employee.code,
      employeeName: employee.personal.name,

      branchId: branch._id,
      branchCode: branch.code,
      branchName: branch.name,

      date: today,
    };

    next();
  } catch (err) {
    next(err);
  }
};
