import Joi from "joi";

export const createPurchaseSchema = Joi.object({
  supplierId: Joi.string().required(),

  invoiceNumber: Joi.string().required(),
  invoiceDate: Joi.date().required(),

  paidAmount: Joi.number().min(0).default(0),

  items: Joi.array()
    .items(
      Joi.object({
        variantId: Joi.string().required(),
        qty: Joi.number().positive().required(),
        costPrice: Joi.number().positive().required(),
        salePrice: Joi.number().positive().optional()
      })
    )
    .min(1)
    .required(),

  notes: Joi.string().optional()
});



export const createPurchaseReturnSchema = Joi.object({
  purchaseId: Joi.string().required(),
  returnDate: Joi.date().required(),
  reason: Joi.string().required(),

  items: Joi.array()
    .items(
      Joi.object({
        variantId: Joi.string().required(),
        qty: Joi.number().positive().required()
      })
    )
    .min(1)
    .required()
});