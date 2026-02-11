// modules/accounting/accounts/accounts.routes.js
import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";

import {
  createAccount,
  getAllAccounts,
  updateAccount
} from "./accounts.controller.js";

import {
  createAccountSchema,
  updateAccountSchema
} from "./accounts.validation.js";

import { validate } from "../../../middlewares/validate.middleware.js";

const router = Router();

router.use(authenticate);


router.get(
  "/",
  getAllAccounts
);


router.post(
  "/",
  validate(createAccountSchema),
  createAccount
);


export default router;
