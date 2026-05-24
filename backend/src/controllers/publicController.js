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
import { sendContactEmail } from "../services/emailService.js";

// Get all active cities
export const getCities = asyncHandler(async (req, res) => {
  const [cities] = await db.query(
    `SELECT id, name, state, status, 
            (SELECT COUNT(*) FROM properties WHERE city_id = cities.id AND status = 'approved') as property_count
     FROM cities 
     WHERE status = 'active' 
     ORDER BY name ASC`,
  );

  sendSuccess(res, { cities }, "Cities fetched successfully", 200);
});

// Get all areas/localities with cities (for area-wise search)
export const getAreas = asyncHandler(async (req, res) => {
  const { property_type } = req.query;

  let propertyTypeCondition = "";
  if (property_type === "villa") {
    propertyTypeCondition = "AND p.property_type_id = 'pt-001'";
  } else if (property_type === "service_apartment") {
    propertyTypeCondition = "AND p.property_type_id = 'pt-002'";
  }

  const [areas] = await db.query(
    `SELECT DISTINCT 
       p.area, 
       c.id as city_id,
       c.name as city, 
       c.state,
       COUNT(p.id) as property_count
     FROM properties p
     INNER JOIN cities c ON p.city_id = c.id
     WHERE p.status = 'approved' 
       AND p.deleted_at IS NULL
       AND p.area IS NOT NULL 
       AND p.area != ''
       ${propertyTypeCondition}
     GROUP BY p.area, c.id, c.name, c.state
     ORDER BY c.name ASC, p.area ASC`,
  );

  sendSuccess(res, { areas }, "Areas fetched successfully", 200);
});

