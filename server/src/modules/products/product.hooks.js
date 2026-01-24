import { ObjectId } from "mongodb";
import { COLLECTIONS } from "../../database/collections.js";
import { generateProductCode } from "../../utils/sku/generateProductCode.js";

export const beforeCreateProduct = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const {
      name,
      categoryId,
      productTypeId,
      sizeType,
      sizeConfig,
    } = req.body;

    /* =====================
       CATEGORY VALIDATION
    ====================== */
    const categoryObjectId = new ObjectId(categoryId);
    const category = await db.collection(COLLECTIONS.CATEGORIES).findOne({
      _id: categoryObjectId,
      status: "active",
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    /* =====================
       PRODUCT TYPE VALIDATION
    ====================== */
    const productTypeObjectId = new ObjectId(productTypeId);
    const productType = await db
      .collection(COLLECTIONS.PRODUCT_TYPES)
      .findOne({
        _id: productTypeObjectId,
        status: "active",
      });

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "Invalid product type",
      });
    }

    /* =====================
       DUPLICATE CHECK
    ====================== */
    const exists = await db.collection(COLLECTIONS.PRODUCTS).findOne({
      name,
      categoryId: categoryObjectId,
      productTypeId: productTypeObjectId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Product already exists",
      });
    }

    /* =====================
       PRODUCT CODE
    ====================== */
    const productCode = await generateProductCode({
      db,
      productTypeCode: productType.code, // e.g. "01"
    });

    /* =====================
       SIZE HANDLING (FINAL LOGIC)
    ====================== */
    let finalSizeConfig = null;

    if (sizeType === "TEXT") {
      if (!productType.defaultSizes?.length) {
        return res.status(400).json({
          success: false,
          message: "No default sizes defined for TEXT size type",
        });
      }

      finalSizeConfig = {
        values: productType.defaultSizes,
      };
    }

    if (sizeType === "NUMBER") {
      if (!sizeConfig?.min || !sizeConfig?.max) {
        return res.status(400).json({
          success: false,
          message: "NUMBER size requires min & max",
        });
      }
      finalSizeConfig = sizeConfig;
    }

    /* =====================
       ATTACH GENERATED DATA
    ====================== */
    req.generated = {
      categoryId: categoryObjectId,
      productTypeId: productTypeObjectId,
      productCode,           // 🔑 010001
      sizeType,
      sizeConfig: finalSizeConfig,
      hasVariant: sizeType !== "N/A",
    };

    // Clean frontend payload
    delete req.body.sizeConfig;

    next();
  } catch (err) {
    next(err);
  }
};
