import express from "express";
import { body } from "express-validator";
import vendorController from "../controllers/vendorController.js";
import vendorPropertyController from "../controllers/vendorPropertyController.js";
import {
  getPropertyBlackouts,
  createBlackout,
  deleteBlackout,
} from "../controllers/blackoutController.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { validatePagination } from "../middlewares/pagination.js";
import { validate } from "../middlewares/validator.js";
import {
  createCity,
  getAllCities,
  getPropertyImages,
  uploadPropertyImages,
  deletePropertyImage,
} from "../controllers/adminController.js";
import { uploadPropertyImages as uploadPropertyImagesMiddleware } from "../middlewares/upload.js";
import {
  getCalendarPricing,
  setCalendarPricing,
  deleteCalendarPricing,
  clearCalendarPricingRange,
} from "../controllers/calendarPricingController.js";
import db from "../config/database.js";

const router = express.Router();

// All routes require vendor authentication
router.use(authenticate);
router.use(authorize("vendor")); // Fixed: Use string, not array

// Middleware: verify property belongs to this vendor
const verifyPropertyOwner = async (req, res, next) => {
  try {
    const propertyId = req.params.id;
    const vendorId = req.user.id;
    const [rows] = await db.query(
      "SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL",
      [propertyId, vendorId],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unauthorized",
      });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// Dashboard (stats - no pagination)
router.get("/dashboard", vendorController.getDashboardStats);

// Properties Management
router.post("/properties", vendorPropertyController.createProperty); // Create property
router.get("/properties/:id", vendorPropertyController.getPropertyById); // Get property by ID
router.patch("/properties/:id", vendorPropertyController.updateProperty); // Update property
router.patch("/properties/:id/submit", vendorPropertyController.submitProperty); // Submit for approval
router.delete("/properties/:id", vendorPropertyController.deleteProperty); // Delete property (soft delete)
router.get("/properties", validatePagination, vendorController.getProperties); // List properties

// Property Images Management (vendor must own the property)
router.get("/properties/:id/images", verifyPropertyOwner, getPropertyImages);
router.post(
  "/properties/:id/images",
  verifyPropertyOwner,
  uploadPropertyImagesMiddleware.array("images", 40),
  uploadPropertyImages,
);
router.delete(
  "/properties/:id/images/:imageId",
  verifyPropertyOwner,
  deletePropertyImage,
);

// ── Session 70: Calendar Pricing (vendor manages own properties) ──
router.get("/properties/:propertyId/calendar-pricing", getCalendarPricing);
router.post("/properties/:propertyId/calendar-pricing", setCalendarPricing);
router.delete(
  "/properties/:propertyId/calendar-pricing",
  clearCalendarPricingRange,
);
router.delete(
  "/properties/:propertyId/calendar-pricing/:priceDate",
  deleteCalendarPricing,
);

// ── Blackout Dates (manual blocking calendar) ──
router.get("/properties/:id/blackouts", getPropertyBlackouts);
router.post("/properties/:id/blackouts", createBlackout);
router.delete("/properties/:id/blackouts/:blackoutId", deleteBlackout);

// Bookings (with pagination)
router.get("/bookings", validatePagination, vendorController.getBookings);

// Settlements (with pagination)
router.get("/settlements", validatePagination, vendorController.getSettlements);

// Analytics (stats - no pagination)
router.get("/analytics", vendorController.getAnalytics);

// Bank details
router.put("/bank-details", vendorController.updateBankDetails);

// Cities (vendors can list & add cities for their properties)
router.get("/cities", getAllCities);
router.post(
  "/cities",
  [
    body("name").trim().notEmpty().withMessage("City name is required"),
    body("state").trim().notEmpty().withMessage("State is required"),
    validate,
  ],
  createCity,
);

export default router;