// Get properties (with filters)
export const getProperties = asyncHandler(async (req, res) => {
  const {
    city,
    area,
    min_price,
    max_price,
    search,
    guests,
    checkin,
    checkout,
    page = 1,
    limit = 12,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(Math.max(1, parseInt(limit) || 12), 100); // cap at 100
  const offset = (pageNum - 1) * limitNum;

  // Build WHERE conditions and a single shared params array used by both
  // the count query and the data query (pagination params appended separately).
  const whereConditions = [
    `p.status = 'approved'`,
    `p.deleted_at IS NULL`,
    `p.property_type_id = 'pt-001'`,
    `COALESCE(pr.price_per_night, 0) > 0`,
  ];
  const sharedParams = [];

  if (city) {
    whereConditions.push(`LOWER(c.name) = LOWER(?)`);
    sharedParams.push(city);
  }

  // Area filter (for area-wise search)
  if (area) {
    whereConditions.push(`p.area = ?`);
    sharedParams.push(area);
  }

  // Validate and parse price filters
  const minPriceNum = parseFloat(min_price);
  if (min_price && !isNaN(minPriceNum) && minPriceNum >= 0) {
    whereConditions.push(`pr.price_per_night >= ?`);
    sharedParams.push(minPriceNum);
  }

  const maxPriceNum = parseFloat(max_price);
  if (max_price && !isNaN(maxPriceNum) && maxPriceNum >= 0) {
    whereConditions.push(`pr.price_per_night <= ?`);
    sharedParams.push(maxPriceNum);
  }

  if (search) {
    whereConditions.push(`(p.title LIKE ? OR p.description LIKE ?)`);
    sharedParams.push(`%${search}%`, `%${search}%`);
  }

  // Filter by guest capacity
  const guestsNum = parseInt(guests);
  if (guests && !isNaN(guestsNum) && guestsNum > 0) {
    whereConditions.push(`p.max_guests >= ?`);
    sharedParams.push(guestsNum);
  }

  // Availability filter — use NOT EXISTS (faster than NOT IN for large tables)
  if (checkin && checkout) {
    whereConditions.push(`
      NOT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.property_id = p.id
          AND b.status IN ('confirmed', 'completed')
          AND b.check_in < ? AND b.check_out > ?
      )`);
    whereConditions.push(`
      NOT EXISTS (
        SELECT 1 FROM property_blackout_dates pbd
        WHERE pbd.property_id = p.id
          AND pbd.start_date <= ? AND pbd.end_date >= ?
      )`);
    sharedParams.push(checkout, checkin, checkout, checkin);
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  // Count query — uses sharedParams only (no pagination params)
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) AS total
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    ${getPricingJoinClause("p", "pr")}
    ${whereClause}
  `;

  // Data query — same WHERE clause, appends LIMIT/OFFSET
  const dataQuery = `
    SELECT
      p.id,
      p.title,
      p.description,
      p.address,
      p.area,
      p.living_area,
      p.maps_location,
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
    ${whereClause}
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  // Run count and data queries in parallel — saves one round-trip to DB
  const [[countResult], [properties]] = await Promise.all([
    db.query(countQuery, sharedParams),
    db.query(dataQuery, [...sharedParams, limitNum, offset]),
  ]);

  const total = countResult[0].total;

  // Fetch first image from property_images table for all returned properties
  let propertyImagesMap = {};
  if (properties.length > 0) {
    const propertyIds = properties.map((p) => p.id);
    const [firstImages] = await db.query(
      `SELECT property_id, image_url FROM property_images
       WHERE property_id IN (?)
       ORDER BY sort_order ASC`,
      [propertyIds],
    );
    // Group by property_id — keep only the first image per property (lowest sort_order)
    firstImages.forEach((img) => {
      if (!propertyImagesMap[img.property_id]) {
        propertyImagesMap[img.property_id] = img.image_url;
      }
    });
  }

  // Parse JSON fields (photos only, amenities now come from JOIN)
  const parsedProperties = properties.map((property) => {
    try {
      // Convert comma-separated amenities to array
      property.amenities = property.amenities
        ? property.amenities.split(", ")
        : [];
      property.photos = property.photos ? JSON.parse(property.photos) : [];

      // Prefer property_images table (R2 uploads) over legacy photos column
      if (propertyImagesMap[property.id]) {
        property.photos = [
          propertyImagesMap[property.id],
          ...property.photos.filter(
            (u) => u !== propertyImagesMap[property.id],
          ),
        ];
      }

      // Transform photos array into images format expected by frontend
      property.images = property.photos.map((url, index) => ({
        id: `${property.id}-${index}`,
        image_url: url,
        display_order: index,
      }));
    } catch (error) {
      property.amenities = [];
      property.photos = [];
      property.images = [];
    }
    return property;
  });

  sendSuccess(
    res,
    {
      properties: parsedProperties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      total,
    },
    "Properties fetched successfully",
    200,
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
      p.area,
      p.living_area,
      p.maps_location,
      c.name as city,
      c.state as state,
      p.pincode,
      p.bedrooms,
      p.bathrooms,
      p.max_guests,
      p.check_in_time,
      p.check_out_time,
      ${getAmenitiesSelectClause("p", "pa", "a")},
      ${featuresService.getFeaturesSelectClause("p", "pf", "f")},
      p.house_rules,
      p.cancellation_policy,
      p.emergency_contacts,
      p.local_area_info,
      p.safety_information,
      p.photos,
      p.rating,
      p.reviews_count,
      ${getPricingSelectClause("pr")},
      pr.discount_3_5_days,
      pr.discount_6_14_days,
      pr.discount_15_plus_days,
      p.status,
      c.id as city_id,
      v.name as vendor_name,
      v.avatar as vendor_avatar,
      v.created_at as vendor_created_at,
      p.min_stay_days,
      p.max_stay_days,
      p.same_day_booking_allowed,
      p.max_booking_days,
      p.is_recommended,
      p.recommended_priority
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    ${getPricingJoinClause("p", "pr")}
    ${getAmenitiesJoinClause("p", "pa", "a")}
    ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
    WHERE p.id = ? 
    AND p.status = 'approved' 
    AND p.deleted_at IS NULL
    GROUP BY p.id`,
    [id],
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
    // Parse house_rules if it exists (with double-encode fallback)
    if (property.house_rules && typeof property.house_rules === "string") {
      let parsed = JSON.parse(property.house_rules);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      property.house_rules = parsed;
    } else if (!property.house_rules) {
      property.house_rules = null;
    }
    // Parse cancellation_policy if it exists (with double-encode fallback)
    if (
      property.cancellation_policy &&
      typeof property.cancellation_policy === "string"
    ) {
      let parsed = JSON.parse(property.cancellation_policy);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      property.cancellation_policy = parsed;
    } else if (!property.cancellation_policy) {
      property.cancellation_policy = null;
    }
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
    [id],
  );

  // Use property_images table if available, otherwise transform photos array
  if (images.length > 0) {
    property.images = images;
  } else {
    // Transform photos array into images format expected by frontend
    property.images = property.photos.map((url, index) => ({
      id: `${property.id}-${index}`,
      image_url: url,
      sort_order: index,
    }));
  }

  sendSuccess(res, property, "Property details fetched successfully", 200);
});

// Check property availability
export const checkAvailability = asyncHandler(async (req, res) => {
  const { property_id, check_in, check_out } = req.query;

  if (!property_id || !check_in || !check_out) {
    return sendError(
      res,
      "Property ID, check-in, and check-out dates are required",
      400,
    );
  }

  // Check if property exists and is approved
  const [properties] = await db.query(
    'SELECT id FROM properties WHERE id = ? AND status = "approved" AND deleted_at IS NULL',
    [property_id],
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
    [
      property_id,
      check_in,
      check_in,
      check_out,
      check_out,
      check_in,
      check_out,
    ],
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
      200,
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
    [property_id, check_out, check_in],
  );

  if (bookings[0].count > 0) {
    return sendSuccess(
      res,
      {
        available: false,
        reason: "Property is already booked for selected dates",
      },
      "Availability checked",
      200,
    );
  }

  sendSuccess(res, { available: true }, "Property is available", 200);
});

// Get recommended properties (property-type specific)
export const getRecommendedProperties = asyncHandler(async (req, res) => {
  const { type } = req.query; // 'villa' or 'service_apartment'

  // Validate property type
  const validTypes = {
    villa: "pt-001",
    service_apartment: "pt-002",
  };

  const propertyTypeId = validTypes[type];
  if (!propertyTypeId) {
    return sendError(
      res,
      "Invalid property type. Use 'villa' or 'service_apartment'",
      400,
    );
  }

  // Fetch recommended properties (up to 12, sorted by priority)
  const [properties] = await db.query(
    `SELECT 
      p.id, 
      p.title, 
      p.description,
      p.address,
      p.area,
      p.living_area,
      p.maps_location,
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
      p.is_recommended,
      p.recommended_priority,
      p.status
    FROM properties p
    INNER JOIN cities c ON p.city_id = c.id
    ${getPricingJoinClause("p", "pr")}
    ${getAmenitiesJoinClause("p", "pa", "a")}
    ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
    WHERE p.status = 'approved' 
    AND p.deleted_at IS NULL
    AND p.property_type_id = ?
    AND p.is_recommended = 1
    GROUP BY p.id
    ORDER BY p.recommended_priority DESC, p.rating DESC
    LIMIT 12`,
    [propertyTypeId],
  );

  // Parse JSON fields
  const parsedProperties = properties.map((property) => {
    try {
      property.amenities = property.amenities
        ? property.amenities.split(", ")
        : [];
      property.photos = property.photos ? JSON.parse(property.photos) : [];
      property.images = property.photos.map((url, index) => ({
        id: `${property.id}-${index}`,
        image_url: url,
        display_order: index,
      }));
    } catch (error) {
      property.amenities = [];
      property.photos = [];
      property.images = [];
    }
    return property;
  });

  sendSuccess(
    res,
    {
      properties: parsedProperties,
      count: parsedProperties.length,
      property_type: type,
    },
    "Recommended properties fetched successfully",
    200,
  );
});

/**
 * @route   GET /api/public/properties/:id/blocked-dates
 * @desc    Return booked + blackout date ranges for the property calendar
 * @access  Public
 */
export const getPropertyBlockedDates = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [blackouts] = await db.query(
    `SELECT start_date, end_date
     FROM property_blackout_dates
     WHERE property_id = ? AND end_date >= CURDATE()
     ORDER BY start_date ASC`,
    [id],
  );

  const [bookings] = await db.query(
    `SELECT check_in AS start_date, check_out AS end_date
     FROM bookings
     WHERE property_id = ?
       AND (
         status = 'confirmed'
         OR (
           status = 'pending_payment'
           AND (expires_at IS NULL OR expires_at > NOW())
         )
       )
       AND check_out >= CURDATE()
     ORDER BY check_in ASC`,
    [id],
  );

  // Tag each range so the client can apply correct end-date inclusion logic:
  // blackouts: end_date is INCLUSIVE (the last blocked day)
  // bookings:  end_date is the check-out day — available for new check-ins
  const taggedBlackouts = blackouts.map((b) => ({ ...b, type: "blackout" }));
  const taggedBookings = bookings.map((b) => ({ ...b, type: "booking" }));

  sendSuccess(
    res,
    { blackouts: taggedBlackouts, bookings: taggedBookings },
    "Blocked dates retrieved",
  );
});

/**
 * @route   POST /api/public/contact
 * @desc    Submit contact form — forwards to support@zevio.in
 * @access  Public
 */
export const submitContactForm = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return sendError(res, "Name, email, subject and message are required", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, "Invalid email address", 400);
  }

  if (message.length > 2000) {
    return sendError(res, "Message is too long (max 2000 characters)", 400);
  }

  await sendContactEmail({ name, email, phone: phone || "", subject, message });
  sendSuccess(res, null, "Your message has been sent. We'll get back to you within 24 hours.");
});
