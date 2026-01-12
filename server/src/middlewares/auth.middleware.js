import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new AppError("Unauthorized", 401);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new AppError("Invalid token", 401);
  }
};
