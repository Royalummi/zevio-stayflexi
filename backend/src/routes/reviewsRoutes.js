/**
 * SESSION 64: REVIEW ROUTES
 * Post-stay review collection with admin moderation
 */

import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  submitReview,
  getPropertyReviews,
  adminListReviews,
  adminEditReview,
  adminApproveReview,
  adminRejectReview,
  adminGetReviewDetails,
} from "../controllers/reviewsController.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES - Property Reviews
// ============================================
// Get approved reviews for a property (public, no auth required)
router.get("/properties/:propertyId/reviews", getPropertyReviews);

// ============================================
// USER ROUTES - Submit Reviews
// ============================================
// User submits review after completed stay
router.post("/bookings/:bookingId/reviews", authenticate, submitReview);

// ============================================
// ADMIN ROUTES - Review Management
// ============================================
// List all reviews with filters
router.get(
  "/admin/reviews",
  authenticate,
  authorize("admin", "super_admin"),
  adminListReviews,
);

// Get review details
router.get(
  "/admin/reviews/:reviewId",
  authenticate,
  authorize("admin", "super_admin"),
  adminGetReviewDetails,
);

// Edit review (FULL EDIT POWERS - text + ratings)
router.patch(
  "/admin/reviews/:reviewId",
  authenticate,
  authorize("admin", "super_admin"),
  adminEditReview,
);

// Approve review (make visible)
router.post(
  "/admin/reviews/:reviewId/approve",
  authenticate,
  authorize("admin", "super_admin"),
  adminApproveReview,
);

// Reject review (hide it)
router.post(
  "/admin/reviews/:reviewId/reject",
  authenticate,
  authorize("admin", "super_admin"),
  adminRejectReview,
);

export default router;
