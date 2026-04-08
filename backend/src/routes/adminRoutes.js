import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";
import { uploadPropertyImages as uploadPropertyImagesMiddleware } from "../middlewares/upload.js";
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
  createUser,
  resetUserPassword,
  getUserStats,
  getRevenueAnalytics,
  getBookingTrends,
  getUserActivityReport,
  getPropertyPerformance,
  getVendorPerformance,
  getAllCities,
  createCity,
  getAllVendors,
  getAllPropertyTypes,
  getAllAmenities,
  createProperty,
  updateProperty,
  updatePropertyPricing,
  deleteProperty,
  getRecommendedPropertiesAdmin,
  toggleRecommendedStatus,
  reorderRecommendedProperties,
  getPropertyImages,
  uploadPropertyImages,
  deletePropertyImage,
  clearCache,
  getVendorTerms,
  updateVendorTerms,
} from "../controllers/adminController.js";
import {
  getCalendarPricing,
  setCalendarPricing,
  deleteCalendarPricing,
  clearCalendarPricingRange,
} from "../controllers/calendarPricingController.js";
import {
  adminGetPropertyBlackouts,
  adminCreateBlackout,
  adminDeleteBlackout,
} from "../controllers/blackoutController.js";
import {
  getAllCancellationPolicies,
  createCancellationPolicy,
  updateCancellationPolicy,
  deleteCancellationPolicy,
} from "../controllers/cancellationPoliciesController.js";

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
router.post(
  "/cities",
  [
    body("name").trim().notEmpty().withMessage("City name is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    validate,
  ],
  createCity,
);
router.get("/vendors", getAllVendors);
router.get("/property-types", getAllPropertyTypes);
router.get("/amenities", getAllAmenities);

// Vendor Terms & Conditions
router.get("/vendor-terms", getVendorTerms);
router.put("/vendor-terms", updateVendorTerms);

// Cache management
router.post("/cache/clear", clearCache);

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
router.patch("/properties/:id/pricing", updatePropertyPricing);
router.delete("/properties/:id", deleteProperty);

// Property Images Management
router.get("/properties/:id/images", getPropertyImages);
router.post(
  "/properties/:id/images",
  uploadPropertyImagesMiddleware.array("images", 10), // Max 10 images per upload
  uploadPropertyImages,
);
router.delete("/properties/:id/images/:imageId", deletePropertyImage);

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
router.post(
  "/users",
  [
    body("full_name")
      .trim()
      .notEmpty()
      .withMessage("Full name is required")
      .isLength({ min: 2, max: 150 })
      .withMessage("Full name must be between 2 and 150 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("phone")
      .optional({ values: "falsy" })
      .trim()
      .matches(/^[0-9]{10}$/)
      .withMessage("Phone must be 10 digits"),
    body("role")
      .optional()
      .isIn(["customer", "vendor"])
      .withMessage("Role must be 'customer' or 'vendor'"),
    validate,
  ],
  createUser,
);
router.post("/users/:id/reset-password", resetUserPassword);
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

// Recommended Properties Management
router.get("/recommended-properties", getRecommendedPropertiesAdmin);
router.put(
  "/properties/:id/recommended",
  [
    body("is_recommended")
      .isBoolean()
      .withMessage("is_recommended must be true or false"),
    validate,
  ],
  toggleRecommendedStatus,
);
router.put(
  "/recommended-properties/reorder",
  [
    body("property_type_id")
      .notEmpty()
      .withMessage("property_type_id is required"),
    body("ordered_property_ids")
      .isArray({ min: 1, max: 12 })
      .withMessage(
        "ordered_property_ids must be an array of 1-12 property IDs",
      ),
    validate,
  ],
  reorderRecommendedProperties,
);

// ── Blackout Dates (admin can block/unblock any property) ──
router.get("/properties/:id/blackouts", adminGetPropertyBlackouts);
router.post("/properties/:id/blackouts", adminCreateBlackout);
router.delete("/properties/:id/blackouts/:blackoutId", adminDeleteBlackout);

// ── Session 70: Calendar Pricing (admin can manage any property) ──
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

// ── Session 70: Cancellation Policies (admin CRUD) ──
router.get("/cancellation-policies", getAllCancellationPolicies);
router.post("/cancellation-policies", createCancellationPolicy);
router.put("/cancellation-policies/:id", updateCancellationPolicy);
router.delete("/cancellation-policies/:id", deleteCancellationPolicy);

export default router;
