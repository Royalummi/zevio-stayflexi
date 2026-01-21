import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  getAllCoupons,
  getCouponDetails,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponUsage,
} from "../controllers/couponsController.js";

const router = express.Router();

// Validation schemas
const createCouponValidation = [
  body("code")
    .notEmpty()
    .withMessage("Coupon code is required")
    .isLength({ min: 4, max: 20 })
    .withMessage("Coupon code must be between 4-20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Coupon code must contain only uppercase letters and numbers"),
  body("discount_type")
    .notEmpty()
    .withMessage("Discount type is required")
    .isIn(["percentage", "flat"])
    .withMessage("Discount type must be 'percentage' or 'flat'"),
  body("discount_value")
    .notEmpty()
    .withMessage("Discount value is required")
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number"),
  body("max_discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max discount must be a positive number"),
  body("min_booking_amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min booking amount must be a positive number"),
  body("start_date")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date format"),
  body("end_date")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid end date format"),
  body("usage_limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be at least 1"),
];

const updateCouponValidation = [
  body("code")
    .optional()
    .isLength({ min: 4, max: 20 })
    .withMessage("Coupon code must be between 4-20 characters")
    .matches(/^[A-Z0-9]+$/)
    .withMessage("Coupon code must contain only uppercase letters and numbers"),
  body("discount_type")
    .optional()
    .isIn(["percentage", "flat"])
    .withMessage("Discount type must be 'percentage' or 'flat'"),
  body("discount_value")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number"),
  body("max_discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Max discount must be a positive number"),
  body("min_booking_amount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Min booking amount must be a positive number"),
  body("start_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid start date format"),
  body("end_date")
    .optional()
    .isISO8601()
    .withMessage("Invalid end date format"),
  body("usage_limit")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Usage limit must be at least 1"),
  body("status")
    .optional()
    .isIn(["active", "inactive"])
    .withMessage("Status must be 'active' or 'inactive'"),
];

// All routes require admin authentication
router.use(authenticate);
router.use(authorize("admin"));

// Coupon CRUD routes
router.get("/", getAllCoupons);
router.get("/:id", getCouponDetails);
router.post("/", createCouponValidation, validate, createCoupon);
router.patch("/:id", updateCouponValidation, validate, updateCoupon);
router.delete("/:id", deleteCoupon);

// Coupon usage statistics
router.get("/:id/usage", getCouponUsage);

export default router;
