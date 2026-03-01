/**
 * ============================================================================
 * CORPORATE ROUTES
 * ============================================================================
 * Date: January 17, 2026
 * Session: 35 - Service Apartments Expansion
 * ============================================================================
 */

import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerCorporate,
  verifyCorporateEmail,
  getCorporateStatus,
  resendCorporateVerification,
} from "../controllers/corporateController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Max 5 resend attempts per IP per hour
const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many resend attempts. Please wait an hour and try again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/corporate/register
 * @desc    Register a new corporate user
 * @access  Public
 */
router.post("/register", registerCorporate);

/**
 * @route   POST /api/corporate/verify-email
 * @desc    Verify corporate email address
 * @access  Public
 */
router.post("/verify-email", verifyCorporateEmail);

/**
 * @route   POST /api/corporate/resend-verification
 * @desc    Resend corporate email verification
 * @access  Public
 */
router.post("/resend-verification", resendLimiter, resendCorporateVerification);

/**
 * @route   GET /api/corporate/status
 * @desc    Get corporate verification status
 * @access  Private (requires authentication)
 */
router.get("/status", authenticate, getCorporateStatus);

export default router;
