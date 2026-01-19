import { reprintSaleService } from "./sales.reprint.service.js";

export const reprintSale = async (req, res, next) => {
  try {
    const result = await reprintSaleService({
      db: req.app.locals.db,
      saleId: req.params.saleId,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const reprintSaleByInvoice = async (req, res, next) => {
  try {
    const result = await reprintSaleService({
      db: req.app.locals.db,
      invoiceNo: req.params.invoiceNo,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
