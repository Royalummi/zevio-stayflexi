/**
 * ============================================================================
 * CORPORATE ROUTES
 * ============================================================================
 * Date: January 17, 2026
 * Session: 35 - Service Apartments Expansion
 * ============================================================================
 */

import express from "express";
import {
  registerCorporate,
  verifyCorporateEmail,
  getCorporateStatus,
  resendCorporateVerification,
} from "../controllers/corporateController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

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
router.post("/resend-verification", resendCorporateVerification);

/**
 * @route   GET /api/corporate/status
 * @desc    Get corporate verification status
 * @access  Private (requires authentication)
 */
router.get("/status", authenticate, getCorporateStatus);

export default router;
