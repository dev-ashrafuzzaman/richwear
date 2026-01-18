import { Router } from "express";
import { ObjectId } from "mongodb";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { permit } from "../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../config/permissions.js";
import { COLLECTIONS } from "../../database/collections.js";

import {
  generateSalarySchema,
  paySalarySchema,
} from "./payroll.validation.js";

import { beforeGenerateSalary } from "./payroll.hook.js";
import { calculateSalary } from "./payroll.utils.js";
import { validate } from "../../middlewares/validate.middleware.js";

const router = Router();
router.use(authenticate);

/* 🟢 Generate Monthly Salary */
router.post(
  "/generate",
  permit(PERMISSIONS.PAYROLL_MANAGE),
  validate(generateSalarySchema),
  beforeGenerateSalary,
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      const { branch, start, end, totalDays } =
        req.payrollContext;

      const employees = await db
        .collection(COLLECTIONS.EMPLOYEES)
        .find({
          "employment.branchId": branch._id.toString(),
          "employment.status": "active",
        })
        .toArray();

      const payrollDocs = [];

      for (const emp of employees) {
        const attendance = await db
          .collection(COLLECTIONS.ATTENDANCES)
          .find({
            employeeId: emp._id,
            date: { $gte: start, $lte: end },
          })
          .toArray();

        const presentDays = attendance.filter(
          (a) => a.status === "present"
        ).length;

        const lateDays = attendance.filter(
          (a) => a.status === "late"
        ).length;

        const absentDays =
          totalDays - presentDays - lateDays;

        const workingMinutes = attendance.reduce(
          (sum, a) => sum + (a.workingMinutes || 0),
          0
        );

        const salaryCalc = calculateSalary({
          baseSalary: emp.payroll.baseSalary,
          attendance: {
            totalDays,
            presentDays,
            lateDays,
            absentDays,
          },
        });

        payrollDocs.push({
          employeeId: emp._id,
          employeeCode: emp.code,
          employeeName: emp.personal.name,

          branchId: branch._id,
          branchCode: branch.code,
          branchName: branch.name,

          month: req.body.month,
          salaryType: emp.payroll.salaryType,

          baseSalary: emp.payroll.baseSalary,

          attendance: {
            totalDays,
            presentDays,
            lateDays,
            absentDays,
            workingMinutes,
          },

          ...salaryCalc,

          commissionAmount: 0,
          bonusAmount: 0,

          status: "pending",
          generatedAt: new Date(),
        });
      }

      await db
        .collection(COLLECTIONS.PAYROLL_SALARIES)
        .insertMany(payrollDocs);

      res.json({
        success: true,
        message: "Salary generated successfully",
        count: payrollDocs.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

/* 💵 Pay Salary */
router.put(
  "/:id/pay",
  permit(PERMISSIONS.PAYROLL_MANAGE),
  validate(paySalarySchema),
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;

      await db
        .collection(COLLECTIONS.PAYROLL_SALARIES)
        .updateOne(
          { _id: new ObjectId(req.params.id) },
          {
            $set: {
              status: "paid",
              paidAt: req.body.paidAt,
            },
          }
        );

      res.json({
        success: true,
        message: "Salary paid successfully",
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
