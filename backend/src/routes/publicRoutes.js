import express from "express";
import {
  getCities,
  getProperties,
  getPropertyDetails,
  checkAvailability,
} from "../controllers/publicController.js";

const router = express.Router();

// Public routes (no authentication required)
router.get("/cities", getCities);
router.get("/properties", getProperties);
router.get("/property/:id", getPropertyDetails);
router.get("/availability", checkAvailability);

export default router;
