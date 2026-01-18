import Joi from "joi";

export const createPurchaseSchema = Joi.object({
  branchId: Joi.string().required(),
  supplierId: Joi.string().required(),

  items: Joi.array()
    .items(
      Joi.object({
        variantId: Joi.string().required(),
        qty: Joi.number().positive().required(),
        costPrice: Joi.number().positive().required(),

        updateSalePrice: Joi.boolean().default(false),
        salePrice: Joi.when("updateSalePrice", {
          is: true,
          then: Joi.number().positive().required(),
          otherwise: Joi.forbidden(),
        }),
      }),
    )
    .min(1)
    .required(),
});
