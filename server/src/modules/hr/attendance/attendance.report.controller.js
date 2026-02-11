import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../../database/collections.js";
import { getDB } from "../../../config/db.js";

export const attendanceReport = async (req, res, next) => {
  try {
    const db = getDB();

    const {
      from,
      to,
      branchId,
      employeeId,
      status,
      view = "summary",
      page = 1,
      limit = 20,
    } = req.query;

    const match = {};

    /* 📅 Date filter */
    if (from && to) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);

      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      match.date = { $gte: start, $lte: end };
    }

    if (branchId) match.branchId = new ObjectId(branchId);
    if (employeeId) match.employeeId = new ObjectId(employeeId);
    if (status) match.status = status;

    const attendanceCol = db.collection(COLLECTIONS.ATTENDANCES);

    /* ================= SUMMARY ================= */
    if (view === "summary") {
      const data = await attendanceCol.aggregate([
        { $match: match },

        /* 🔗 Join Employee */
        {
          $lookup: {
            from: COLLECTIONS.EMPLOYEES,
            localField: "employeeId",
            foreignField: "_id",
            as: "employee",
          },
        },
        { $unwind: "$employee" },

        /* 🔗 Join Branch */
        {
          $lookup: {
            from: COLLECTIONS.BRANCHES,
            localField: "branchId",
            foreignField: "_id",
            as: "branch",
          },
        },
        { $unwind: "$branch" },

        /* 📊 Group */
        {
          $group: {
            _id: "$employeeId",

            employee: {
              $first: {
                id: "$employee._id",
                code: "$employee.code",
                name: "$employee.name",
                role: "$employee.role",
                designation: "$employee.designation",
              },
            },

            branch: {
              $first: {
                id: "$branch._id",
                code: "$branch.code",
                name: "$branch.name",
              },
            },

            totalDays: { $sum: 1 },

            presentDays: {
              $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] },
            },
            lateDays: {
              $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] },
            },
            absentDays: {
              $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] },
            },

            workingMinutes: { $sum: "$workingMinutes" },
          },
        },

        { $sort: { "employee.name": 1 } },
      ]).toArray();

      return res.json({
        success: true,
        view: "summary",
        data,
      });
    }

    /* ================= DETAILS ================= */

    const skip = (page - 1) * limit;

    const data = await attendanceCol.aggregate([
      { $match: match },

      /* 🔗 Join Employee */
      {
        $lookup: {
          from: COLLECTIONS.EMPLOYEES,
          localField: "employeeId",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },

      /* 🔗 Join Branch */
      {
        $lookup: {
          from: COLLECTIONS.BRANCHES,
          localField: "branchId",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: "$branch" },

      /* 🧾 Human readable shape */
      {
        $project: {
          _id: 1,
          date: 1,
          punchIn: 1,
          punchOut: 1,
          status: 1,
          workingMinutes: 1,
          lateMinutes: 1,

          employee: {
            id: "$employee._id",
            code: "$employee.code",
            name: "$employee.name",
            role: "$employee.role",
            designation: "$employee.designation",
          },

          branch: {
            id: "$branch._id",
            code: "$branch.code",
            name: "$branch.name",
          },
        },
      },

      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
    ]).toArray();

    const total = await attendanceCol.countDocuments(match);

    res.json({
      success: true,
      view: "details",
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
      },
      data,
    });
  } catch (err) {
    next(err);
  }
};
