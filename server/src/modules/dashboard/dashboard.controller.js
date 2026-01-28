import { getDB } from "../../config/db.js";
import { getDashboardService } from "./dashboard.service.js";

export const getDashboard = async (req, res, next) => {
  try {
    const { branchId, from, to } = req.query;

    const data = await getDashboardService({
      db: getDB(),
      branchId,
      from,
      to,
    });

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};
