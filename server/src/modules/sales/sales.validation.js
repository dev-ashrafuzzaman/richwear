import Joi from "joi";

export const createSaleSchema = Joi.object({
  invoiceNo: Joi.string().required(),
  type: Joi.string().valid("RETAIL", "WHOLESALE").required(),
  branchId: Joi.string().required(),
  customerId: Joi.string().required(),

  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string().required(),
        variantId: Joi.string().required(),
        qty: Joi.number().min(1).required(),
        salePrice: Joi.number().min(0).required(),
        discountType: Joi.string().valid("FIXED", "PERCENT").optional(),
        discountValue: Joi.number().min(0).optional(),
      }),
    )
    .min(1)
    .required(),

  billDiscount: Joi.number().min(0).default(0),

  payments: Joi.array()
    .items(
      Joi.object({
        method: Joi.string().required(),
        amount: Joi.number().min(0).required(),
        reference: Joi.string().optional(),
      }),
    )
    .required(),
});
