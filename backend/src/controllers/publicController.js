import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import {
  getPricingSelectClause,
  getPricingJoinClause,
} from "../services/pricingService.js";
import {
  getAmenitiesSelectClause,
  getAmenitiesJoinClause,
} from "../services/amenitiesService.js";
import featuresService from "../services/featuresService.js";

// Get all active cities
export const getCities = asyncHandler(async (req, res) => {
  const [cities] = await db.query(
    `SELECT id, name, state, status, 
            (SELECT COUNT(*) FROM properties WHERE city_id = cities.id AND status = 'approved') as property_count
     FROM cities 
     WHERE status = 'active' 
     ORDER BY name ASC`
  );

  sendSuccess(res, { cities }, "Cities fetched successfully", 200);
});

// Get properties (with filters)
export const getProperties = asyncHandler(async (req, res) => {
  const {
    city,
    min_price,
    max_price,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  let query = `
    SELECT 
      p.id, 
      p.title, 
      p.description,
      p.address,
      c.name as city,
      c.state as state,
      p.pincode,
      p.bedrooms,
      p.bathrooms,
      p.max_guests,
      ${getAmenitiesSelectClause("p", "pa", "a")},
      ${featuresService.getFeaturesSelectClause("p", "pf", "f")},
      p.photos,
      p.rating,
      p.reviews_count,
      ${getPricingSelectClause("pr")},
      p.status
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    ${getPricingJoinClause("p", "pr")}
    ${getAmenitiesJoinClause("p", "pa", "a")}
    ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
    WHERE p.status = 'approved' 
    AND p.deleted_at IS NULL
  `;

  const params = [];

  if (city) {
    query += ` AND c.id = ?`;
    params.push(city);
  }

  // Validate and parse price filters
  const minPriceNum = parseFloat(min_price);
  if (min_price && !isNaN(minPriceNum) && minPriceNum >= 0) {
    query += ` AND pr.price_per_night >= ?`;
    params.push(minPriceNum);
  }

  const maxPriceNum = parseFloat(max_price);
  if (max_price && !isNaN(maxPriceNum) && maxPriceNum >= 0) {
    query += ` AND pr.price_per_night <= ?`;
    params.push(maxPriceNum);
  }

  if (search) {
    query += ` AND (p.title LIKE ? OR p.description LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Add GROUP BY for amenities aggregation
  query += ` GROUP BY p.id`;

  // Count total (need to count distinct properties)
  let countQuery = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    ${getPricingJoinClause("p", "pr")}
    WHERE p.status = 'approved' 
    AND p.deleted_at IS NULL
  `;

  if (city) {
    countQuery += " AND c.id = ?";
  }
  if (min_price && !isNaN(parseFloat(min_price))) {
    countQuery += " AND pr.price_per_night >= ?";
  }
  if (max_price && !isNaN(parseFloat(max_price))) {
    countQuery += " AND pr.price_per_night <= ?";
  }
  if (search) {
    countQuery += " AND (p.title LIKE ? OR p.description LIKE ?)";
  }

  const [countResult] = await db.query(countQuery, params);
  const total = countResult[0].total;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [properties] = await db.query(query, params);

  // Parse JSON fields (photos only, amenities now come from JOIN)
  const parsedProperties = properties.map((property) => {
    try {
      // Convert comma-separated amenities to array
      property.amenities = property.amenities
        ? property.amenities.split(", ")
        : [];
      property.photos = property.photos ? JSON.parse(property.photos) : [];
    } catch (error) {
      property.amenities = [];
      property.photos = [];
    }
    return property;
  });

  sendSuccess(
    res,
    {
      properties: parsedProperties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Properties fetched successfully",
    200
  );
});

// Get single property details
export const getPropertyDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get property details
  const [properties] = await db.query(
    `SELECT 
      p.id, 
      p.title, 
      pt.name as property_type,
      p.description,
      p.address,
      c.name as city,
      c.state as state,
      p.pincode,
      p.bedrooms,
      p.bathrooms,
      p.check_in_time,
      p.check_out_time,
      ${getAmenitiesSelectClause("p", "pa", "a")},
      ${featuresService.getFeaturesSelectClause("p", "pf", "f")},
      p.house_rules,
      p.cancellation_policy,
      p.photos,
      p.rating,
      p.reviews_count,
      ${getPricingSelectClause("pr")},
      p.status,
      c.id as city_id,
      v.name as vendor_name,
      e.name as employee_name
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN employees e ON p.employee_id = e.id
    ${getPricingJoinClause("p", "pr")}
    ${getAmenitiesJoinClause("p", "pa", "a")}
    ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
    WHERE p.id = ? 
    AND p.status = 'approved' 
    AND p.deleted_at IS NULL
    GROUP BY p.id`,
    [id]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const property = properties[0];

  // Parse JSON fields
  try {
    // Convert comma-separated amenities to array
    property.amenities = property.amenities
      ? property.amenities.split(", ")
      : [];
    property.photos = property.photos ? JSON.parse(property.photos) : [];
    // Parse house_rules if it exists
    property.house_rules = property.house_rules
      ? typeof property.house_rules === "string"
        ? JSON.parse(property.house_rules)
        : property.house_rules
      : null;
    // Parse cancellation_policy if it exists
    property.cancellation_policy = property.cancellation_policy
      ? typeof property.cancellation_policy === "string"
        ? JSON.parse(property.cancellation_policy)
        : property.cancellation_policy
      : null;
  } catch (error) {
    property.amenities = [];
    property.photos = [];
    property.house_rules = null;
    property.cancellation_policy = null;
  }

  // Get property images from property_images table as fallback
  const [images] = await db.query(
    `SELECT id, image_url, sort_order 
     FROM property_images 
     WHERE property_id = ? 
     ORDER BY sort_order ASC`,
    [id]
  );

  property.images = images;

  sendSuccess(res, property, "Property details fetched successfully", 200);
});

// Check property availability
export const checkAvailability = asyncHandler(async (req, res) => {
  const { property_id, check_in, check_out } = req.query;

  if (!property_id || !check_in || !check_out) {
    return sendError(
      res,
      "Property ID, check-in, and check-out dates are required",
      400
    );
  }

  // Check if property exists and is approved
  const [properties] = await db.query(
    'SELECT id FROM properties WHERE id = ? AND status = "approved" AND deleted_at IS NULL',
    [property_id]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  // Check blackout dates
  const [blackouts] = await db.query(
    `SELECT COUNT(*) as count 
     FROM property_blackout_dates 
     WHERE property_id = ? 
     AND (
       (start_date <= ? AND end_date >= ?) OR
       (start_date <= ? AND end_date >= ?) OR
       (start_date >= ? AND end_date <= ?)
     )`,
    [property_id, check_in, check_in, check_out, check_out, check_in, check_out]
  );

  if (blackouts[0].count > 0) {
    return sendSuccess(
      res,
      {
        available: false,
        reason:
          "Property is not available for selected dates (blackout period)",
      },
      "Availability checked",
      200
    );
  }

  // Check existing bookings
  const [bookings] = await db.query(
    `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE property_id = ? 
     AND status IN ('confirmed', 'completed') 
     AND (
       (check_in < ? AND check_out > ?)
     )`,
    [property_id, check_out, check_in]
  );

  if (bookings[0].count > 0) {
    return sendSuccess(
      res,
      {
        available: false,
        reason: "Property is already booked for selected dates",
      },
      "Availability checked",
      200
    );
  }

  sendSuccess(res, { available: true }, "Property is available", 200);
});
