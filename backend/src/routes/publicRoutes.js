import express from "express";
import { validatePagination } from "../middlewares/pagination.js";
import {
  getCities,
  getProperties,
  getPropertyDetails,
  checkAvailability,
} from "../controllers/publicController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/cities", getCities); // Small dataset - no pagination
router.get("/properties", validatePagination, getProperties); // CRITICAL: Paginate property listings
router.get("/property/:id", getPropertyDetails);
router.get("/availability", checkAvailability);

export default router;
