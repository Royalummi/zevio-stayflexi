/**
 * ============================================================================
 * SERVICE APARTMENTS CONTROLLER
 * ============================================================================
 * Handles all service apartment specific endpoints:
 * - Listing with filters
 * - Calendar availability
 * - Dynamic pricing calculator
 * - Corporate offers listing
 *
 * Author: Senior Full-Stack Developer
 * Date: January 18, 2026 (Updated for Phase 1 Normalization)
 * Session: 36 - Database Normalization Phase 1
 * ============================================================================
 */

import db from "../config/database.js";
import {
  getPricingSelectClause,
  getPricingSelectClauseGrouped,
  getPricingJoinClause,
} from "../services/pricingService.js";
import {
  getAmenitiesSelectClause,
  getAmenitiesJoinClause,
} from "../services/amenitiesService.js";
import featuresService from "../services/featuresService.js";

/**
 * Compute the calendar-aware base amount for a date range.
 * Uses custom per-day prices from property_calendar_pricing where available,
 * falls back to the property's base price_per_night for uncustomised days.
 */
const getCalendarBaseAmount = async (
  propertyId,
  checkIn,
  checkOut,
  pricePerNight,
) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  const [calendarRows] = await db.query(
    `SELECT DATE_FORMAT(price_date, '%Y-%m-%d') AS price_date, price
     FROM property_calendar_pricing
     WHERE property_id = ?
       AND price_date >= ?
       AND price_date < ?`,
    [propertyId, checkIn, checkOut],
  );

  const calendarMap = {};
  for (const row of calendarRows) {
    calendarMap[row.price_date] = parseFloat(row.price);
  }

  let total = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10);
    total += calendarMap[key] !== undefined ? calendarMap[key] : pricePerNight;
    cursor.setDate(cursor.getDate() + 1);
  }
  return total;
};

/**
 * GET /api/service-apartments
 * List service apartments with advanced filters
 */
