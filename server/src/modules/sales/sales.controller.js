import { createSaleService } from "./sales.service.js";
import { createSaleSchema } from "./sales.validation.js";

export const createSale = async (req, res, next) => {
  try {

    const payload = await createSaleSchema.validateAsync(req.body);
    const result = await createSaleService({
      db: req.app.locals.db,
      payload,
      user: req.user,
      accounts: req.accounts,
    });

    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};
