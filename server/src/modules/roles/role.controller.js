import * as roleService from "./role.service.js";
import { successResponse } from "../../utils/apiResponse.js";

export const create = async (req, res, next) => {
  try {
    const data = await roleService.createRole(req.body);
    successResponse(res, {
      message: "Role created successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const data = await roleService.getRoles();
    successResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const data = await roleService.getRoleById(req.params.id);
    successResponse(res, { data });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = await roleService.updateRole(
      req.params.id,
      req.body
    );
    successResponse(res, {
      message: "Role updated successfully",
      data
    });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await roleService.deleteRole(req.params.id);
    successResponse(res, {
      message: "Role deleted successfully"
    });
  } catch (err) {
    next(err);
  }
};
