import Joi from "joi";

export const punchInSchema = Joi.object({
  employeeId: Joi.string().required(),
  branchId: Joi.string().required(),
  punchIn: Joi.date().default(Date.now),
  source: Joi.string()
    .valid("manual", "system", "biometric")
    .default("manual"),
});

export const punchOutSchema = Joi.object({
  punchOut: Joi.date().default(Date.now),
});
