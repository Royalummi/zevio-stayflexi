import express from "express";
import vendorController from "../controllers/vendorController.js";
import vendorPropertyController from "../controllers/vendorPropertyController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";

const router = express.Router();

// All routes require vendor authentication
router.use(authenticate);
router.use(authorize("vendor")); // Fixed: Use string, not array

// Dashboard (stats - no pagination)
router.get("/dashboard", vendorController.getDashboardStats);

// Properties Management
router.post("/properties", vendorPropertyController.createProperty); // Create property
router.get("/properties/:id", vendorPropertyController.getPropertyById); // Get property by ID
router.patch("/properties/:id", vendorPropertyController.updateProperty); // Update property
router.patch("/properties/:id/submit", vendorPropertyController.submitProperty); // Submit for approval
router.delete("/properties/:id", vendorPropertyController.deleteProperty); // Delete property (soft delete)
router.get("/properties", validatePagination, vendorController.getProperties); // List properties

// Bookings (with pagination)
router.get("/bookings", validatePagination, vendorController.getBookings);

// Settlements (with pagination)
router.get("/settlements", validatePagination, vendorController.getSettlements);

// Analytics (stats - no pagination)
router.get("/analytics", vendorController.getAnalytics);

export default router;
