export const createPurchaseSchema = Joi.object({
  branchId: Joi.string().required(),
  supplierId: Joi.string().required(),

  items: Joi.array().items(
    Joi.object({
      variantId: Joi.string().required(),
      qty: Joi.number().positive().required(),
      costPrice: Joi.number().positive().required(),
      salePrice: Joi.number().positive().optional()
    })
  ).min(1).required()
});
