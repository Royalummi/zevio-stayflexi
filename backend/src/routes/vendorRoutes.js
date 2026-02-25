import express from "express";
import vendorController from "../controllers/vendorController.js";
import vendorPropertyController from "../controllers/vendorPropertyController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";
import {
  getCalendarPricing,
  setCalendarPricing,
  deleteCalendarPricing,
  clearCalendarPricingRange,
} from "../controllers/calendarPricingController.js";

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

// ── Session 70: Calendar Pricing (vendor manages own properties) ──
router.get("/properties/:propertyId/calendar-pricing", getCalendarPricing);
router.post("/properties/:propertyId/calendar-pricing", setCalendarPricing);
router.delete(
  "/properties/:propertyId/calendar-pricing",
  clearCalendarPricingRange,
);
router.delete(
  "/properties/:propertyId/calendar-pricing/:priceDate",
  deleteCalendarPricing,
);

// Bookings (with pagination)
router.get("/bookings", validatePagination, vendorController.getBookings);

// Settlements (with pagination)
router.get("/settlements", validatePagination, vendorController.getSettlements);

// Analytics (stats - no pagination)
router.get("/analytics", vendorController.getAnalytics);

export default router;
