/**
 * Global Application Constants
 * Used across controllers, services, validations, middleware
 * Keep this file PURE (no imports from other files)
 */

/* ================================
   ENVIRONMENTS
================================ */
export const ENVIRONMENTS = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test"
});

/* ================================
   USER ROLES (RBAC)
================================ */
export const ROLES = Object.freeze({
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  ACCOUNTANT: "accountant"
});

/* ================================
   ACCOUNT STATUS
================================ */
export const ACCOUNT_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
  DELETED: "deleted"
});

/* ================================
   COMMON RECORD STATUS
================================ */
export const RECORD_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  ARCHIVED: "archived"
});

/* ================================
   AUTH / SECURITY
================================ */
export const AUTH = Object.freeze({
  TOKEN_TYPE: "Bearer",
  PASSWORD_MIN_LENGTH: 8,
  OTP_EXPIRE_MINUTES: 5
});

/* ================================
   PAGINATION DEFAULTS
================================ */
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
});

/* ================================
   SORT ORDERS
================================ */
export const SORT_ORDER = Object.freeze({
  ASC: 1,
  DESC: -1
});

/* ================================
   INVENTORY / STOCK
================================ */
export const STOCK_TYPE = Object.freeze({
  IN: "in",
  OUT: "out",
  ADJUSTMENT: "adjustment"
});

export const STOCK_REASON = Object.freeze({
  PURCHASE: "purchase",
  SALE: "sale",
  RETURN: "return",
  DAMAGE: "damage",
  MANUAL: "manual"
});

/* ================================
   PRODUCT / VARIANT
================================ */
export const PRODUCT_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive"
});

export const VARIANT_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive"
});

/* ================================
   SALES
================================ */
export const SALE_STATUS = Object.freeze({
  DRAFT: "draft",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RETURNED: "returned"
});

export const PAYMENT_STATUS = Object.freeze({
  PAID: "paid",
  PARTIAL: "partial",
  UNPAID: "unpaid"
});

/* ================================
   PURCHASE
================================ */
export const PURCHASE_STATUS = Object.freeze({
  DRAFT: "draft",
  RECEIVED: "received",
  CANCELLED: "cancelled"
});

/* ================================
   ACCOUNTING
================================ */
export const TRANSACTION_TYPE = Object.freeze({
  DEBIT: "debit",
  CREDIT: "credit"
});

export const LEDGER_TYPE = Object.freeze({
  CASH: "cash",
  BANK: "bank",
  MOBILE: "mobile"
});

/* ================================
   DATE / TIME
================================ */
export const TIMEZONE = Object.freeze({
  DEFAULT: "Asia/Dhaka"
});

export const DATE_FORMAT = Object.freeze({
  ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
  DATE_ONLY: "YYYY-MM-DD"
});

/* ================================
   API RESPONSE MESSAGES
================================ */
export const MESSAGES = Object.freeze({
  SUCCESS: "Operation successful",
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",

  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Permission denied",
  VALIDATION_ERROR: "Validation error",
  SERVER_ERROR: "Internal server error"
});

/* ================================
   AUDIT LOG ACTIONS
================================ */
export const AUDIT_ACTIONS = Object.freeze({
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
  LOGOUT: "logout"
});
