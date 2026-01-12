import Joi from "joi";

export const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  roleId: Joi.string().required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  roleId: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive").optional()
});
