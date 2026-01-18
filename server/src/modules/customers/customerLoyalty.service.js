import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";

export const addLoyaltyPoints = async ({ db, customerId, amount }) => {
  const points = Math.floor(amount / 100); // 1 point per 100 taka

  await db.collection(COLLECTIONS.CUSTOMERS).updateOne(
    { _id: new ObjectId(customerId) },
    { $inc: { loyaltyPoints: points } }
  );
};
