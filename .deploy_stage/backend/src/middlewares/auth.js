import { verifyAccessToken } from "../config/jwt.js";
import { sendError } from "../utils/response.js";
import db from "../config/database.js";

const TABLE_MAP = {
  user: "users",
  admin: "admins",
  super_admin: "admins",
  vendor: "vendors",
};

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "No token provided", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists and is active in DB
    const tableName = TABLE_MAP[decoded.role];
    if (!tableName) {
      return sendError(res, "Invalid role in token", 401);
    }

    const [rows] = await db.query(
      `SELECT id, status FROM ${tableName} WHERE id = ? AND deleted_at IS NULL`,
      [decoded.id],
    );

    if (rows.length === 0 || rows[0].status !== "active") {
      return sendError(res, "Account is inactive or deleted", 401);
    }

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
