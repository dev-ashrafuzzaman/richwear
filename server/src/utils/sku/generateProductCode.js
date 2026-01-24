// utils/sku/generateProductCode.js

/**
 * Generates productCode = TT + PPPP
 * Example: 01 + 0001 => 010001
 */
export const generateProductCode = async ({ db, productTypeCode }) => {
  if (!productTypeCode || productTypeCode.length !== 2) {
    throw new Error("Invalid productTypeCode");
  }

  const counterId = `PRODUCT_${productTypeCode}`;

  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    {
      upsert: true,
      returnDocument: "after",
    }
  );

  const productSerial = String(counter.seq).padStart(4, "0");

  // TT + PPPP
  return `${productTypeCode}${productSerial}`; // e.g. 010001
};
