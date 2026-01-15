import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().trim().min(3).max(150).required(),

  categoryId: Joi.string().required(),

  brand: Joi.string().trim().required(),

  unit: Joi.string()
    .valid("PCS", "METER", "PAIR")
    .default("PCS"),

  status: Joi.string()
    .valid("active", "inactive")
    .default("active")
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  unit: Joi.string().valid("PCS", "METER", "PAIR").optional(),
  status: Joi.string().valid("active", "inactive").optional()
}).min(1);
