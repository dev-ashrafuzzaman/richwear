import { AppError } from "../utils/AppError.js";

/**
 *
 * @param  {...string} requiredPermissions
 *
 */
export const permit = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user?.permissions) {
      throw new AppError("Unauthorized", 401);
    }

    const hasPermission = requiredPermissions.every((p) =>
      req.user.permissions.includes(p)
    );

    if (!hasPermission) {
      throw new AppError("Permission denied", 403);
    }

    next();
  };
};
