import Joi from "joi";

const passwordRule = Joi.string()
  .min(8)
  .max(16)
  .pattern(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/
  )
  .message(
    "Password must be 8-16 characters long and include at least 1 letter, 1 number, and 1 special character"
  );


export const createUserSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: passwordRule.required(),
  roleId: Joi.string().required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(3).optional(),
  password: passwordRule.optional(), 
  roleId: Joi.string().optional(),
  status: Joi.string().valid("active", "inactive").optional()
});
