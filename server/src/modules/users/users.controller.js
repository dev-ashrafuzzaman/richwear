// src/modules/users/user.controller.js
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

export const me = async (req, res) => {
  const db = getDB();

  const userId = new ObjectId(req.user._id);

  const user = await db.collection("users").findOne(
    { _id: userId },
    { projection: { password: 0, refreshToken: 0 } }
  );

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({
    success: true,
    data: { user },
  });
};
