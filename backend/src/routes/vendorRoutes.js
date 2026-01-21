import express from "express";
import vendorController from "../controllers/vendorController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";

const router = express.Router();

// All routes require vendor authentication
router.use(authenticate);
router.use(authorize(["vendor"]));

// Dashboard (stats - no pagination)
router.get("/dashboard", vendorController.getDashboardStats);

// Properties (with pagination)
router.get("/properties", validatePagination, vendorController.getProperties);

// Bookings (with pagination)
router.get("/bookings", validatePagination, vendorController.getBookings);

// Settlements (with pagination)
router.get("/settlements", validatePagination, vendorController.getSettlements);

// Analytics (stats - no pagination)
router.get("/analytics", vendorController.getAnalytics);

export default router;
