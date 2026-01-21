import express from "express";
import { body } from "express-validator";
import { validate } from "../middlewares/validator.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";
import {
  submitReview,
  getPropertyReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  replyToReview,
  getAllReviews,
  moderateReview,
} from "../controllers/reviewsController.js";

const router = express.Router();

// Validation schemas
const submitReviewValidation = [
  body("property_id").notEmpty().withMessage("Property ID is required"),
  body("booking_id").notEmpty().withMessage("Booking ID is required"),
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isFloat({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
  body("review_text").optional().isString(),
  body("cleanliness_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Cleanliness rating must be between 1 and 5"),
  body("accuracy_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Accuracy rating must be between 1 and 5"),
  body("check_in_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Check-in rating must be between 1 and 5"),
  body("communication_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Communication rating must be between 1 and 5"),
  body("location_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Location rating must be between 1 and 5"),
  body("value_rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Value rating must be between 1 and 5"),
];

const replyValidation = [
  body("reply_text")
    .notEmpty()
    .withMessage("Reply text is required")
    .isLength({ min: 10 })
    .withMessage("Reply must be at least 10 characters"),
];

const moderateValidation = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isIn(["pending", "published", "flagged", "removed"])
    .withMessage("Invalid status"),
];

// Public routes (with pagination)
router.get("/property/:propertyId", validatePagination, getPropertyReviews);

// User routes (authenticated)
router.post(
  "/",
  authenticate,
  authorize("user"),
  submitReviewValidation,
  validate,
  submitReview
);

router.get(
  "/my",
  authenticate,
  authorize("user"),
  validatePagination,
  getMyReviews
);

router.patch(
  "/:id",
  authenticate,
  authorize("user"),
  submitReviewValidation,
  validate,
  updateReview
);

router.delete("/:id", authenticate, authorize("user"), deleteReview);

// Vendor routes
router.post(
  "/:id/reply",
  authenticate,
  authorize("vendor"),
  replyValidation,
  validate,
  replyToReview
);

// Admin routes (with pagination)
router.get(
  "/admin/all",
  authenticate,
  authorize("admin"),
  validatePagination,
  getAllReviews
);

router.patch(
  "/admin/:id/status",
  authenticate,
  authorize("admin"),
  moderateValidation,
  validate,
  moderateReview
);

export default router;
