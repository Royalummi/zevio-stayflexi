import express from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  checkWishlistStatus,
} from "../controllers/wishlistController.js";
import { authenticate, authorize } from "../middlewares/auth.js";

const router = express.Router();

// Check wishlist status (optional auth - works for both logged in and non-logged in users)
router.get("/check/:propertyId", checkWishlistStatus);

// All other wishlist routes require authentication AND must be a regular user
// (Admins/Vendors cannot use wishlists — their user_id is not in the users table)
router.use(authenticate);
router.use(authorize("user"));

// Add to wishlist
router.post("/", addToWishlist);

// Get my wishlist
router.get("/my", getMyWishlist);

// Remove from wishlist
router.delete("/:propertyId", removeFromWishlist);

export default router;
