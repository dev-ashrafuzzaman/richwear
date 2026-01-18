import { createSaleService } from "./sales.service.js";
import { createSaleSchema } from "./sales.validation.js";

export const createSale = async (req, res, next) => {
  try {
    const payload = await createSaleSchema.validateAsync({
      ...req.body,
      invoiceNo: req.generated.invoiceNo,
    });

    const sale = await createSaleService({
      db: req.app.locals.db,
      payload,
      user: req.user,
    });

    res.status(201).json({
      success: true,
      message: "Sale completed successfully",
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};
