import { COLLECTIONS } from "../../database/collections.js";

export const createEmployee = async ({ db, payload }) => {
  const employee = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const result = await db
    .collection(COLLECTIONS.EMPLOYEES)
    .insertOne(employee);

  return { ...employee, _id: result.insertedId };
};
