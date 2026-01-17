import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  parentId: Joi.string().allow(null).optional(), 

  level: Joi.number().valid(1, 2, 3).required(),

  status: Joi.string().valid("active", "inactive").default("active")
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  status: Joi.string().valid("active", "inactive").optional()
}).min(1);
