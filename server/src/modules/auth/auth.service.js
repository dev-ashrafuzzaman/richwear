import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getDB } from "../../config/db.js";
import { ROLES, ACCOUNT_STATUS } from "../../config/constants.js";
import { withCreateFields } from "../../utils/commonFields.js";
import { generateId } from "../../utils/idGenerator.js";
import { AppError } from "../../utils/AppError.js";

const COLLECTION = "users";

/* ===============================
   REGISTER
================================ */
export const register = async (payload) => {
  const db = getDB();

  const exists = await db.collection(COLLECTION).findOne({
    email: payload.email
  });

  if (exists) {
    throw new AppError("Email already registered", 409);
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = {
    _id: generateId(),
    name: payload.name,
    email: payload.email,
    password: hashedPassword,
    role: payload.role || ROLES.STAFF,
    status: ACCOUNT_STATUS.ACTIVE,
    ...withCreateFields()
  };

  await db.collection(COLLECTION).insertOne(user);

  delete user.password;
  return user;
};

/* ===============================
   LOGIN
================================ */
export const login = async ({ email, password }) => {
  const db = getDB();

  const user = await db.collection(COLLECTION).findOne({ email });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  if (user.status !== ACCOUNT_STATUS.ACTIVE) {
    throw new AppError("Account inactive", 403);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken
  };
};

/* ===============================
   REFRESH TOKEN
================================ */
export const refreshToken = async ({ refreshToken }) => {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const accessToken = generateAccessToken(decoded);
    return { accessToken };
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }
};

/* ===============================
   TOKEN HELPERS
================================ */
const generateAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      permissions: user.permissions
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );


const generateRefreshToken = (user) =>
  jwt.sign(
    {
      id: user._id
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
