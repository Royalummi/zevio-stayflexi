import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";

/**
 * @desc    Get all notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;
  const { filter } = req.query; // 'all' or 'unread'

  let query = "SELECT * FROM notifications WHERE recipient_id = ?";
  const params = [userId];

  if (filter === "unread") {
    query += " AND is_read = false";
  }

  query += " ORDER BY created_at DESC";

  const [notifications] = await db.query(query, params);

  sendSuccess(
    res,
    { notifications, total: notifications.length },
    "Notifications fetched successfully",
    200,
  );
});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  // Check if notification belongs to user
  const [notification] = await db.query(
    "SELECT * FROM notifications WHERE id = ? AND recipient_id = ?",
    [id, userId],
  );

  if (notification.length === 0) {
    return sendError(res, "Notification not found", 404);
  }

  // Mark as read
  await db.query(
    "UPDATE notifications SET is_read = true WHERE id = ? AND recipient_id = ?",
    [id, userId],
  );

  sendSuccess(res, null, "Notification marked as read", 200);
});

/**
 * @desc    Mark all notifications as read for user
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;

  await db.query(
    "UPDATE notifications SET is_read = true WHERE recipient_id = ?",
    [userId],
  );

  sendSuccess(res, null, "All notifications marked as read", 200);
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  // Check if notification belongs to user
  const [notification] = await db.query(
    "SELECT * FROM notifications WHERE id = ? AND recipient_id = ?",
    [id, userId],
  );

  if (notification.length === 0) {
    return sendError(res, "Notification not found", 404);
  }

  // Delete notification
  await db.query(
    "DELETE FROM notifications WHERE id = ? AND recipient_id = ?",
    [id, userId],
  );

  sendSuccess(res, null, "Notification deleted successfully", 200);
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { id: userId } = req.user;

  const [result] = await db.query(
    "SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = false",
    [userId],
  );

  sendSuccess(
    res,
    { unreadCount: result[0].count },
    "Unread count fetched successfully",
    200,
  );
});
