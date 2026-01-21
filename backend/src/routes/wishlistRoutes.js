import express from "express";
import {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  checkWishlistStatus,
} from "../controllers/wishlistController.js";
import { authenticate } from "../middlewares/auth.js";

const router = express.Router();

// Check wishlist status (optional auth - works for both logged in and non-logged in users)
router.get("/check/:propertyId", checkWishlistStatus);

// All other wishlist routes require authentication
router.use(authenticate);

// Add to wishlist
router.post("/", addToWishlist);

// Get my wishlist
router.get("/my", getMyWishlist);

// Remove from wishlist
router.delete("/:propertyId", removeFromWishlist);

export default router;
