import * as authService from "./auth.service.js";
import { successResponse } from "../../utils/apiResponse.js";

export const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    successResponse(res, {
      message: "User registered successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

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
    const data = await authService.refreshToken(req.body);
    successResponse(res, {
      message: "Token refreshed",
      data
    });
  } catch (err) {
    next(err);
  }
};
