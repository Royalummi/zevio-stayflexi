import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";
import {
  getAllBookings,
  getBookingStats,
  processRefund,
  getVendorSettlements,
  markSettlementPaid,
  getDashboardStats,
  getAllProperties,
  getPropertyDetails,
  updatePropertyStatus,
  getPropertyStats,
  getAllUsers,
  getUserDetails,
  updateUserStatus,
  getUserStats,
  getRevenueAnalytics,
  getBookingTrends,
  getUserActivityReport,
  getPropertyPerformance,
  getVendorPerformance,
  getAllCities,
  getAllVendors,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin", "super_admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Bookings (with pagination)
router.get("/bookings", validatePagination, getAllBookings);
router.get("/bookings/stats", getBookingStats);

// Refunds
router.post(
  "/refund",
  [
    body("booking_id").notEmpty().withMessage("Booking ID is required"),
    body("refund_percentage")
      .isFloat({ min: 0, max: 100 })
      .withMessage("Valid refund percentage is required"),
    validate,
  ],
  processRefund,
);

// Vendor settlements (with pagination)
router.get("/settlements/vendor", validatePagination, getVendorSettlements);
router.post(
  "/settlements/vendor/mark-paid",
  [
    body("settlement_id").notEmpty().withMessage("Settlement ID is required"),
    body("payment_proof").optional().isString(),
    validate,
  ],
  markSettlementPaid,
);

// Dropdown data (small datasets - no pagination needed)
router.get("/cities", getAllCities);
router.get("/vendors", getAllVendors);

// Properties management (with pagination)
router.get("/properties", validatePagination, getAllProperties);
router.get("/properties/stats", getPropertyStats);
router.get("/properties/:id", getPropertyDetails);
router.post(
  "/properties",
  [
    body("title").notEmpty().withMessage("Title is required"),
    body("vendor_id").notEmpty().withMessage("Vendor is required"),
    body("city_id").notEmpty().withMessage("City is required"),
    body("price_per_night")
      .isFloat({ min: 0 })
      .withMessage("Valid price is required"),
    validate,
  ],
  createProperty,
);
router.put("/properties/:id", updateProperty);
router.delete("/properties/:id", deleteProperty);
router.put(
  "/properties/:id/status",
  [
    body("status")
      .isIn(["pending_approval", "approved", "inactive", "draft"])
      .withMessage("Valid status is required"),
    body("rejection_reason").optional().isString(),
    validate,
  ],
  updatePropertyStatus,
);

// User management (with pagination)
router.get("/users", validatePagination, getAllUsers);
router.get("/users/stats", getUserStats);
router.get("/users/:id", getUserDetails);
router.put(
  "/users/:id/status",
  [
    body("status")
      .isIn(["active", "blocked"])
      .withMessage("Valid status is required"),
    body("reason").optional().isString(),
    validate,
  ],
  updateUserStatus,
);

// Reports & Analytics (stats - no pagination needed)
router.get("/reports/revenue", getRevenueAnalytics);
router.get("/reports/booking-trends", getBookingTrends);
router.get("/reports/user-activity", getUserActivityReport);
router.get("/reports/property-performance", getPropertyPerformance);
router.get("/reports/vendor-performance", getVendorPerformance);

export default router;
