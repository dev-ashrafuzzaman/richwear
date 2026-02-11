import { ObjectId } from "mongodb";
import { getDB } from "../../../config/db.js";
import { createSalarySheet, processSalaryPayment } from "./payroll.salarySheet.js";

export const createSalarySheetController = async (req, res, next) => {
const db = getDB()
  const session = db.client.startSession();
  session.startTransaction();

  try {
    const { month, employees,branchId } = req.body;

    const sheetId = await createSalarySheet({
      db,
      session,
      branchId,
      month,
      employees,
      userId: req.user._id,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      sheetId,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};


export const paySalaryController = async (req, res, next) => {
  const session = client.startSession();
  session.startTransaction();

  try {
    const paymentId = await processSalaryPayment({
      db,
      session,
      ...req.body,
      userId: req.user._id
    });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, paymentId });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};


export const getSalarySheets = async (req, res, next) => {
  try {
    const db = getDB();

    let { branchId, month } = req.query;

    // 🔒 Branch restriction
    if (req.user.branchId) {
      branchId = req.user.branchId;
    }

    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (month) filter.month = month;

    const sheets = await db
      .collection("salary_sheets")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: sheets });
  } catch (err) {
    next(err);
  }
};



export const getSalarySheetDetails = async (req, res, next) => {
  try {
    const db = getDB();
    const { id } = req.params;

    /* ==============================
       1️⃣ VALIDATE OBJECT ID
    ============================== */

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary sheet ID",
      });
    }

    const sheetId = new ObjectId(id);

    /* ==============================
       2️⃣ BRANCH SECURITY (RBAC)
    ============================== */

    const match = { _id: sheetId };

    if (req.user.branchId) {
      match.branchId = new ObjectId(req.user.branchId);
    }

    /* ==============================
       3️⃣ FETCH SHEET WITH RELATIONS
    ============================== */

    const sheetAgg = await db
      .collection("salary_sheets")
      .aggregate([
        { $match: match },

        /* -------- Branch -------- */
        {
          $lookup: {
            from: "branches",
            localField: "branchId",
            foreignField: "_id",
            as: "branch",
          },
        },
        { $unwind: "$branch" },

        /* -------- Created By -------- */
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByUser",
          },
        },
        { $unwind: "$createdByUser" },

        /* -------- Journal -------- */
        {
          $lookup: {
            from: "journals",
            localField: "journalId",
            foreignField: "_id",
            as: "journal",
          },
        },
        {
          $unwind: {
            path: "$journal",
            preserveNullAndEmptyArrays: true,
          },
        },

        /* -------- Salary Items -------- */
        {
          $lookup: {
            from: "salary_sheet_items",
            localField: "_id",
            foreignField: "salarySheetId",
            as: "items",
          },
        },

        /* -------- Paid / Remaining Summary -------- */
        {
          $addFields: {
            totalEmployees: { $size: "$items" },

            totalPaid: {
              $sum: {
                $map: {
                  input: "$items",
                  as: "item",
                  in: {
                    $subtract: [
                      "$$item.netSalary",
                      "$$item.payableRemaining",
                    ],
                  },
                },
              },
            },

            totalRemaining: {
              $sum: "$items.payableRemaining",
            },
          },
        },

        /* -------- Clean Projection -------- */
        {
          $project: {
            month: 1,
            status: 1,
            totalNet: 1,
            totalEmployees: 1,
            totalPaid: 1,
            totalRemaining: 1,
            createdAt: 1,

            branch: {
              _id: "$branch._id",
              name: "$branch.name",
              code: "$branch.code",
              address: "$branch.address",
              phone: "$branch.phone",
            },

            createdByUser: {
              _id: "$createdByUser._id",
              name: "$createdByUser.name",
              email: "$createdByUser.email",
            },

            journal: {
              _id: "$journal._id",
              voucherNo: "$journal.voucherNo",
            },

            items: 1,
          },
        },
      ])
      .toArray();

    if (!sheetAgg.length) {
      return res.status(404).json({
        success: false,
        message: "Salary sheet not found",
      });
    }

    const sheet = sheetAgg[0];

    /* ==============================
       4️⃣ ENRICH ITEMS WITH EMPLOYEE
    ============================== */

    const items = await db
      .collection("salary_sheet_items")
      .aggregate([
        { $match: { salarySheetId: sheetId } },

        {
          $lookup: {
            from: "employees",
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },

        { $unwind: "$employee" },

        {
          $project: {
            baseSalary: 1,
            bonus: 1,
            deduction: 1,
            netSalary: 1,
            payableRemaining: 1,
            status: 1,
            createdAt: 1,

            employee: {
              _id: "$employee._id",
              name: "$employee.name",
              code: "$employee.code",
              role: "$employee.role",
              designation: "$employee.designation",
            },
          },
        },
      ])
      .toArray();

    /* ==============================
       5️⃣ FINAL RESPONSE
    ============================== */

    return res.json({
      success: true,
      data: {
        ...sheet,
        items,
      },
    });

  } catch (err) {
    console.error("SalarySheetDetails Error:", err);
    next(err);
  }
};
