import { getDB } from "../../config/db.js";
import { withCreateFields, withUpdateFields } from "../../utils/commonFields.js";
import { AppError } from "../../utils/AppError.js";

const COLLECTION = "roles";

/* ===============================
   CREATE ROLE
================================ */
export const createRole = async (payload) => {
  const db = getDB();

  const exists = await db.collection(COLLECTION).findOne({
    name: payload.name
  });

  if (exists) {
    throw new AppError("Role already exists", 409);
  }

  const role = {
    name: payload.name,
    description: payload.description || "",
    permissions: payload.permissions,
    ...withCreateFields()
  };

  const { insertedId } = await db
    .collection(COLLECTION)
    .insertOne(role);

  return { _id: insertedId, ...role };
};

/* ===============================
   GET ALL ROLES
================================ */
export const getRoles = async () => {
  const db = getDB();

  return db
    .collection(COLLECTION)
    .find({ status: "active" })
    .project({ permissions: 1, name: 1, description: 1 })
    .toArray();
};

/* ===============================
   GET ROLE BY ID
================================ */
export const getRoleById = async (id) => {
  const db = getDB();

  const role = await db.collection(COLLECTION).findOne({ _id: id });

  if (!role) {
    throw new AppError("Role not found", 404);
  }

  return role;
};

/* ===============================
   UPDATE ROLE
================================ */
export const updateRole = async (id, payload) => {
  const db = getDB();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...payload,
        ...withUpdateFields()
      }
    },
    { returnDocument: "after" }
  );

  if (!result.value) {
    throw new AppError("Role not found", 404);
  }

  return result.value;
};

/* ===============================
   DELETE ROLE (SOFT)
================================ */
export const deleteRole = async (id) => {
  const db = getDB();

  const result = await db.collection(COLLECTION).findOneAndUpdate(
    { _id: id },
    {
      $set: {
        status: "inactive",
        ...withUpdateFields()
      }
    }
  );

  if (!result.value) {
    throw new AppError("Role not found", 404);
  }

  return true;
};
