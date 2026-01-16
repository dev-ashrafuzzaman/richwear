import { createPurchase } from "./purchase.service.js";
import { createPurchaseSchema } from "./purchase.validation.js";

export const createPurchaseController = async (req, res, next) => {
  try {
    const { error, value } = createPurchaseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(d => d.message)
      });
    }

    const db = req.app.locals.db;

    const result = await createPurchase({
      db,
      body: value
    });

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: result
    });
  } catch (err) {
    next(err);
  }
};
