import { generateSKU } from "../../utils/skuGenerator.js";

export const beforeCreateProduct = async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const productCode = req.body.name
      .replace(/\s+/g, "")
      .substring(0, 3)
      .toUpperCase();

    const brandCode = "MN"; 
    const sku = await generateSKU({
      db,
      scope: "PRODUCT",
      prefixParts: [productCode, brandCode]
    });

    req.body.sku = sku;

    next();
  } catch (err) {
    next(err);
  }
};
