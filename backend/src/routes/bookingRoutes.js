import express from "express";
import { body } from "express-validator";
import rateLimit from "express-rate-limit";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
  requestCancellation,
  validateCoupon,
  checkPendingBooking,
  modifyPendingBooking,
  cancelPendingBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// ============================================
// CRITICAL FIX: RATE LIMITING
// Prevent abuse and DOS attacks on booking endpoint
// Limit: 10 requests per 15 minutes per IP
// ============================================
const bookingRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increased from 10 to 100 - allows frequent dashboard refreshes
  message: {
    success: false,
    message: "Too many booking attempts. Please try again later.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Validation rules
const createBookingValidation = [
  body("property_id").notEmpty().withMessage("Property ID is required"),
  body("check_in").isISO8601().withMessage("Valid check-in date is required"),
  body("check_out").isISO8601().withMessage("Valid check-out date is required"),
  body("coupon_code").optional().isString(),
  validate,
];

const validateCouponValidation = [
  body("code").notEmpty().withMessage("Coupon code is required"),
  body("booking_amount")
    .isFloat({ min: 0 })
    .withMessage("Valid booking amount is required"),
  validate,
];

// All routes require authentication
router.use(authenticate);

// User routes
// Create new booking (with rate limiting)
router.post(
  "/",
  bookingRateLimiter,
  authorize("user"),
  createBookingValidation,
  createBooking
);
router.get("/my", authorize("user"), getMyBookings);
router.get(
  "/:id",
  authorize("user", "admin", "super_admin", "employee"),
  getBookingDetails
);
router.post("/:id/cancel-request", authorize("user"), requestCancellation);
router.post(
  "/validate-coupon",
  authorize("user"),
  validateCouponValidation,
  validateCoupon
);

// ==========================================
// SESSION 30: PENDING BOOKING MANAGEMENT ROUTES
// ==========================================
// Check for pending booking for a property
router.get(
  "/pending-check/:propertyId",
  authorize("user"),
  checkPendingBooking
);

// Modify pending booking (dates/guests)
router.put("/:id/modify-pending", authorize("user"), modifyPendingBooking);

// Cancel pending booking
router.delete("/:id/cancel-pending", authorize("user"), cancelPendingBooking);

export default router;