export const listServiceApartments = async (req, res) => {
  try {
    const {
      city,
      area,
      min_price,
      max_price,
      bedrooms,
      min_stay,
      max_stay,
      has_workspace,
      has_housekeeping,
      has_elevator,
      has_gym,
      has_parking,
      allow_corporate_booking,
      guests,
      checkin,
      checkout,
      page = 1,
      limit = 10,
      sort_by = "price_per_night",
      sort_order = "ASC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build WHERE clause dynamically
    let whereConditions = [
      "p.property_type_id = 'pt-002'",
      "p.status = 'approved'",
    ];
    const queryParams = [];

    // Filters for properties table columns
    if (city) {
      whereConditions.push("LOWER(c.name) = LOWER(?)");
      queryParams.push(city);
    }
    if (area) {
      whereConditions.push("LOWER(p.area) = LOWER(?)");
      queryParams.push(area);
    }
    if (bedrooms) {
      whereConditions.push("p.bedrooms = ?");
      queryParams.push(parseInt(bedrooms));
    }
    if (min_stay) {
      whereConditions.push("p.min_stay_days <= ?");
      queryParams.push(parseInt(min_stay));
    }
    if (max_stay) {
      whereConditions.push("(p.max_stay_days >= ? OR p.max_stay_days IS NULL)");
      queryParams.push(parseInt(max_stay));
    }

    // Filters for property_pricing table columns
    if (min_price) {
      whereConditions.push("pr.price_per_night >= ?");
      queryParams.push(parseFloat(min_price));
    }
    if (max_price) {
      whereConditions.push("pr.price_per_night <= ?");
      queryParams.push(parseFloat(max_price));
    }
    if (allow_corporate_booking === "true") {
      whereConditions.push("pr.allow_corporate_booking = TRUE");
    }

    // Filter by guest capacity
    const guestsNum = parseInt(guests);
    if (guests && !isNaN(guestsNum) && guestsNum > 0) {
      whereConditions.push("p.max_guests >= ?");
      queryParams.push(guestsNum);
    }

    // Availability filter — exclude properties with overlapping confirmed bookings
    // or blackout dates during the requested stay period.
    if (checkin && checkout) {
      whereConditions.push(`p.id NOT IN (
        SELECT b.property_id FROM bookings b
        WHERE b.status IN ('confirmed', 'completed')
          AND b.check_in < ? AND b.check_out > ?
      )`);
      queryParams.push(checkout, checkin);
      whereConditions.push(`p.id NOT IN (
        SELECT pbd.property_id FROM property_blackout_dates pbd
        WHERE pbd.start_date <= ? AND pbd.end_date >= ?
      )`);
      queryParams.push(checkout, checkin);
    }
    // TODO: Re-enable feature filters after basic query works
    // const featureFilters = [];
    // if (has_workspace === "true") featureFilters.push("workspace");
    // if (has_housekeeping === "true") featureFilters.push("housekeeping");
    // if (has_elevator === "true") featureFilters.push("elevator");
    // if (has_gym === "true") featureFilters.push("gym");
    // if (has_parking === "true") featureFilters.push("parking");

    const whereClause = whereConditions.join(" AND ");

    // Validate sort column
    const validSortColumns = [
      "price_per_night",
      "bedrooms",
      "rating",
      "created_at",
      "min_stay_days",
    ];
    const sortColumn = validSortColumns.includes(sort_by)
      ? sort_by
      : "price_per_night";
    const sortDirection = sort_order.toUpperCase() === "DESC" ? "DESC" : "ASC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM properties p
      ${getPricingJoinClause("p", "pr")}
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, queryParams);
    const totalProperties = countResult[0].total;

    // Get properties with pagination
    const propertiesQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        pt.name as property_type,
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
        ${getPricingSelectClauseGrouped("pr")},
        p.min_stay_days,
        p.max_stay_days,
        p.housekeeping_frequency,
        p.utilities_included,
        p.parking_slots,
        p.floor_number,
        p.wifi_speed_mbps,
        p.wifi_provider,
        p.furnishing_type,
        v.name as vendor_name,
        e.name as employee_name,
        p.same_day_booking_allowed,
        p.max_booking_days,
        p.is_recommended,
        p.recommended_priority,
        p.created_at
      FROM properties p
      ${getPricingJoinClause("p", "pr")}
      ${getAmenitiesJoinClause("p", "pa", "a")}
      ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN employees e ON p.employee_id = e.id
      WHERE ${whereClause}
      GROUP BY p.id, c.name, c.state
      ORDER BY ${
        sortColumn.includes("price") ||
        sortColumn.includes("discount") ||
        sortColumn.includes("corporate")
          ? sortColumn
          : "p." + sortColumn
      } ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const [properties] = await db.query(propertiesQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    // Parse JSON fields and format response
    const formattedProperties = properties.map((property) => ({
      ...property,
      amenities: property.amenities
        ? property.amenities.split(", ").filter((a) => a.trim())
        : [],
      features: property.features_list
        ? property.features_list.split(", ").filter((f) => f.trim())
        : [],
      photos:
        typeof property.photos === "string"
          ? JSON.parse(property.photos)
          : property.photos,
      utilities_included: Boolean(property.utilities_included),
      allow_corporate_booking: Boolean(property.allow_corporate_booking),
    }));

    res.json({
      success: true,
      data: {
        properties: formattedProperties,
        pagination: {
          total: totalProperties,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalProperties / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error listing service apartments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service apartments",
      error: error.message,
    });
  }
};

/**
 * GET /api/service-apartments/:id/calendar
 * Get calendar availability for a service apartment
 */
export const getCalendarAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, month, year } = req.query;

    // Determine date range
    let startDate, endDate;

    if (start_date && end_date) {
      startDate = start_date;
      endDate = end_date;
    } else if (month && year) {
      startDate = `${year}-${String(month).padStart(2, "0")}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    } else {
      // Default to current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).getDate();
      endDate = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0",
      )}-${lastDay}`;
    }

    // Verify property exists and is a service apartment
    const [property] = await db.query(
      `SELECT p.id, p.title, pr.price_per_night 
       FROM properties p
       LEFT JOIN property_pricing pr ON p.id = pr.property_id
       WHERE p.id = ? AND p.property_type_id = 'pt-002'`,
      [id],
    );

    if (property.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service apartment not found",
      });
    }

    // Get calendar data
    // INDUSTRY STANDARD APPROACH: Calculate availability on-demand
    // Instead of pre-populating calendar (which doesn't scale),
    // we query actual bookings and blackout dates

    // 1. Get confirmed bookings for this property in date range
    const [bookings] = await db.query(
      `SELECT 
        b.id as booking_id,
        b.check_in,
        b.check_out,
        b.status,
        u.full_name as guest_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.property_id = ?
        AND b.status IN ('confirmed', 'checked_in', 'pending')
        AND b.check_out >= ?
        AND b.check_in <= ?
      ORDER BY b.check_in ASC`,
      [id, startDate, endDate],
    );

    // 2. Get blackout dates (manually blocked by admin/vendor)
    const [blackoutDates] = await db.query(
      `SELECT 
        start_date,
        end_date,
        reason
      FROM property_blackout_dates
      WHERE property_id = ?
        AND end_date >= ?
        AND start_date <= ?
      ORDER BY start_date ASC`,
      [id, startDate, endDate],
    );

    // 3. Calculate availability for each date in range
    const calendar = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const propertyPrice = property[0].price_per_night;

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0];

      // Check if date is booked
      const booking = bookings.find((b) => {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);
        const currentDate = new Date(dateStr);
        return currentDate >= checkIn && currentDate < checkOut;
      });

      // Check if date is in blackout period
      const blackout = blackoutDates.find((bd) => {
        const blackoutStart = new Date(bd.start_date);
        const blackoutEnd = new Date(bd.end_date);
        const currentDate = new Date(dateStr);
        return currentDate >= blackoutStart && currentDate <= blackoutEnd;
      });

      let status = "available";
      let notes = null;
      let bookingId = null;

      if (booking) {
        status = booking.status === "pending" ? "pending" : "booked";
        notes = `Booked by ${booking.guest_name}`;
        bookingId = booking.booking_id;
      } else if (blackout) {
        status = "blocked";
        notes = blackout.reason || "Unavailable";
      }

      calendar.push({
        date: dateStr,
        status,
        price: propertyPrice,
        min_stay: 1, // Can be customized per property
        is_booked: !!booking,
        booking_id: bookingId,
        color: getStatusColor(status),
        notes,
      });
    }

    res.json({
      success: true,
      data: {
        property: property[0],
        date_range: {
          start: startDate,
          end: endDate,
        },
        calendar: calendar,
      },
    });
  } catch (error) {
    console.error("Error fetching calendar availability:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch calendar availability",
      error: error.message,
    });
  }
};

