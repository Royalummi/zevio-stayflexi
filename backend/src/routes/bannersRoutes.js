/**
 * SESSION 70: BANNER ROUTES
 * Admin CRUD + Public active banners endpoint
 */

import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import {
  createBanner,
  listBanners,
  getBannerById,
  updateBanner,
  toggleBanner,
  deleteBanner,
  getActiveBanners,
} from "../controllers/bannersController.js";

const router = express.Router();

// ============================================
// PUBLIC: Active banners for the Next.js site
// GET /api/banners/active
// ============================================
router.get("/banners/active", getActiveBanners);

// ============================================
// ADMIN ROUTES
// ============================================
router.post(
  "/admin/banners",
  authenticate,
  authorize("admin", "super_admin"),
  createBanner,
);

router.get(
  "/admin/banners",
  authenticate,
  authorize("admin", "super_admin"),
  listBanners,
);

router.get(
  "/admin/banners/:id",
  authenticate,
  authorize("admin", "super_admin"),
  getBannerById,
);

router.patch(
  "/admin/banners/:id",
  authenticate,
  authorize("admin", "super_admin"),
  updateBanner,
);

router.patch(
  "/admin/banners/:id/toggle",
  authenticate,
  authorize("admin", "super_admin"),
  toggleBanner,
);

router.delete(
  "/admin/banners/:id",
  authenticate,
  authorize("admin", "super_admin"),
  deleteBanner,
);

export default router;
