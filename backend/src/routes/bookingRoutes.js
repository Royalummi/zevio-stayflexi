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
} from "../controllers/bookingController.js";

const router = express.Router();

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
router.post("/", authorize("user"), createBookingValidation, createBooking);
router.get("/my", authorize("user"), getMyBookings);
router.get("/:id", getBookingDetails);
router.post("/:id/cancel-request", authorize("user"), requestCancellation);
router.post(
  "/validate-coupon",
  authorize("user"),
  validateCouponValidation,
  validateCoupon
);

export default router;
