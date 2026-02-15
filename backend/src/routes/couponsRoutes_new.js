/**
 * SESSION 64: COUPON ROUTES
 * Admin coupon management + User coupon validation
 */

import express from "express";
import { protect, adminOnly } from "../middlewares/auth.js";
import {
  createCoupon,
  listCoupons,
  getCouponDetails,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponAnalytics,
} from "../controllers/couponController.js";

const router = express.Router();

// ============================================
// ADMIN ROUTES (Protected + Admin Only)
// ============================================
router.post("/admin/coupons", protect, adminOnly, createCoupon);
router.get("/admin/coupons", protect, adminOnly, listCoupons);
router.get("/admin/coupons/analytics", protect, adminOnly, getCouponAnalytics);
router.get("/admin/coupons/:id", protect, adminOnly, getCouponDetails);
router.patch("/admin/coupons/:id", protect, adminOnly, updateCoupon);
router.delete("/admin/coupons/:id", protect, adminOnly, deleteCoupon);

// ============================================
// USER ROUTES (Protected)
// ============================================
router.post("/coupons/validate", protect, validateCoupon);

export default router;
