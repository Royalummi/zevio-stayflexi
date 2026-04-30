import { sendError } from "../utils/response.js";

export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired", 401);
  }

  // Database errors
  if (err.code === "ER_DUP_ENTRY") {
    return sendError(res, "Duplicate entry. Record already exists", 409);
  }

  // Multer errors
  if (err.name === "MulterError") {
    return sendError(res, `File upload error: ${err.message}`, 400);
  }

  // Operational errors
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Generic server error
  return sendError(res, "Internal server error", 500);
};

export const notFound = (req, res) => {
  sendError(res, `Route ${req.originalUrl} not found`, 404);
};
