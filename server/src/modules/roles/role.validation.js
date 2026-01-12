import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().min(3).required(),
  description: Joi.string().allow("").optional(),
  permissions: Joi.array()
    .items(Joi.string())
    .min(1)
    .required()
});

export const updateRoleSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  description: Joi.string().allow("").optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});
