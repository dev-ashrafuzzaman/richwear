import { ObjectId } from "mongodb";
import { toObjectId } from "../../utils/safeObjectId.js";

export const beforeCreateCategory = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    let { level, name } = req.body;
    const parentId = toObjectId(req.body.parentId, "parentId");

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    level = Number(level);

    if (!Number.isInteger(level) || level < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid category level"
      });
    }

  
    if (level === 1 && parentId) {
      return res.status(400).json({
        success: false,
        message: "Level 1 category cannot have parent"
      });
    }

    if (level > 1 && !parentId) {
      return res.status(400).json({
        success: false,
        message: "Sub category must have parent"
      });
    }


    let parent = null;

    if (parentId) {

      parent = await db.collection("categories").findOne({
        _id: parentId
      });

      if (!parent) {
        return res.status(400).json({
          success: false,
          message: "Invalid parent category"
        });
      }

      if (parent.level !== level - 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid category level hierarchy"
        });
      }
    }

    const duplicateQuery = {
      name: name.trim(),
      level
    };

    if (level === 1) {
      duplicateQuery.parentId = null;
    } else {
      duplicateQuery.parentId = parentId;
    }

    const exists = await db.collection("categories").findOne(duplicateQuery);

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Category with same name already exists under this parent"
      });
    }


    req.body.level = level;
    req.body.name = name.trim();
    req.body.parentId = parentId ? parentId : null;

    next();
  } catch (err) {
    next(err);
  }
};
