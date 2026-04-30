import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllActivityLogs,
  getUserActivityLogs,
  getActivityStats,
} from "../controllers/activityLogsController.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin", "super_admin"));

// Activity logs routes
router.get("/", getAllActivityLogs);
router.get("/user/:id", getUserActivityLogs);
router.get("/stats", getActivityStats);

export default router;
