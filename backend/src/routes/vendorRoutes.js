import express from "express";
import vendorController from "../controllers/vendorController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// All routes require vendor authentication
router.use(authenticate);
router.use(authorize(["vendor"]));

// Dashboard
router.get("/dashboard", vendorController.getDashboardStats);

// Properties
router.get("/properties", vendorController.getProperties);

// Bookings
router.get("/bookings", vendorController.getBookings);

// Settlements
router.get("/settlements", vendorController.getSettlements);

// Analytics
router.get("/analytics", vendorController.getAnalytics);

export default router;
