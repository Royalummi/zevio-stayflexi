import express from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} from "../controllers/notificationsController.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - Get all notifications (with optional filter)
router.get("/", getNotifications);

// GET /api/notifications/unread-count - Get unread notification count
router.get("/unread-count", getUnreadCount);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put("/read-all", markAllAsRead);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put("/:id/read", markAsRead);

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", deleteNotification);

export default router;
