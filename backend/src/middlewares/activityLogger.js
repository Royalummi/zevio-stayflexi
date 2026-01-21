import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * Activity Logging Middleware
 * Auto-logs all admin/vendor critical actions
 */
export const activityLogger = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to log after successful response
    res.json = function (data) {
      // Only log if response was successful (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const actorId = req.user?.id;
        const actorRole = req.user?.role;
        const entityId = req.params?.id || data?.data?.id || null;

        if (
          actorId &&
          actorRole &&
          ["admin", "super_admin", "vendor"].includes(actorRole)
        ) {
          logActivity(actorId, actorRole, action, entity, entityId).catch(
            (err) => console.error("Activity logging failed:", err)
          );
        }
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Log activity to database
 */
async function logActivity(actorId, actorRole, action, entity, entityId) {
  try {
    const logId = generateUUID();
    await db.query(
      `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, actorId, actorRole, action, entity, entityId]
    );
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

/**
 * Manual activity logging (for use in controllers)
 */
export async function logManualActivity(
  actorId,
  actorRole,
  action,
  entity,
  entityId
) {
  return logActivity(actorId, actorRole, action, entity, entityId);
}
