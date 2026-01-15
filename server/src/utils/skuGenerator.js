import { COLLECTIONS } from "../database/collections.js";

/**
 * Generate auto SKU (atomic & scalable)
 */
export const generateSKU = async ({
  db,
  scope = "PRODUCT",
  prefixParts = []
}) => {
  const counter = await db.collection("sku_counters").findOneAndUpdate(
    { _id: scope },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = String(counter?.seq).padStart(5, "0");

  return [...prefixParts, seq].join("-");
};
