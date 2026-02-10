import Joi from "joi";

export const startAuditSchema = Joi.object({
  branchId: Joi.string().optional()
});

export const scanSchema = Joi.object({
  sku: Joi.string().required()
});

export const updateQtySchema = Joi.object({
  scannedQty: Joi.number().min(0).required()
});
v