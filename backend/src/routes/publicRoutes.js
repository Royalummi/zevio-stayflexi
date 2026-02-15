import express from "express";
import { validatePagination } from "../middlewares/pagination.js";
import {
  getCities,
  getAreas,
  getProperties,
  getPropertyDetails,
  checkAvailability,
  getRecommendedProperties,
} from "../controllers/publicController.js";
import {
  getAllAmenities,
  getAllPropertyTypes,
} from "../controllers/adminController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/cities", getCities); // Small dataset - no pagination
router.get("/areas", getAreas); // Get areas/localities for area-wise search
router.get("/amenities", getAllAmenities); // For vendor property forms
router.get("/property-types", getAllPropertyTypes); // For vendor property forms
router.get("/properties", validatePagination, getProperties); // CRITICAL: Paginate property listings
router.get("/property/:id", getPropertyDetails);
router.get("/availability", checkAvailability);
router.get("/recommended-properties", getRecommendedProperties); // Get admin-curated recommended properties

export default router;
