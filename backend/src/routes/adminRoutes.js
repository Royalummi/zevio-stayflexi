import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllBookings,
  getBookingStats,
  processRefund,
  getVendorSettlements,
  markSettlementPaid,
  getEmployeeClaims,
  processEmployeeClaim,
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
  getEmployeePerformance,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin", "super_admin"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Bookings
router.get("/bookings", getAllBookings);
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
  processRefund
);

// Vendor settlements
router.get("/settlements/vendor", getVendorSettlements);
router.post(
  "/settlements/vendor/mark-paid",
  [
    body("settlement_id").notEmpty().withMessage("Settlement ID is required"),
    body("payment_proof").optional().isString(),
    validate,
  ],
  markSettlementPaid
);

// Employee claims
router.get("/claims/employee", getEmployeeClaims);
router.post(
  "/claims/employee/process",
  [
    body("claim_id").notEmpty().withMessage("Claim ID is required"),
    body("action")
      .isIn(["approve", "reject", "pay"])
      .withMessage("Valid action is required"),
    body("payment_proof").optional().isString(),
    validate,
  ],
  processEmployeeClaim
);

// Properties management
router.get("/properties", getAllProperties);
router.get("/properties/stats", getPropertyStats);
router.get("/properties/:id", getPropertyDetails);
router.put(
  "/properties/:id/status",
  [
    body("status")
      .isIn(["pending_approval", "approved", "inactive", "draft"])
      .withMessage("Valid status is required"),
    body("rejection_reason").optional().isString(),
    validate,
  ],
  updatePropertyStatus
);

// User management
router.get("/users", getAllUsers);
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
  updateUserStatus
);

// Reports & Analytics
router.get("/reports/revenue", getRevenueAnalytics);
router.get("/reports/booking-trends", getBookingTrends);
router.get("/reports/user-activity", getUserActivityReport);
router.get("/reports/property-performance", getPropertyPerformance);
router.get("/reports/vendor-performance", getVendorPerformance);
router.get("/reports/employee-performance", getEmployeePerformance);

export default router;
