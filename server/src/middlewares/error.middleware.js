import { ENVIRONMENTS } from "../config/constants.js";

/**
 * Global Error Middleware
 * Must be the LAST middleware in app.js
 */
export const errorHandler = (err, req, res, next) => {
  const env = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors = null;

  /* ===============================
     MongoDB Errors
  ================================ */
  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate key error";
    errors = err.keyValue;
  }

  /* ===============================
     Joi Validation Error
  ================================ */
  if (err.isJoi) {
    statusCode = 422;
    message = "Validation error";
    errors = err.details.map((d) => d.message);
  }

  /* ===============================
     JWT Errors
  ================================ */
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  /* ===============================
     Final Response
  ================================ */
  const response = {
    success: false,
    message
  };

  if (errors) response.errors = errors;

  if (env !== ENVIRONMENTS.PRODUCTION) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
