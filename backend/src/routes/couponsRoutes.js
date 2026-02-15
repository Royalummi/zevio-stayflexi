/**
 * SESSION 64: COUPON ROUTES
 * Admin coupon management + User coupon validation
 */

import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createCoupon,
  listCoupons,
  getCouponDetails,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponAnalytics,
} from "../controllers/couponsController.js";

const router = express.Router();

// ============================================
// ADMIN ROUTES (Protected + Admin Only)
// ============================================
router.post(
  "/admin/coupons",
  authenticate,
  authorize("admin", "super_admin"),
  createCoupon,
);
router.get(
  "/admin/coupons",
  authenticate,
  authorize("admin", "super_admin"),
  listCoupons,
);
router.get(
  "/admin/coupons/analytics",
  authenticate,
  authorize("admin", "super_admin"),
  getCouponAnalytics,
);
router.get(
  "/admin/coupons/:id",
  authenticate,
  authorize("admin", "super_admin"),
  getCouponDetails,
);
router.patch(
  "/admin/coupons/:id",
  authenticate,
  authorize("admin", "super_admin"),
  updateCoupon,
);
router.delete(
  "/admin/coupons/:id",
  authenticate,
  authorize("admin", "super_admin"),
  deleteCoupon,
);

// ============================================
// USER ROUTES (Protected) - for validation at checkout
// ============================================
router.post("/coupons/validate", authenticate, validateCoupon);

export default router;
