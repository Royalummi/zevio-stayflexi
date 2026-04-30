import express from "express";
import { body } from "express-validator";
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
  sendManualReviewRequest,
  checkReviewStatus,
} from "../controllers/bookingController.js";

const router = express.Router();

// REMOVED: Booking rate limiting for startup mode
// Users can book freely without restrictions

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
// Create new booking
router.post("/", authorize("user"), createBookingValidation, createBooking);
router.get("/my", authorize("user"), getMyBookings);
router.get(
  "/:id",
  authorize("user", "admin", "super_admin"),
  getBookingDetails,
);
router.post("/:id/cancel-request", authorize("user"), requestCancellation);
router.post(
  "/validate-coupon",
  authorize("user"),
  validateCouponValidation,
  validateCoupon,
);

// ==========================================
// SESSION 30: PENDING BOOKING MANAGEMENT ROUTES
// ==========================================
// Check for pending booking for a property
router.get(
  "/pending-check/:propertyId",
  authorize("user"),
  checkPendingBooking,
);

// Modify pending booking (dates/guests)
router.put("/:id/modify-pending", authorize("user"), modifyPendingBooking);

// Cancel pending booking
router.delete("/:id/cancel-pending", authorize("user"), cancelPendingBooking);

// ==========================================
// SESSION 64: REVIEW REQUEST ROUTES
// ==========================================
// Check if user has submitted a review for this booking
router.get("/:id/reviews/check", authorize("user"), checkReviewStatus);

// Admin manual trigger for review request email
router.post(
  "/:id/send-review-request",
  authorize("admin", "super_admin"),
  sendManualReviewRequest,
);

export default router;
