import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";

/**
 * @route   GET /api/admin/activity-logs
 * @desc    Get all activity logs with filtering and pagination
 * @access  Private (Admin)
 */
export const getAllActivityLogs = asyncHandler(async (req, res) => {
  const {
    actor_role,
    entity,
    page = 1,
    limit = 50,
    date_from,
    date_to,
  } = req.query;
  const offset = (page - 1) * limit;

  let filters = [];
  let params = [];

  if (actor_role && ["admin", "super_admin", "vendor"].includes(actor_role)) {
    filters.push("al.actor_role = ?");
    params.push(actor_role);
  }

  if (entity) {
    filters.push("al.entity = ?");
    params.push(entity);
  }

  if (date_from) {
    filters.push("al.created_at >= ?");
    params.push(date_from);
  }

  if (date_to) {
    filters.push("al.created_at <= ?");
    params.push(date_to);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(" AND ")}` : "";

  // Get logs with actor details
  params.push(parseInt(limit), parseInt(offset));

  const [logs] = await db.query(
    `SELECT 
      al.id, al.action, al.entity, al.entity_id, al.created_at,
      al.actor_role,
      CASE
        WHEN al.actor_role = 'admin' OR al.actor_role = 'super_admin' 
        THEN (SELECT name FROM admins WHERE id = al.actor_id)
        WHEN al.actor_role = 'vendor' 
        THEN (SELECT name FROM vendors WHERE id = al.actor_id)
        ELSE 'Unknown'
      END as actor_name,
      CASE
        WHEN al.actor_role = 'admin' OR al.actor_role = 'super_admin' 
        THEN (SELECT email FROM admins WHERE id = al.actor_id)
        WHEN al.actor_role = 'vendor' 
        THEN (SELECT email FROM vendors WHERE id = al.actor_id)
        ELSE NULL
      END as actor_email
    FROM activity_logs al
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?`,
    params
  );

  // Get total count
  const countParams = params.slice(0, -2); // Remove limit and offset
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM activity_logs al ${whereClause}`,
    countParams
  );

  sendSuccess(res, "Activity logs retrieved successfully", {
    logs,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

/**
 * @route   GET /api/admin/activity-logs/user/:id
 * @desc    Get activity logs for a specific user (admin/vendor)
 * @access  Private (Admin)
 */
export const getUserActivityLogs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  const [logs] = await db.query(
    `SELECT 
      id, action, entity, entity_id, actor_role, created_at
    FROM activity_logs
    WHERE actor_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    [id, parseInt(limit), parseInt(offset)]
  );

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM activity_logs WHERE actor_id = ?`,
    [id]
  );

  sendSuccess(res, "User activity logs retrieved successfully", {
    logs,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

/**
 * @route   GET /api/admin/activity-logs/stats
 * @desc    Get activity statistics (actions per day, top actors, etc.)
 * @access  Private (Admin)
 */
export const getActivityStats = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Actions per day (last N days)
  const [dailyStats] = await db.query(
    `SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_actions,
      COUNT(DISTINCT actor_id) as unique_actors
    FROM activity_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC`,
    [parseInt(days)]
  );

  // Top actors
  const [topActors] = await db.query(
    `SELECT 
      al.actor_id,
      al.actor_role,
      COUNT(*) as action_count,
      CASE
        WHEN al.actor_role = 'admin' OR al.actor_role = 'super_admin' 
        THEN (SELECT name FROM admins WHERE id = al.actor_id)
        WHEN al.actor_role = 'vendor' 
        THEN (SELECT name FROM vendors WHERE id = al.actor_id)
        ELSE 'Unknown'
      END as actor_name
    FROM activity_logs al
    WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY al.actor_id, al.actor_role
    ORDER BY action_count DESC
    LIMIT 10`,
    [parseInt(days)]
  );

  // Actions by entity type
  const [entityStats] = await db.query(
    `SELECT 
      entity,
      COUNT(*) as action_count
    FROM activity_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY entity
    ORDER BY action_count DESC`,
    [parseInt(days)]
  );

  sendSuccess(res, "Activity statistics retrieved successfully", {
    daily_stats: dailyStats,
    top_actors: topActors,
    entity_stats: entityStats,
  });
});
