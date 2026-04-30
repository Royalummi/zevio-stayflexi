import express from "express";
import { authenticate, authorize } from "../middlewares/auth.js";
import { uploadPropertyImages as uploadMiddleware } from "../middlewares/upload.js";
import {
  uploadPropertyImages,
  getPropertyImages,
  deletePropertyImage,
  reorderPropertyImages,
} from "../controllers/propertyImagesController.js";

const router = express.Router();

// All routes require authentication and vendor authorization
router.use(authenticate);
router.use(authorize("vendor"));

/**
 * @route   POST /api/vendor/properties/:id/images
 * @desc    Upload multiple images for a property
 * @access  Private (Vendor)
 */
router.post(
  "/:id/images",
  uploadMiddleware.array("images", 40), // Allow up to 40 images at once
  uploadPropertyImages,
);

/**
 * @route   GET /api/vendor/properties/:id/images
 * @desc    Get all images for a property
 * @access  Private (Vendor)
 */
router.get("/:id/images", getPropertyImages);

/**
 * @route   DELETE /api/vendor/properties/:id/images/:imageId
 * @desc    Delete a specific property image
 * @access  Private (Vendor)
 */
router.delete("/:id/images/:imageId", deletePropertyImage);

/**
 * @route   PATCH /api/vendor/properties/:id/images/reorder
 * @desc    Reorder property images
 * @access  Private (Vendor)
 * @body    { images: [{ id: "uuid", sort_order: 1 }, ...] }
 */
router.patch("/:id/images/reorder", reorderPropertyImages);

export default router;
