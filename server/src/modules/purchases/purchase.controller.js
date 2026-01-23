import { createPurchase, createPurchaseReturn } from "./purchase.service.js";
import {
  createPurchaseReturnSchema,
  createPurchaseSchema,
} from "./purchase.validation.js";

export const createPurchaseController = async (req, res, next) => {
  try {
    const { error, value } = createPurchaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const db = req.app.locals.db;

    const result = await createPurchase({
      db,
      body: value,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
export const createPurchaseReturnController = async (req, res, next) => {
  try {
    const { error, value } = createPurchaseReturnSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((d) => d.message),
      });
    }

    const db = req.app.locals.db;

    const result = await createPurchaseReturn({
      db,
      body: value,
      req,
    });

    res.status(201).json({
      success: true,
      message: "Purchase return created successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

