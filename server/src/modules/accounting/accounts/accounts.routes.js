// modules/accounting/accounts/accounts.routes.js
import { Router } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { permit } from "../../../middlewares/permission.middleware.js";
import { PERMISSIONS } from "../../../config/permissions.js";

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

/**
 * @route   GET /api/accounts
 * @desc    Get all chart of accounts
 */
router.get(
  "/",
  permit(PERMISSIONS.ACCOUNT_VIEW),
  getAllAccounts
);

/**
 * @route   POST /api/accounts
 * @desc    Create non-system account
 */
router.post(
  "/",
  permit(PERMISSIONS.ACCOUNT_MANAGE),
  validate(createAccountSchema),
  createAccount
);

/**
 * @route   PATCH /api/accounts/:id
 * @desc    Update account (status/name only)
 */
router.patch(
  "/:id",
  permit(PERMISSIONS.ACCOUNT_MANAGE),
  validate(updateAccountSchema),
  updateAccount
);

export default router;
