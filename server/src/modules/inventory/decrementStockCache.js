import { COLLECTIONS } from "../../database/collections.js";

export const decrementStockCache = async ({
  db,
  session,
  branchId,
  variantId,
  qty,
}) => {
  const res = await db.collection(COLLECTIONS.STOCKS).updateOne(
    { branchId, variantId },
    {
      $inc: { qty: -qty },
      $set: { updatedAt: new Date() },
    },
    { session }
  );

  if (res.matchedCount === 0) {
    throw new Error("Stock row missing");
  }
};
