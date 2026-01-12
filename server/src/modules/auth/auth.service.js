import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDB } from "../../config/db.js";
import { AppError } from "../../utils/AppError.js";

const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      branchId: user.branchId,
      permissions: user.permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );


export const login = async ({ email, password }) => {
  const db = getDB();

  const user = await db.collection("users").findOne({ email });
  if (!user) throw new AppError("Invalid email or password", 401);
  if (user.status !== "active")
    throw new AppError("User account inactive", 403);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid email or password", 401);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const hashedRefresh = await bcrypt.hash(refreshToken, 10);

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        refreshToken: hashedRefresh,
        updatedAt: new Date()
      }
    }
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      roleName: user.roleName,
      branchId: user.branchId,
      permissions: user.permissions,
      isSuperAdmin: user.isSuperAdmin || false
    }
  };
};

export const refreshToken = async (token) => {
  const db = getDB();

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await db.collection("users").findOne({
    _id: new ObjectId(decoded.id)
  });

  if (!user || !user.refreshToken) {
    throw new AppError("Refresh token expired", 401);
  }

  const valid = await bcrypt.compare(token, user.refreshToken);
  if (!valid) {
    throw new AppError("Refresh token invalid", 401);
  }

  const newAccessToken = generateAccessToken(user);
  return { accessToken: newAccessToken };
};


export const logout = async (userId) => {
  const db = getDB();

  await db.collection("users").updateOne(
    { _id: userId },
    { $unset: { refreshToken: "" } }
  );

  return true;
};


export const changePassword = async (userId, payload) => {
  const db = getDB();
  const { oldPassword, newPassword } = payload;

  const user = await db.collection("users").findOne({ _id: userId });
  if (!user) throw new AppError("User not found", 404);

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) throw new AppError("Old password incorrect", 400);

  const hashed = await bcrypt.hash(newPassword, 10);

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        password: hashed,
        updatedAt: new Date()
      },
      $unset: { refreshToken: "" } 
    }
  );

  return true;
};