/**
 * POST /api/service-apartments/calculate-price
 * Calculate dynamic pricing with long-stay discounts
 */
export const calculatePrice = async (req, res) => {
  try {
    const { property_id, check_in, check_out, is_corporate = false } = req.body;

    console.log("[Calculate Price] Request body:", req.body);

    // Validate required fields
    if (!property_id || !check_in || !check_out) {
      console.log("[Calculate Price] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "property_id, check_in, and check_out are required",
        received: { property_id, check_in, check_out },
      });
    }

    // Get property details
    const [property] = await db.query(
      `SELECT 
        p.id,
        p.title,
        pr.price_per_night,
        pr.gst_percentage,
        pr.weekly_discount_percent,
        pr.monthly_discount_percent,
        pr.quarterly_discount_percent,
        pr.long_term_discount_percent,
        pr.allow_corporate_booking,
        pr.corporate_discount_percent,
        p.min_stay_days,
        p.max_stay_days
      FROM properties p
      LEFT JOIN property_pricing pr ON p.id = pr.property_id
      WHERE p.id = ? AND p.property_type_id = 'pt-002' AND p.status = 'approved'`,
      [property_id],
    );

    console.log(
      "[Calculate Price] Property query result:",
      property.length > 0 ? "Found" : "Not found",
    );

    if (property.length === 0) {
      console.log("[Calculate Price] Property not found:", property_id);
      return res.status(404).json({
        success: false,
        message: "Service apartment not found or not available",
        property_id: property_id,
      });
    }

    const propertyData = property[0];
    console.log("[Calculate Price] Property data:", {
      id: propertyData.id,
      title: propertyData.title,
      price_per_night: propertyData.price_per_night,
    });

    // Calculate number of nights
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24),
    );

    console.log("[Calculate Price] Dates:", {
      check_in,
      check_out,
      nights,
    });

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Check-out date must be after check-in date",
      });
    }

    // Validate min/max stay
    if (propertyData.min_stay_days && nights < propertyData.min_stay_days) {
      return res.status(400).json({
        success: false,
        message: `Minimum stay is ${propertyData.min_stay_days} nights`,
      });
    }

    if (propertyData.max_stay_days && nights > propertyData.max_stay_days) {
      return res.status(400).json({
        success: false,
        message: `Maximum stay is ${propertyData.max_stay_days} nights`,
      });
    }

    // Calculate base price using calendar-aware per-night prices
    const basePrice = await getCalendarBaseAmount(
      property_id,
      check_in,
      check_out,
      parseFloat(propertyData.price_per_night),
    );

    // Determine long-stay discount
    let longStayDiscount = 0;
    let discountType = "none";

    if (nights >= 180) {
      longStayDiscount = parseFloat(
        propertyData.long_term_discount_percent || 0,
      );
      discountType = "long_term";
    } else if (nights >= 90) {
      longStayDiscount = parseFloat(
        propertyData.quarterly_discount_percent || 0,
      );
      discountType = "quarterly";
    } else if (nights >= 30) {
      longStayDiscount = parseFloat(propertyData.monthly_discount_percent || 0);
      discountType = "monthly";
    } else if (nights >= 7) {
      longStayDiscount = parseFloat(propertyData.weekly_discount_percent || 0);
      discountType = "weekly";
    }

    const longStayDiscountAmount = (basePrice * longStayDiscount) / 100;
    const priceAfterLongStayDiscount = basePrice - longStayDiscountAmount;

    // Apply corporate discount if applicable
    let corporateDiscount = 0;
    let corporateDiscountAmount = 0;

    if (is_corporate && propertyData.allow_corporate_booking) {
      corporateDiscount = parseFloat(
        propertyData.corporate_discount_percent || 0,
      );
      corporateDiscountAmount =
        (priceAfterLongStayDiscount * corporateDiscount) / 100;
    }

    const priceAfterAllDiscounts =
      priceAfterLongStayDiscount - corporateDiscountAmount;

    // Calculate GST
    const gstPercentage = parseFloat(propertyData.gst_percentage || 18);
    const gstAmount = (priceAfterAllDiscounts * gstPercentage) / 100;

    // Total amount
    const totalAmount = priceAfterAllDiscounts + gstAmount;

    res.json({
      success: true,
      data: {
        property_id: property_id,
        property_title: propertyData.title,
        check_in: check_in,
        check_out: check_out,
        nights: nights,
        pricing: {
          base_price: parseFloat(basePrice.toFixed(2)),
          price_per_night: parseFloat(propertyData.price_per_night),
          long_stay_discount: {
            type: discountType,
            percentage: longStayDiscount,
            amount: parseFloat(longStayDiscountAmount.toFixed(2)),
          },
          corporate_discount: {
            applicable: is_corporate && propertyData.allow_corporate_booking,
            percentage: corporateDiscount,
            amount: parseFloat(corporateDiscountAmount.toFixed(2)),
          },
          subtotal: parseFloat(priceAfterAllDiscounts.toFixed(2)),
          gst: {
            percentage: gstPercentage,
            amount: parseFloat(gstAmount.toFixed(2)),
          },
          total: parseFloat(totalAmount.toFixed(2)),
        },
        savings: {
          total_discount: parseFloat(
            (longStayDiscountAmount + corporateDiscountAmount).toFixed(2),
          ),
          percentage_saved: parseFloat(
            (
              ((longStayDiscountAmount + corporateDiscountAmount) / basePrice) *
              100
            ).toFixed(2),
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error calculating price:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate price",
      error: error.message,
    });
  }
};

/**
 * GET /api/service-apartments/corporate-offers
 * List service apartments with corporate booking enabled
 */
export const getCorporateOffers = async (req, res) => {
  try {
    const { city, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [
      "p.property_type_id = 'pt-002'",
      "p.status = 'approved'",
      "pr.allow_corporate_booking = TRUE",
    ];
    const queryParams = [];

    if (city) {
      whereConditions.push("LOWER(c.name) = LOWER(?)");
      queryParams.push(city);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM properties p LEFT JOIN property_pricing pr ON p.id = pr.property_id LEFT JOIN cities c ON p.city_id = c.id WHERE ${whereClause}`;
    const [countResult] = await db.query(countQuery, queryParams);
    const totalProperties = countResult[0].total;

    // Get properties
    const propertiesQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        c.name as city,
        c.state as state,
        p.address,
        pr.price_per_night,
        p.bedrooms,
        p.bathrooms,
        p.photos,
        pr.corporate_discount_percent,
        p.wifi_speed_mbps,
        ROUND(pr.price_per_night * (1 - pr.corporate_discount_percent / 100), 2) as corporate_price
      FROM properties p
      LEFT JOIN property_pricing pr ON p.id = pr.property_id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE ${whereClause}
      ORDER BY pr.corporate_discount_percent DESC, pr.price_per_night ASC
      LIMIT ? OFFSET ?
    `;

    const [properties] = await db.query(propertiesQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    const formattedProperties = properties.map((property) => ({
      ...property,
      photos:
        typeof property.photos === "string"
          ? JSON.parse(property.photos)
          : property.photos,
      savings: parseFloat(
        (property.price_per_night - property.corporate_price).toFixed(2),
      ),
    }));

    res.json({
      success: true,
      data: {
        properties: formattedProperties,
        pagination: {
          total: totalProperties,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(totalProperties / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching corporate offers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch corporate offers",
      error: error.message,
    });
  }
};

/**
 * GET /api/service-apartments/:id
 * Get complete service apartment details by ID
 * Returns all property fields, pricing, policy, and images
 */
export const getServiceApartmentDetails = async (req, res) => {
  try {
    const { id } = req.params;

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
        p.house_rules,
        p.cancellation_policy,
        p.emergency_contacts,
        p.local_area_info,
        p.safety_information,
        p.amenities_guide,
        p.house_rules_text,
        p.check_in_guidelines,
        p.photos,
        p.rating,
        p.reviews_count,
        p.min_stay_days,
        p.max_stay_days,
        p.same_day_booking_allowed,
        p.max_booking_days,
        p.is_recommended,
        p.recommended_priority,
        p.housekeeping_frequency,
        p.utilities_included,
        p.parking_slots,
        p.floor_number,
        p.wifi_speed_mbps,
        p.wifi_provider,
        p.furnishing_type,
        p.status,
        c.id as city_id,
        v.name as vendor_name,
        e.name as employee_name,
        ${getPricingSelectClause("pr")},
        ${getAmenitiesSelectClause("p", "pa", "a")},
        ${featuresService.getFeaturesSelectClause("p", "pf", "f")}
      FROM properties p
      INNER JOIN cities c ON p.city_id = c.id
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN employees e ON p.employee_id = e.id
      ${getPricingJoinClause("p", "pr")}
      ${getAmenitiesJoinClause("p", "pa", "a")}
      ${featuresService.getFeaturesJoinClause("p", "pf", "f")}
      WHERE p.id = ?
        AND p.property_type_id = 'pt-002'
        AND p.status = 'approved'
        AND p.deleted_at IS NULL
      GROUP BY p.id`,
      [id],
    );

    if (properties.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service apartment not found",
      });
    }

    const property = properties[0];

    // Parse JSON fields
    try {
      property.amenities = property.amenities
        ? property.amenities.split(", ").filter((a) => a.trim())
        : [];
      property.features = property.features_list
        ? property.features_list.split(", ").filter((f) => f.trim())
        : [];
      property.photos =
        typeof property.photos === "string"
          ? JSON.parse(property.photos)
          : property.photos || [];
      property.house_rules = property.house_rules
        ? typeof property.house_rules === "string"
          ? JSON.parse(property.house_rules)
          : property.house_rules
        : null;
      property.cancellation_policy = property.cancellation_policy
        ? typeof property.cancellation_policy === "string"
          ? JSON.parse(property.cancellation_policy)
          : property.cancellation_policy
        : null;
      property.utilities_included = Boolean(property.utilities_included);
      property.allow_corporate_booking = Boolean(
        property.allow_corporate_booking,
      );
    } catch {
      property.amenities = [];
      property.features = [];
      property.photos = [];
    }

    // Get property images from property_images table as fallback
    const [images] = await db.query(
      `SELECT id, image_url, sort_order
       FROM property_images
       WHERE property_id = ?
       ORDER BY sort_order ASC`,
      [id],
    );

    if (images.length > 0) {
      property.images = images;
    } else {
      property.images = property.photos.map((url, index) => ({
        id: `${property.id}-${index}`,
        image_url: url,
        sort_order: index,
      }));
    }

    res.json({
      success: true,
      data: property,
      message: "Service apartment details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching service apartment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service apartment details",
      error: error.message,
    });
  }
};

// Helper function to get status color
const getStatusColor = (status) => {
  const colorMap = {
    available: "#10b981", // green
    booked: "#ef4444", // red
    blocked: "#6b7280", // gray
    maintenance: "#f59e0b", // orange
  };
  return colorMap[status] || "#6b7280";
};

/**
 * GET /api/service-apartments/locations
 * Get unique locations (city + area) where service apartments are available
 */
export const getServiceApartmentLocations = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        c.id,
        c.name,
        c.state,
        c.status,
        p.area,
        COUNT(DISTINCT p.id) as property_count
      FROM cities c
      INNER JOIN properties p ON c.id = p.city_id
      WHERE p.property_type_id = 'pt-002'
        AND p.status = 'approved'
        AND c.status = 'active'
        AND p.area IS NOT NULL
        AND p.area != ''
      GROUP BY c.id, c.name, c.state, c.status, p.area
      ORDER BY c.name ASC, p.area ASC
    `;

    const [locations] = await db.query(query);

    res.status(200).json({
      success: true,
      data: locations,
      message: `Found ${locations.length} service apartment locations`,
    });
  } catch (error) {
    console.error("Error fetching service apartment locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch service apartment locations",
      error: error.message,
    });
  }
};
