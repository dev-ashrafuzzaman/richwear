import Joi from "joi";

export const createEmployeeSchema = Joi.object({
  personal: Joi.object({
    name: Joi.string().required(),
    fatherName: Joi.string().optional(),
    dob: Joi.date().optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
  }).required(),

  contact: Joi.object({
    phone: Joi.string()
      .pattern(/^(01)[0-9]{9}$/)
      .required(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional(),
  }).required(),

  employment: Joi.object({
    branchId: Joi.string().optional(),
    role: Joi.string().valid("ADMIN", "MANAGER", "CASHIER","SALESMAN").required(),
    designation: Joi.string().required(),
    joiningDate: Joi.date().default(Date.now),
  }).required(),
  status: Joi.string()
    .valid("active", "inactive", "terminated")
    .default("active"),
  payroll: Joi.object({
    salaryType: Joi.string().valid("monthly", "daily").default("monthly"),
    baseSalary: Joi.number().min(0).required(),
    commissionType: Joi.string().valid("percentage", "fixed").optional(),
    commissionValue: Joi.number().min(0).optional(),
  }).required(),

  account: Joi.object({
    openingBalance: Joi.number().default(0),
    balanceType: Joi.string().valid("payable", "receivable").default("payable"),
  }).default(),
});

export const updateEmployeeSchema = Joi.object({
  personal: Joi.object({
    name: Joi.string().optional(),
    fatherName: Joi.string().optional(),
    dob: Joi.date().optional(),
    gender: Joi.string().valid("male", "female", "other").optional(),
  }).optional(),

  contact: Joi.object({
    phone: Joi.string()
      .pattern(/^(01)[0-9]{9}$/)
      .optional(),
    email: Joi.string().email().optional(),
    address: Joi.string().optional(),
  }).optional(),

  employment: Joi.object({
    role: Joi.string().valid("ADMIN", "MANAGER", "CASHIER").optional(),
    designation: Joi.string().optional(),
    status: Joi.string().valid("active", "inactive", "terminated").optional(),
  }).optional(),

  payroll: Joi.object({
    baseSalary: Joi.number().min(0).optional(),
    commissionType: Joi.string().valid("percentage", "fixed").optional(),
    commissionValue: Joi.number().min(0).optional(),
  }).optional(),
}).min(1);
