import { AppError } from "../utils/AppError.js";

export const permit = (...permissions) => {
  return (req, res, next) => {
    if (!req.user?.permissions)
      throw new AppError("Unauthorized", 401);

    const allowed = permissions.every(p =>
      req.user.permissions.includes(p)
    );

    if (!allowed)
      throw new AppError("Permission denied", 403);

    next();
  };
};
