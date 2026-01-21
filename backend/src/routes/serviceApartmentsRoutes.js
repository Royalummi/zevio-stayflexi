/**
 * ============================================================================
 * SERVICE APARTMENTS ROUTES
 * ============================================================================
 * Date: January 17, 2026
 * Session: 35 - Service Apartments Expansion
 * ============================================================================
 */

import express from "express";
import {
  listServiceApartments,
  getCalendarAvailability,
  calculatePrice,
  getCorporateOffers,
  getServiceApartmentLocations,
} from "../controllers/serviceApartmentsController.js";

const router = express.Router();

/**
 * @route   GET /api/service-apartments
 * @desc    List service apartments with filters
 * @access  Public
 */
router.get("/", listServiceApartments);

/**
 * @route   POST /api/service-apartments/calculate-price
 * @desc    Calculate dynamic pricing with long-stay discounts
 * @access  Public
 * @note    MUST be before /:id routes to avoid being caught by dynamic routing
 */
router.post("/calculate-price", calculatePrice);

/**
 * @route   GET /api/service-apartments/corporate-offers
 * @desc    List service apartments with corporate discounts
 * @access  Public
 * @note    MUST be before /:id routes to avoid being caught by dynamic routing
 */
router.get("/corporate-offers", getCorporateOffers);

/**
 * @route   GET /api/service-apartments/locations
 * @desc    Get unique locations (city + area) where service apartments are available
 * @access  Public
 * @note    MUST be before /:id routes to avoid being caught by dynamic routing
 */
router.get("/locations", getServiceApartmentLocations);

/**
 * @route   GET /api/service-apartments/:id/calendar
 * @desc    Get calendar availability for a service apartment
 * @access  Public
 * @note    Dynamic route - MUST be after specific routes like /calculate-price
 */
router.get("/:id/calendar", getCalendarAvailability);

export default router;
