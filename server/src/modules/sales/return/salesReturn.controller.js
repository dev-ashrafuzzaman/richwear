import { createSalesReturnSchema } from "./salesReturn.validation.js";
import { createSalesReturnService } from "./salesReturn.service.js";

export const createSalesReturn = async (req, res, next) => {
  try {
    const payload = await createSalesReturnSchema.validateAsync(req.body);

    const result = await createSalesReturnService({
      db: req.app.locals.db,
      saleId: req.params.saleId,
      payload,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Sales return processed successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};
