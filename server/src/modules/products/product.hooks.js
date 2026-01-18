import { ObjectId } from "mongodb";
import { generateSKU } from "../../utils/skuGenerator.js";
import { COLLECTIONS } from "../../database/collections.js";

export const beforeCreateProduct = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { categoryId, name, brand = "RichWear" } = req.body;

    const categoryObjectId = new ObjectId(categoryId);

    const category = await db.collection(COLLECTIONS.CATEGORIES).findOne({
      _id: categoryObjectId,
      status: "active"
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category"
      });
    }

    const exists = await db.collection(COLLECTIONS.PRODUCTS).findOne({
      name,
      categoryId: categoryObjectId
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Product already exists in this category"
      });
    }


    const productCode = name.replace(/\s+/g, "").substring(0, 3).toUpperCase();

    req.generated = {
      sku: await generateSKU({
        db,
        module: "PRODUCT",
        prefixParts: [productCode]
      }),
      categoryId: categoryObjectId
    };

    next();
  } catch (err) {
    next(err);
  }
};
