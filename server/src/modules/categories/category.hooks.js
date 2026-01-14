import { ObjectId } from "mongodb";

export const beforeCreateCategory = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { parentId, level } = req.body;

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
    if (parentId) {
      const parent = await db.collection("categories").findOne({
        _id: new ObjectId(parentId)
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

    next();
  } catch (err) {
    next(err);
  }
};
