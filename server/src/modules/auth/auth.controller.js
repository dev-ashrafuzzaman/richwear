import * as authService from "./auth.service.js";
import { successResponse } from "../../utils/apiResponse.js";

export const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    successResponse(res, {
      message: "Login successful",
      data
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const data = await authService.refreshToken(refreshToken);

    successResponse(res, {
      message: "Token refreshed",
      data
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    successResponse(res, {
      message: "Logged out successfully"
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    successResponse(res, {
      message: "Password changed successfully"
    });
  } catch (err) {
    next(err);
  }
};
