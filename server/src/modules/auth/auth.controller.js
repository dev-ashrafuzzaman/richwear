import * as authService from "./auth.service.js";
import { successResponse } from "../../utils/apiResponse.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/api/v1/auth/refresh",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken, user } =
      await authService.login(req.body, req);

    // ✅ ONLY CONTROLLER SETS COOKIE
    res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);

    successResponse(res, {
      message: "Login successful",
      data: { accessToken, user },
    });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    const { accessToken, newRefreshToken } =
      await authService.refreshToken(refreshToken, req);

    res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS);

    successResponse(res, {
      message: "Token refreshed",
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id, req);

    res.clearCookie("refreshToken", {
      path: "/api/v1/auth/refresh",
    });

    successResponse(res, {
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user._id, req.body, req);

    successResponse(res, {
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};
