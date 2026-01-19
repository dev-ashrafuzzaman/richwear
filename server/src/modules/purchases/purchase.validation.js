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

  reason: Joi.string().trim().min(5).required(),

  /* =====================
     RETURN ITEMS
  ====================== */
  items: Joi.array()
    .items(
      Joi.object({
        variantId: Joi.string().required(),
        qty: Joi.number().positive().precision(2).required(),
      }),
    )
    .min(1)
    .required(),

  /* =====================
     FINANCIALS
  ====================== */
  returnAmount: Joi.number()
    .positive()
    .precision(2)
    .required(),

  cashRefund: Joi.number()
    .min(0)
    .precision(2)
    .default(0),

  dueAdjust: Joi.number()
    .min(0)
    .precision(2)
    .default(0),
})
  /* =====================
     CROSS FIELD VALIDATION
  ====================== */
  .custom((value, helpers) => {
    const total = Number(value.returnAmount || 0);
    const cash = Number(value.cashRefund || 0);
    const due = Number(value.dueAdjust || 0);

    if (cash + due !== total) {
      return helpers.message(
        "cashRefund + dueAdjust must be equal to returnAmount",
      );
    }

    return value;
  });