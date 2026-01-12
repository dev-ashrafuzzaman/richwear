import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { AppError } from "../../utils/AppError.js";

export const beforeCreateUser = async (req, res, next) => {
  const db = req.app.locals.db;
  const { email, password, roleId } = req.body;

  const exists = await db.collection("users").findOne({ email });
  if (exists) {
    throw new AppError("Email already exists", 409);
  }


  const role = await db
    .collection("roles")
    .findOne({ _id: new ObjectId(roleId) });

  if (!role) {
    throw new AppError("Role not found", 404);
  }


  req.body.password = await bcrypt.hash(password, 10);
  req.body.roleId = role._id;
  req.body.roleName = role.name;
  req.body.permissions = role.permissions;

  next();
};


export const beforeUpdateUser = async (req, res, next) => {
  const db = req.app.locals.db;
  const { roleId } = req.body;

  if (roleId) {
    const role = await db
      .collection("roles")
      .findOne({ _id: new ObjectId(roleId) });

    if (!role) {
      throw new AppError("Role not found", 404);
    }

    req.body.roleId = role._id;
    req.body.roleName = role.name;
    req.body.permissions = role.permissions;
  }

  next();
};
