import Joi from "joi";

export const createSalesReturnSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        saleItemId: Joi.string().required(),
        qty: Joi.number().min(1).required(),
        reason: Joi.string().optional(),
      }),
    )
    .min(1)
    .required(),

  refundMethod: Joi.string()
    .valid("CASH", "BKASH", "CARD", "BANK", "ADJUST_DUE")
    .required(),
});
