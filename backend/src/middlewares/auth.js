import { verifyAccessToken } from "../config/jwt.js";
import { sendError } from "../utils/response.js";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, error.message, 401);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "Forbidden: Insufficient permissions", 403);
    }

    next();
  };
};
