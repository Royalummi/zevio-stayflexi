import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import {
  sendCancellationEmail,
  sendRefundEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";
import { sanitizeRichText } from "../utils/sanitize.js";
import { notifyVendor } from "../services/notificationEmailService.js";
import cashfreeService from "../services/cashfree.service.js";
import {
  uploadToR2,
  deleteFromR2,
  isR2Configured,
} from "../utils/r2Storage.js";
import { generateSecurePassword, hashPassword } from "../utils/password.js";

// SESSION 41: Replaced Razorpay with Cashfree for refunds
// SESSION 56.7: Added Cloudflare R2 for image storage

// ===================================================================
// IN-MEMORY CACHE FOR DROPDOWN DATA (SESSION 17 - PERFORMANCE OPTIMIZATION)
// ===================================================================
const cache = {
  cities: { data: null, timestamp: null },
  vendors: { data: null, timestamp: null },
  propertyTypes: { data: null, timestamp: null },
  amenities: { data: null, timestamp: null },
};

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry.data || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// Clear all cache or specific cache entries
export const clearCache = asyncHandler(async (req, res) => {
  const { type } = req.query; // type can be 'all', 'cities', 'vendors', 'propertyTypes'

  if (!type || type === "all") {
    // Clear all cache
    cache.cities = { data: null, timestamp: null };
    cache.vendors = { data: null, timestamp: null };
    cache.propertyTypes = { data: null, timestamp: null };
    return sendSuccess(res, null, "All cache cleared successfully", 200);
  }

  // Clear specific cache
  if (cache[type]) {
    cache[type] = { data: null, timestamp: null };
    return sendSuccess(res, null, `${type} cache cleared successfully`, 200);
  }

  return sendError(res, "Invalid cache type", 400);
});

// Get all bookings (with filters)
export const getAllBookings = asyncHandler(async (req, res) => {
  const {
    status,
    payment_status,
    property_id,
    user_id,
    from_date,
    to_date,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  let query = `
    SELECT 
      b.*,
      u.full_name as user_name,
      u.email as user_email,
      u.phone as user_phone,
      p.title as property_title,
      c.name as city_name,
      v.name as vendor_name
    FROM bookings b
    INNER JOIN users u ON b.user_id = u.id
    INNER JOIN properties p ON b.property_id = p.id
    INNER JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE b.deleted_at IS NULL
  `;

  const params = [];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  if (payment_status) {
    query += ` AND b.payment_status = ?`;
    params.push(payment_status);
  }

  if (property_id) {
    query += ` AND b.property_id = ?`;
    params.push(property_id);
  }

  if (user_id) {
    query += ` AND b.user_id = ?`;
    params.push(user_id);
  }

  if (from_date) {
    query += ` AND b.check_in >= ?`;
    params.push(from_date);
  }

  if (to_date) {
    query += ` AND b.check_out <= ?`;
    params.push(to_date);
  }

  if (search) {
    query += ` AND (b.id LIKE ? OR u.full_name LIKE ? OR u.email LIKE ? OR p.title LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Count total
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    "SELECT COUNT(*) as total FROM",
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [bookings] = await db.query(query, params);

  sendSuccess(
    res,
    {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Bookings fetched successfully",
    200,
  );
});

// Get booking statistics
export const getBookingStats = asyncHandler(async (req, res) => {
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings,
      SUM(CASE WHEN status = 'cancel_requested' THEN 1 ELSE 0 END) as cancel_requested,
      SUM(CASE WHEN status = 'confirmed' OR status = 'completed' THEN total_amount ELSE 0 END) as total_revenue
    FROM bookings
    WHERE deleted_at IS NULL
  `);

  sendSuccess(res, stats[0], "Booking statistics fetched successfully", 200);
});

// Process refund
export const processRefund = asyncHandler(async (req, res) => {
  const { booking_id, refund_percentage } = req.body;
  const adminId = req.user.id;

  if (!booking_id || !refund_percentage) {
    return sendError(res, "Booking ID and refund percentage are required", 400);
  }

  if (refund_percentage < 0 || refund_percentage > 100) {
    return sendError(res, "Refund percentage must be between 0 and 100", 400);
  }

  // Get booking details
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL",
    [booking_id],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Check if booking can be refunded
  if (booking.status !== "cancel_requested" && booking.status !== "confirmed") {
    return sendError(
      res,
      "Only cancel-requested or confirmed bookings can be refunded",
      400,
    );
  }

  // Get payment details
  const [payments] = await db.query(
    'SELECT * FROM payments WHERE booking_id = ? AND status = "success" ORDER BY created_at DESC LIMIT 1',
    [booking_id],
  );

  if (payments.length === 0) {
    return sendError(res, "No successful payment found for this booking", 404);
  }

  const payment = payments[0];

  // Calculate refund amount
  const refundAmount = (booking.total_amount * refund_percentage) / 100;

  // Create refund record
  const refundId = generateUUID();
  await db.query(
    "INSERT INTO refunds (id, booking_id, payment_id, refund_percentage, refund_amount, status) VALUES (?, ?, ?, ?, ?, ?)",
    [
      refundId,
      booking_id,
      payment.id,
      refund_percentage,
      refundAmount,
      "initiated",
    ],
  );

  // Update booking status
  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [
    booking_id,
  ]);

  // Initiate actual refund with Cashfree
  try {
    // Get Cashfree payment ID from gateway_payment_id
    const cashfreePaymentId = payment.gateway_payment_id;
    const cashfreeOrderId = payment.gateway_order_id || booking_id;

    if (!cashfreePaymentId) {
      throw new Error("Cashfree payment ID not found");
    }

    // Create refund in Cashfree
    const cashfreeRefund = await cashfreeService.processRefund({
      orderId: cashfreeOrderId,
      refundId: refundId,
      refundAmount: parseFloat(refundAmount).toFixed(2),
      refundNote: `Refund ${refund_percentage}% for booking ${booking_id}`,
    });

    if (!cashfreeRefund.success) {
      throw new Error("Cashfree refund API call failed");
    }

    // Update refund record with Cashfree refund ID and mark as completed
    await db.query(
      'UPDATE refunds SET status = "completed", gateway_refund_id = ? WHERE id = ?',
      [cashfreeRefund.refund.cf_refund_id, refundId],
    );

    console.log(
      `✅ Refund processed successfully: ${cashfreeRefund.refund.cf_refund_id}`,
    );
  } catch (error) {
    console.error("❌ Cashfree refund failed:", error);

    // Mark refund as failed but don't stop the process
    // Admin can manually process refund later
    await db.query('UPDATE refunds SET status = "failed" WHERE id = ?', [
      refundId,
    ]);

    // Log the error for admin review
    await db.query(
      "INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        generateUUID(),
        req.user.id,
        "admin",
        `Refund failed: ${error.message}`,
        "refund",
        refundId,
      ],
    );
  }

  // Create credit note
  await db.query(
    "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      generateUUID(),
      booking_id,
      booking.user_id,
      -booking.base_amount,
      -booking.gst_amount,
      -refundAmount,
      "credit_note",
    ],
  );

  // Send emails
  try {
    await sendCancellationEmail(booking_id);
    await sendRefundEmail(booking_id, refundAmount);
  } catch (error) {
    console.error("Failed to send emails:", error);
  }

  // Create notification
  await db.query(
    "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
    [
      generateUUID(),
      booking.user_id,
      "user",
      "Refund Processed",
      `Your refund of ₹${refundAmount.toFixed(2)} has been initiated`,
    ],
  );

  // Log activity
  await db.query(
    "INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)",
    [
      generateUUID(),
      adminId,
      "admin",
      "Processed refund",
      "booking",
      booking_id,
    ],
  );

  sendSuccess(
    res,
    { refund_id: refundId, refund_amount: refundAmount },
    "Refund processed successfully",
    200,
  );
});

// Get vendor settlements
export const getVendorSettlements = asyncHandler(async (req, res) => {
  const { vendor_id, status, page = 1, limit = 20 } = req.query;

  let query = `
    SELECT 
      vs.*,
      v.name as vendor_name,
      v.email as vendor_email,
      v.phone as vendor_phone,
      v.bank_details,
      v.is_gst_registered as vendor_gst_status,
      v.gst_number as vendor_gst_number,
      b.id as booking_id,
      b.total_amount as booking_total,
      p.title as property_title
    FROM vendor_settlements vs
    INNER JOIN vendors v ON vs.vendor_id = v.id
    INNER JOIN bookings b ON vs.booking_id = b.id
    INNER JOIN properties p ON b.property_id = p.id
    WHERE 1=1
  `;

  const params = [];

  if (vendor_id) {
    query += ` AND vs.vendor_id = ?`;
    params.push(vendor_id);
  }

  if (status) {
    query += ` AND vs.status = ?`;
    params.push(status);
  }

  // Search filter
  if (req.query.search) {
    query += ` AND (v.name LIKE ? OR v.email LIKE ?)`;
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  // Count total
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    "SELECT COUNT(*) as total FROM",
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY vs.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [settlements] = await db.query(query, params);

  // Parse bank_details JSON and extract bank_name and account_number
  const processedSettlements = settlements.map((settlement) => {
    let bankDetails = null;
    try {
      bankDetails = settlement.bank_details
        ? JSON.parse(settlement.bank_details)
        : null;
    } catch (e) {
      console.error("Error parsing bank_details JSON:", e);
    }

    return {
      ...settlement,
      bank_name: bankDetails?.bank_name || null,
      account_number: bankDetails?.account_number || null,
      ifsc: bankDetails?.ifsc || null,
    };
  });

  sendSuccess(
    res,
    {
      settlements: processedSettlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Vendor settlements fetched successfully",
    200,
  );
});

// Mark vendor settlement as paid
export const markSettlementPaid = asyncHandler(async (req, res) => {
  const { settlement_id, payment_proof } = req.body;
  const adminId = req.user.id;

  if (!settlement_id) {
    return sendError(res, "Settlement ID is required", 400);
  }

  // Get settlement
  const [settlements] = await db.query(
    "SELECT * FROM vendor_settlements WHERE id = ?",
    [settlement_id],
  );

  if (settlements.length === 0) {
    return sendError(res, "Settlement not found", 404);
  }

  const settlement = settlements[0];

  if (settlement.status === "paid") {
    return sendError(res, "Settlement already marked as paid", 400);
  }

  // Update settlement
  await db.query(
    'UPDATE vendor_settlements SET status = "paid", payment_proof = ? WHERE id = ?',
    [payment_proof || null, settlement_id],
  );

  // Create notification for vendor (best-effort: vendors table is separate from users)
  try {
    await db.query(
      "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
      [
        generateUUID(),
        settlement.vendor_id,
        "vendor",
        "Settlement Paid",
        `Your settlement of ₹${settlement.amount} has been paid`,
      ],
    );
  } catch (_notifErr) {
    // Notification is non-critical; proceed even if FK constraint fails
  }

  // Log activity
  await db.query(
    "INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)",
    [
      generateUUID(),
      adminId,
      "admin",
      "Marked settlement as paid",
      "vendor_settlement",
      settlement_id,
    ],
  );

  sendSuccess(res, null, "Settlement marked as paid successfully", 200);
});

// Get dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  // Total revenue
  const [revenue] = await db.query(`
    SELECT COALESCE(SUM(total_amount), 0) as total_revenue
    FROM bookings
    WHERE status IN ('confirmed', 'completed')
    AND deleted_at IS NULL
  `);

  // Booking counts
  const [bookingCounts] = await db.query(`
    SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN status = 'cancel_requested' THEN 1 ELSE 0 END) as pending_cancellations
    FROM bookings
    WHERE deleted_at IS NULL
  `);

  // Property counts
  const [propertyCounts] = await db.query(`
    SELECT 
      COUNT(*) as total_properties,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_properties,
      SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_properties
    FROM properties
    WHERE deleted_at IS NULL
  `);

  // User count
  const [userCount] = await db.query(`
    SELECT COUNT(*) as total_users
    FROM users
    WHERE deleted_at IS NULL
  `);

  // Pending settlements
  const [settlementStats] = await db.query(`
    SELECT 
      COUNT(*) as pending_settlements,
      COALESCE(SUM(amount), 0) as pending_amount
    FROM vendor_settlements
    WHERE status = 'pending'
  `);

  sendSuccess(
    res,
    {
      revenue: revenue[0].total_revenue,
      ...bookingCounts[0],
      ...propertyCounts[0],
      ...userCount[0],
      ...settlementStats[0],
    },
    "Dashboard statistics fetched successfully",
    200,
  );
});

// ============ PROPERTIES MANAGEMENT ============

// Get all properties with filters
export const getAllProperties = asyncHandler(async (req, res) => {
  console.log("📥 getAllProperties called with query:", req.query);

  try {
    const {
      status,
      city_id,
      vendor_id,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    console.log("🔍 Building query with filters:", {
      status,
      city_id,
      vendor_id,
      search,
      page,
      limit,
    });

    // Build WHERE conditions for both queries
    let whereConditions = "WHERE p.deleted_at IS NULL";
    const params = [];
    const countParams = [];

    if (status) {
      whereConditions += ` AND p.status = ?`;
      params.push(status);
      countParams.push(status);
    }

    if (city_id) {
      whereConditions += ` AND p.city_id = ?`;
      params.push(city_id);
      countParams.push(city_id);
    }

    if (vendor_id) {
      whereConditions += ` AND p.vendor_id = ?`;
      params.push(vendor_id);
      countParams.push(vendor_id);
    }

    if (search) {
      whereConditions += ` AND (p.title LIKE ? OR p.description LIKE ? OR v.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Count query - simple and clean
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM properties p
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      ${whereConditions}
    `;

    console.log("🔢 Executing count query...");
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult && countResult[0] ? countResult[0].total : 0;
    console.log("✅ Count query successful, total:", total);

    // Main query with ALL fields - comprehensive property data fetch
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.address,
        p.area,
        p.state,
        p.pincode,
        p.bedrooms,
        p.bathrooms,
        p.max_guests,
        p.status,
        p.rating,
        p.reviews_count,
        p.created_at,
        p.same_day_booking_allowed,
        p.max_booking_days,
        p.check_in_time,
        p.check_out_time,
        p.min_stay_days,
        p.max_stay_days,
        p.housekeeping_frequency,
        p.laundry_frequency,
        p.utilities_included,
        p.parking_slots,
        p.floor_number,
        p.wifi_speed_mbps,
        p.wifi_provider,
        p.furnishing_type,
        p.is_recommended,
        p.recommended_priority,
        p.recommended_at,
        p.recommended_by,
        p.maps_location,
        p.photos,
        CASE 
          WHEN p.photos IS NOT NULL AND p.photos != '[]' AND p.photos != '' 
          THEN JSON_UNQUOTE(JSON_EXTRACT(p.photos, '$[0]'))
          ELSE NULL 
        END as thumbnail,
        CASE 
          WHEN p.photos IS NOT NULL AND p.photos != '[]' AND p.photos != ''
          THEN JSON_LENGTH(p.photos)
          ELSE 0
        END as image_count,
        c.id as city_id,
        c.name as city_name,
        c.state as city_state,
        v.id as vendor_id,
        v.name as vendor_name,
        v.email as vendor_email,
        v.phone as vendor_phone,
        pt.id as property_type_id,
        pt.name as property_type_name,
        pt.slug as property_type_slug,
        pt.stay_type as property_stay_type,
        pt.icon as property_type_icon,
        pr.price_per_night,
        pr.original_price,
        pr.gst_percentage,
        pr.min_guests,
        pr.extra_guest_charge,
        pr.min_children,
        pr.max_children,
        pr.extra_child_charge,
        pr.weekly_discount_percent,
        pr.monthly_discount_percent,
        pr.quarterly_discount_percent,
        pr.long_term_discount_percent,
        pr.allow_corporate_booking,
        pr.corporate_discount_percent,
        pr.maintenance_charges,
        pr.discount_3_5_days,
        pr.discount_6_14_days,
        pr.discount_15_plus_days
      FROM properties p
      LEFT JOIN cities c ON p.city_id = c.id
      LEFT JOIN vendors v ON p.vendor_id = v.id
      LEFT JOIN property_types pt ON p.property_type_id = pt.id
      LEFT JOIN property_pricing pr ON p.id = pr.property_id
      ${whereConditions}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), offset);

    console.log("📊 Executing main query...");
    const [properties] = await db.query(query, params);
    console.log(
      `✅ Main query successful, found ${properties?.length || 0} properties`,
    );

    // Parse photos JSON to images array for each property
    if (properties && properties.length > 0) {
      properties.forEach((property) => {
        if (property.photos) {
          try {
            const photosArray = JSON.parse(property.photos);
            property.images = Array.isArray(photosArray)
              ? photosArray.map((url, index) => ({
                  id: `img-${property.id}-${index}`,
                  image_url: url,
                  sort_order: index,
                }))
              : [];
          } catch (error) {
            console.error(
              `Error parsing photos for property ${property.id}:`,
              error,
            );
            property.images = [];
          }
        } else {
          property.images = [];
        }
      });
    }

    // Fetch amenities for all properties in one query
    if (properties && properties.length > 0) {
      const propertyIds = properties.map((p) => p.id);
      const placeholders = propertyIds.map(() => "?").join(",");

      const [amenitiesData] = await db.query(
        `SELECT 
          pa.property_id,
          a.id as amenity_id,
          a.name as amenity_name,
          a.icon as amenity_icon,
          a.category as amenity_category
        FROM property_amenities pa
        JOIN amenities a ON pa.amenity_id = a.id
        WHERE pa.property_id IN (${placeholders})
        ORDER BY a.category, a.name`,
        propertyIds,
      );

      // Group amenities by property_id
      const amenitiesByProperty = {};
      amenitiesData.forEach((amenity) => {
        if (!amenitiesByProperty[amenity.property_id]) {
          amenitiesByProperty[amenity.property_id] = [];
        }
        amenitiesByProperty[amenity.property_id].push({
          id: amenity.amenity_id,
          name: amenity.amenity_name,
          icon: amenity.amenity_icon,
          category: amenity.amenity_category,
        });
      });

      // Attach amenities to each property
      properties.forEach((property) => {
        property.amenities = amenitiesByProperty[property.id] || [];
      });
    }

    sendSuccess(
      res,
      {
        properties: properties || [],
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          total_pages: Math.ceil(total / parseInt(limit)) || 0,
        },
      },
      "Properties fetched successfully",
      200,
    );
  } catch (error) {
    console.error("❌ Error in getAllProperties:", error);
    console.error("   Error message:", error.message);
    console.error("   Error code:", error.code);
    console.error("   Error SQL:", error.sql);
    sendError(res, "Failed to fetch properties: " + error.message, 500);
  }
});

// Get property details for admin
export const getPropertyDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [properties] = await db.query(
    `
    SELECT 
      p.*,
      c.id as city_id,
      c.name as city_name,
      c.state as city_state,
      v.id as vendor_id,
      v.name as vendor_name,
      v.email as vendor_email,
      v.phone as vendor_phone,
      v.gst_number as vendor_gst,
      pt.id as property_type_id,
      pt.name as property_type_name,
      pt.slug as property_type_slug,
      pt.stay_type as property_stay_type,
      pt.icon as property_type_icon,
      pt.description as property_type_description
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `,
    [id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const property = properties[0];

  // Parse JSON fields (handles double-encoded legacy data)
  if (property.house_rules) {
    try {
      let parsed = JSON.parse(property.house_rules);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      property.house_rules = parsed;
    } catch (e) {
      property.house_rules = {};
    }
  }
  if (property.cancellation_policy) {
    try {
      let parsed = JSON.parse(property.cancellation_policy);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      property.cancellation_policy = parsed;
    } catch (e) {
      property.cancellation_policy = {};
    }
  }

  // Parse photos JSON to images array
  if (property.photos) {
    try {
      const photosArray = JSON.parse(property.photos);
      property.images = Array.isArray(photosArray)
        ? photosArray.map((url, index) => ({
            id: `img-${property.id}-${index}`,
            image_url: url,
            sort_order: index,
          }))
        : [];
    } catch (error) {
      console.error(`Error parsing photos for property ${property.id}:`, error);
      property.images = [];
    }
  } else {
    property.images = [];
  }

  // Get pricing details
  const [pricingData] = await db.query(
    `SELECT * FROM property_pricing WHERE property_id = ?`,
    [id],
  );

  // Get amenities
  const [amenitiesData] = await db.query(
    `SELECT 
      a.id,
      a.name,
      a.icon,
      a.category,
      a.description
    FROM property_amenities pa
    JOIN amenities a ON pa.amenity_id = a.id
    WHERE pa.property_id = ?
    ORDER BY a.category, a.name`,
    [id],
  );

  // Get property contacts
  const [contactsData] = await db.query(
    `SELECT 
      pc.id,
      pc.contact_type_id,
      pc.name,
      pc.phone,
      pc.email,
      pc.whatsapp,
      pc.alt_contact,
      pc.is_active,
      ct.name as contact_type_name
    FROM property_contacts pc
    LEFT JOIN contact_types ct ON pc.contact_type_id = ct.id
    WHERE pc.property_id = ? AND pc.is_active = 1
    ORDER BY ct.display_order, pc.id`,
    [id],
  );

  // Get blackout dates
  const [blackoutDates] = await db.query(
    `SELECT id, start_date, end_date, reason, created_by, created_at 
     FROM property_blackout_dates 
     WHERE property_id = ? 
     ORDER BY start_date DESC`,
    [id],
  );

  // Get bookings count
  const [bookingStats] = await db.query(
    `SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_revenue
    FROM bookings 
    WHERE property_id = ?`,
    [id],
  );

  // Get guidelines from property_guidelines table (fallback for properties created before guidelines were added to properties table)
  const [guidelinesData] = await db.query(
    `SELECT safety_information, local_area_info, emergency_contacts
     FROM property_guidelines WHERE property_id = ? LIMIT 1`,
    [id],
  );
  const guidelinesFallback =
    guidelinesData && guidelinesData.length > 0 ? guidelinesData[0] : {};

  const propertyDetails = {
    ...property,
    // Merge guidelines: prefer properties columns, fall back to property_guidelines table
    safety_information:
      property.safety_information ||
      guidelinesFallback.safety_information ||
      "",
    local_area_info:
      property.local_area_info || guidelinesFallback.local_area_info || "",
    emergency_contacts:
      property.emergency_contacts ||
      guidelinesFallback.emergency_contacts ||
      "",
    pricing: pricingData && pricingData.length > 0 ? pricingData[0] : null,
    amenities: amenitiesData || [],
    contacts: contactsData || [],
    blackout_dates: blackoutDates,
    booking_stats: bookingStats[0],
  };

  sendSuccess(
    res,
    propertyDetails,
    "Property details fetched successfully",
    200,
  );
});

// Update property status (approve/reject/inactive)
export const updatePropertyStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  // Validate status
  const validStatuses = ["pending_approval", "approved", "inactive", "draft"];
  if (!validStatuses.includes(status)) {
    return sendError(res, "Invalid status", 400);
  }

  // Check if property exists
  const [property] = await db.query(
    `SELECT id, status, vendor_id FROM properties WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  if (property.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  // Update property status
  await db.query(`UPDATE properties SET status = ? WHERE id = ?`, [status, id]);

  // Log activity
  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id, created_at)
     VALUES (UUID(), ?, 'admin', ?, 'property', ?, NOW())`,
    [req.user.id, `Property status changed to ${status}`, id],
  );

  // Send notification (best-effort — don't block on FK mismatch between vendors/users tables)
  try {
    if (status === "inactive" && rejection_reason) {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
         VALUES (UUID(), ?, 'vendor', ?, ?, NOW())`,
        [
          property[0].vendor_id,
          "Property Status Updated",
          `Your property has been marked as inactive. Reason: ${rejection_reason}`,
        ],
      );
    } else if (status === "approved") {
      await db.query(
        `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
         VALUES (UUID(), ?, 'vendor', ?, ?, NOW())`,
        [
          property[0].vendor_id,
          "Property Approved",
          "Your property has been approved and is now live on the platform!",
        ],
      );
    }
  } catch (notifError) {
    console.error(
      "Failed to send property status notification:",
      notifError.message,
    );
  }

  // Send email to vendor (fire-and-forget)
  if (status === "approved") {
    notifyVendor(property[0].vendor_id, {
      subject: `Property Approved: ${property[0].title}`,
      title: "Property Approved",
      message: `Great news! Your property "${property[0].title}" has been approved and is now live on Zevio.`,
      alertType: "success",
      details: [
        ["Property", property[0].title],
        ["Status", "Approved & Live"],
      ],
    }).catch(() => {});
  } else if (status === "inactive" && rejection_reason) {
    notifyVendor(property[0].vendor_id, {
      subject: `Property Marked Inactive: ${property[0].title}`,
      title: "Property Status Updated",
      message: `Your property "${property[0].title}" has been marked as inactive.`,
      alertType: "danger",
      details: [
        ["Property", property[0].title],
        ["Status", "Inactive"],
        ["Reason", rejection_reason],
      ],
    }).catch(() => {});
  }

  sendSuccess(res, null, `Property status updated to ${status}`, 200);
});

// Get property statistics
export const getPropertyStats = asyncHandler(async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM properties
      WHERE deleted_at IS NULL
    `);

    // Ensure we have valid data
    const statsData =
      stats && stats[0]
        ? stats[0]
        : {
            total_properties: 0,
            pending_approval: 0,
            approved: 0,
            inactive: 0,
            draft: 0,
          };

    sendSuccess(
      res,
      statsData,
      "Property statistics fetched successfully",
      200,
    );
  } catch (error) {
    console.error("❌ Error in getPropertyStats:", error);
    sendError(
      res,
      "Failed to fetch property statistics: " + error.message,
      500,
    );
  }
});

// ================== USER MANAGEMENT ==================

// Get all users (customers and vendors) with filters and pagination
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role = "",
    status = "",
    search = "",
    page = 1,
    limit = 1000,
  } = req.query;

  const offset = (page - 1) * limit;
  let conditions = [];
  let params = [];

  // Build WHERE conditions for both UNION queries
  let whereConditions = [];

  // Status filter (active/blocked)
  if (status && status !== "all") {
    if (status === "active") {
      whereConditions.push("status = 'active'");
    } else if (status === "blocked") {
      whereConditions.push("status = 'blocked'");
    }
  }

  // Add deleted_at check
  whereConditions.push("deleted_at IS NULL");

  const baseWhere =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Build unified query with UNION
  let unionQuery = `
    (
      SELECT 
        u.id,
        u.full_name as name,
        u.email,
        u.phone,
        'customer' as role,
        u.status,
        u.created_at,
        (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as total_bookings,
        (SELECT COUNT(*) FROM bookings WHERE user_id = u.id AND status = 'completed') as completed_bookings,
        (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE user_id = u.id AND status = 'completed') as total_spent
      FROM users u
      ${baseWhere}
    )
    UNION ALL
    (
      SELECT 
        v.id,
        v.name,
        v.email,
        v.phone,
        'vendor' as role,
        v.status,
        v.created_at,
        0 as total_bookings,
        0 as completed_bookings,
        0 as total_spent
      FROM vendors v
      ${baseWhere}
    )
  `;

  // Role filter (customer/vendor)
  if (role && role !== "all") {
    if (role === "customer") {
      // Only get from users table
      unionQuery = `
        SELECT 
          u.id,
          u.full_name as name,
          u.email,
          u.phone,
          'customer' as role,
          u.status,
          u.created_at,
          (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as total_bookings,
          (SELECT COUNT(*) FROM bookings WHERE user_id = u.id AND status = 'completed') as completed_bookings,
          (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE user_id = u.id AND status = 'completed') as total_spent
        FROM users u
        ${baseWhere}
      `;
    } else if (role === "vendor") {
      // Only get from vendors table
      unionQuery = `
        SELECT 
          v.id,
          v.name,
          v.email,
          v.phone,
          'vendor' as role,
          v.status,
          v.created_at,
          0 as total_bookings,
          0 as completed_bookings,
          0 as total_spent
        FROM vendors v
        ${baseWhere}
      `;
    }
  }

  // Wrap with search filter if needed
  let finalQuery = unionQuery;
  let searchParams = [];

  if (search.trim()) {
    finalQuery = `
      SELECT * FROM (
        ${unionQuery}
      ) as combined
      WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
    `;
    const searchParam = `%${search}%`;
    searchParams = [searchParam, searchParam, searchParam];
  }

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM (${finalQuery}) as count_query`;
  const [countResult] = await db.query(countQuery, searchParams);

  // Get paginated results
  finalQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const [users] = await db.query(finalQuery, [
    ...searchParams,
    parseInt(limit),
    parseInt(offset),
  ]);

  const response = {
    users,
    pagination: {
      current_page: parseInt(page),
      total_pages: Math.ceil(countResult[0].total / limit),
      total_users: countResult[0].total,
      per_page: parseInt(limit),
    },
  };

  sendSuccess(res, response, "Users fetched successfully", 200);
});

// Get user details with booking history
export const getUserDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let user = null;
  let role = null;

  // Try to find user in users table (customers)
  const [customers] = await db.query(
    `SELECT 
      u.id,
      u.full_name as name,
      u.email,
      u.phone,
      u.status,
      u.created_at,
      u.address,
      u.bio,
      u.bank_details,
      u.is_corporate_user,
      u.company_name,
      u.company_gst,
      u.profile_completed,
      'customer' as role
    FROM users u
    WHERE u.id = ? AND u.deleted_at IS NULL`,
    [id],
  );

  if (customers.length > 0) {
    user = customers[0];
    // Parse bank_details JSON
    if (user.bank_details) {
      try {
        user.bank_details =
          typeof user.bank_details === "string"
            ? JSON.parse(user.bank_details)
            : user.bank_details;
      } catch (_) {
        user.bank_details = null;
      }
    }
    role = "customer";
  } else {
    // If not found in users, try vendors table
    const [vendors] = await db.query(
      `SELECT 
        v.id,
        v.name,
        v.email,
        v.phone,
        v.status,
        v.created_at,
        v.gst_number,
        v.is_gst_registered,
        v.pan_number,
        v.company_name,
        v.address,
        v.city,
        v.state,
        v.pincode,
        v.bank_details,
        v.profile_completed,
        'vendor' as role
      FROM vendors v
      WHERE v.id = ? AND v.deleted_at IS NULL`,
      [id],
    );

    if (vendors.length > 0) {
      const vendor = vendors[0];
      // Parse bank_details JSON
      if (vendor.bank_details) {
        try {
          vendor.bank_details =
            typeof vendor.bank_details === "string"
              ? JSON.parse(vendor.bank_details)
              : vendor.bank_details;
        } catch (_) {
          vendor.bank_details = null;
        }
      }
      user = vendor;
      role = "vendor";
    }
  }

  // If user not found in either table
  if (!user) {
    return sendError(res, "User not found", 404);
  }

  let bookings = [];
  let stats = {
    total_bookings: 0,
    confirmed_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    total_spent: 0,
  };

  // Only get bookings for customers (not vendors)
  if (role === "customer") {
    // Get booking history
    const [bookingResults] = await db.query(
      `SELECT 
        b.id,
        b.check_in,
        b.check_out,
        b.total_amount,
        b.status,
        b.created_at,
        p.title as property_title,
        CASE 
          WHEN p.photos IS NOT NULL AND p.photos != '[]' AND p.photos != '' 
          THEN JSON_UNQUOTE(JSON_EXTRACT(p.photos, '$[0]'))
          ELSE NULL 
        END as thumbnail,
        c.name as city_name
      FROM bookings b
      JOIN properties p ON b.property_id = p.id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
      LIMIT 10`,
      [id],
    );
    bookings = bookingResults;

    // Get activity statistics
    const [statsResults] = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
        SUM(CASE WHEN status IN ('cancelled', 'cancel_requested') THEN 1 ELSE 0 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent
      FROM bookings
      WHERE user_id = ?`,
      [id],
    );
    stats = statsResults[0];
  } else if (role === "vendor") {
    // For vendors, get their properties count
    const [propertyStats] = await db.query(
      `SELECT 
        COUNT(*) as total_properties,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_properties
      FROM properties
      WHERE vendor_id = ? AND deleted_at IS NULL`,
      [id],
    );
    stats = {
      total_properties: propertyStats[0].total_properties || 0,
      active_properties: propertyStats[0].active_properties || 0,
      total_bookings: 0,
      confirmed_bookings: 0,
      completed_bookings: 0,
      cancelled_bookings: 0,
      total_spent: 0,
    };
  }

  sendSuccess(
    res,
    {
      user,
      bookings,
      stats,
    },
    "User details fetched successfully",
    200,
  );
});

// Update user status (block/unblock)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  // Validate status
  if (!["active", "blocked"].includes(status)) {
    return sendError(res, "Invalid status. Must be 'active' or 'blocked'", 400);
  }

  // Check if user exists in users table first, then vendors
  let userRecord = null;
  let userTable = null;

  const [customerResult] = await db.query(
    "SELECT id, full_name as name, email, status FROM users WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (customerResult.length > 0) {
    userRecord = customerResult[0];
    userTable = "users";
  } else {
    const [vendorResult] = await db.query(
      "SELECT id, name, email, status FROM vendors WHERE id = ? AND deleted_at IS NULL",
      [id],
    );
    if (vendorResult.length > 0) {
      userRecord = vendorResult[0];
      userTable = "vendors";
    }
  }

  if (!userRecord) {
    return sendError(res, "User not found", 404);
  }

  // Prevent self-blocking
  if (req.user.id === id && status === "blocked") {
    return sendError(res, "You cannot block yourself", 400);
  }

  // Update user status
  await db.query(
    `UPDATE ${userTable} SET status = ?, updated_at = NOW() WHERE id = ?`,
    [status, id],
  );

  const recipientRole = userTable === "vendors" ? "vendor" : "customer";

  // Create activity log
  const action =
    status === "blocked"
      ? `Blocked ${recipientRole}: ${userRecord.name} (${userRecord.email})${
          reason ? `. Reason: ${reason}` : ""
        }`
      : `Unblocked ${recipientRole}: ${userRecord.name} (${userRecord.email})`;

  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity_type, entity_id, created_at)
     VALUES (UUID(), ?, ?, ?, 'user', ?, NOW())`,
    [req.user.id, req.user.role, action, id],
  );

  // Send notification to user
  if (status === "blocked") {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, ?, ?, ?, NOW())`,
      [
        id,
        recipientRole,
        "Account Blocked",
        reason
          ? `Your account has been blocked. Reason: ${reason}`
          : "Your account has been blocked. Please contact support for more information.",
      ],
    );
  } else if (status === "active") {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, ?, ?, ?, NOW())`,
      [
        id,
        recipientRole,
        "Account Activated",
        "Your account has been reactivated. You can now access the platform.",
      ],
    );
  }

  sendSuccess(res, null, `User status updated to ${status}`, 200);
});

// Create new user (customer or vendor)
export const createUser = asyncHandler(async (req, res) => {
  const { full_name, email, phone, role = "customer" } = req.body;

  // Validate role
  if (!["customer", "vendor"].includes(role)) {
    return sendError(res, "Invalid role. Must be 'customer' or 'vendor'", 400);
  }

  // Validate required fields
  if (!full_name || !email) {
    return sendError(res, "Full name and email are required", 400);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, "Invalid email format", 400);
  }

  // Check for duplicate email across all tables (users, vendors, admins)
  const [existingUsers] = await db.query(
    "SELECT email FROM users WHERE email = ? AND deleted_at IS NULL",
    [email],
  );
  const [existingVendors] = await db.query(
    "SELECT email FROM vendors WHERE email = ? AND deleted_at IS NULL",
    [email],
  );
  const [existingAdmins] = await db.query(
    "SELECT email FROM admins WHERE email = ? AND deleted_at IS NULL",
    [email],
  );

  if (
    existingUsers.length > 0 ||
    existingVendors.length > 0 ||
    existingAdmins.length > 0
  ) {
    return sendError(
      res,
      "This email is already registered. Please use a different email.",
      409,
    );
  }

  try {
    // Generate secure temporary password
    const tempPassword = generateSecurePassword(8);
    const hashedPassword = await hashPassword(tempPassword);

    // Generate UUID for new user
    const userId = generateUUID();

    // Insert into appropriate table based on role
    if (role === "vendor") {
      // Create vendor account
      await db.query(
        `INSERT INTO vendors (
          id, name, email, phone, password_hash, 
          is_temporary_password, password_change_required, 
          created_by, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, 'active', NOW())`,
        [userId, full_name, email, phone || null, hashedPassword, req.user.id],
      );
    } else {
      // Create customer account
      await db.query(
        `INSERT INTO users (
          id, full_name, email, phone, password_hash, 
          is_temporary_password, password_change_required, 
          created_by, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, 1, ?, 'active', NOW())`,
        [userId, full_name, email, phone || null, hashedPassword, req.user.id],
      );
    }

    // Create activity log
    const action = `Created new ${role} account: ${full_name} (${email})`;
    await db.query(
      `INSERT INTO activity_logs (
        id, actor_id, actor_role, action, entity, entity_id, created_at
      ) VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [req.user.id, req.user.role, action, role, userId],
    );

    // Send welcome email with temporary password
    try {
      await sendWelcomeEmail(email, full_name, tempPassword, role);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail the user creation if email fails
      // Account is already created, just log the error
    }

    sendSuccess(
      res,
      {
        id: userId,
        email,
        full_name,
        role,
        tempPassword, // Include in response for admin to see/copy
      },
      `${role === "vendor" ? "Vendor" : "Customer"} account created successfully. Welcome email sent with temporary password.`,
      201,
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return sendError(
      res,
      "Failed to create user account. Please try again.",
      500,
    );
  }
});

// Reset user password — generate a new temporary password and email it to the user
export const resetUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Look up in users table first, then vendors
  const [userRows] = await db.query(
    "SELECT id, full_name, email, status FROM users WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
  const [vendorRows] = await db.query(
    "SELECT id, name AS full_name, email, status FROM vendors WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  const user = userRows[0] || vendorRows[0];
  const isVendor = !userRows[0] && !!vendorRows[0];

  if (!user) {
    return sendError(res, "User not found", 404);
  }

  const role = isVendor ? "vendor" : "customer";
  const tableName = isVendor ? "vendors" : "users";

  // Generate a fresh temporary password
  const tempPassword = generateSecurePassword(8);
  const hashedPassword = await hashPassword(tempPassword);

  await db.query(
    `UPDATE ${tableName}
     SET password_hash = ?,
         is_temporary_password = 1,
         password_change_required = 1,
         last_password_change = NOW()
     WHERE id = ?`,
    [hashedPassword, id],
  );

  // Log the action
  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id, created_at)
     VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
    [
      req.user.id,
      req.user.role,
      `Reset password for ${role}: ${user.full_name} (${user.email})`,
      role,
      id,
    ],
  );

  // Send the reset email (don't fail the request if email bounces)
  try {
    await sendPasswordResetEmail(
      user.email,
      user.full_name,
      tempPassword,
      role,
    );
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
  }

  sendSuccess(
    res,
    { id, email: user.email, full_name: user.full_name, role },
    "Password reset successfully. A new temporary password has been sent to the user's email.",
  );
});

// Get user statistics
export const getUserStats = asyncHandler(async (req, res) => {
  const [userStats] = await db.query(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_users
    FROM users
    WHERE deleted_at IS NULL
  `);

  const [vendorStats] = await db.query(`
    SELECT 
      COUNT(*) as total_vendors,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_vendors,
      SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked_vendors
    FROM vendors
    WHERE deleted_at IS NULL
  `);

  const stats = {
    total_users:
      (parseInt(userStats[0].total_users) || 0) +
      (parseInt(vendorStats[0].total_vendors) || 0),
    customers: parseInt(userStats[0].total_users) || 0,
    vendors: parseInt(vendorStats[0].total_vendors) || 0,
    active_users:
      (parseInt(userStats[0].active_users) || 0) +
      (parseInt(vendorStats[0].active_vendors) || 0),
    blocked_users:
      (parseInt(userStats[0].blocked_users) || 0) +
      (parseInt(vendorStats[0].blocked_vendors) || 0),
  };

  sendSuccess(res, stats, "User statistics fetched successfully", 200);
});

// ================== REPORTS & ANALYTICS ==================

// Get revenue analytics with date filters
export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { start_date, end_date, period = "daily" } = req.query;

  // Default to last 30 days if no dates provided
  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get overall revenue summary
  const [summary] = await db.query(
    `
    SELECT 
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.base_amount END), 0) as base_revenue,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.gst_amount END), 0) as gst_collected,
      COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as avg_booking_value,
      COUNT(DISTINCT CASE WHEN b.status = 'cancelled' THEN b.id END) as cancelled_bookings,
      COALESCE(SUM(CASE WHEN b.status = 'cancelled' THEN r.refund_amount END), 0) as total_refunds
    FROM bookings b
    LEFT JOIN refunds r ON b.id = r.booking_id
    WHERE DATE(b.created_at) BETWEEN ? AND ?
  `,
    [startDate, endDate],
  );

  // Get revenue by period (daily/weekly/monthly)
  let dateFormat;
  if (period === "daily") {
    dateFormat = "%Y-%m-%d";
  } else if (period === "weekly") {
    dateFormat = "%Y-%u";
  } else {
    dateFormat = "%Y-%m";
  }

  const [revenueByPeriod] = await db.query(
    `
    SELECT 
      DATE_FORMAT(b.created_at, ?) as period,
      COUNT(b.id) as bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as revenue,
      COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as avg_value
    FROM bookings b
    WHERE DATE(b.created_at) BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
  `,
    [dateFormat, startDate, endDate],
  );

  // Get revenue by city
  const [revenueByCity] = await db.query(
    `
    SELECT 
      c.name as city_name,
      COUNT(b.id) as bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as revenue
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    JOIN cities c ON p.city_id = c.id
    WHERE DATE(b.created_at) BETWEEN ? AND ?
    GROUP BY c.id, c.name
    ORDER BY revenue DESC
    LIMIT 10
  `,
    [startDate, endDate],
  );

  // Get top performing properties
  const [topProperties] = await db.query(
    `
    SELECT 
      p.id,
      p.title,
      c.name as city_name,
      COUNT(b.id) as bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as revenue
    FROM properties p
    JOIN cities c ON p.city_id = c.id
    LEFT JOIN bookings b ON p.id = b.property_id AND DATE(b.created_at) BETWEEN ? AND ?
    WHERE p.deleted_at IS NULL
    GROUP BY p.id, p.title, c.name
    ORDER BY revenue DESC
    LIMIT 10
  `,
    [startDate, endDate],
  );

  sendSuccess(
    res,
    {
      summary: summary[0],
      revenue_by_period: revenueByPeriod,
      revenue_by_city: revenueByCity,
      top_properties: topProperties,
      filters: { start_date: startDate, end_date: endDate, period },
    },
    "Revenue analytics fetched successfully",
    200,
  );
});

// Get booking trends and patterns
export const getBookingTrends = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get booking status distribution
  const [statusDistribution] = await db.query(
    `
    SELECT 
      status,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
    FROM bookings
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY status
    ORDER BY count DESC
  `,
    [startDate, endDate],
  );

  // Get booking trends by day of week
  const [dayOfWeekTrends] = await db.query(
    `
    SELECT 
      DAYNAME(check_in) as day_of_week,
      DAYOFWEEK(check_in) as day_number,
      COUNT(*) as bookings,
      COALESCE(AVG(total_amount), 0) as avg_amount
    FROM bookings
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY day_of_week, day_number
    ORDER BY day_number
  `,
    [startDate, endDate],
  );

  // Get average lead time (days between booking and check-in)
  const [leadTime] = await db.query(
    `
    SELECT 
      AVG(DATEDIFF(check_in, DATE(created_at))) as avg_lead_time_days,
      MIN(DATEDIFF(check_in, DATE(created_at))) as min_lead_time,
      MAX(DATEDIFF(check_in, DATE(created_at))) as max_lead_time
    FROM bookings
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND status != 'cancelled'
  `,
    [startDate, endDate],
  );

  // Get booking duration patterns
  const [durationPatterns] = await db.query(
    `
    SELECT 
      nights,
      COUNT(*) as bookings,
      COALESCE(AVG(total_amount), 0) as avg_amount
    FROM bookings
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND status != 'cancelled'
    GROUP BY nights
    ORDER BY nights
  `,
    [startDate, endDate],
  );

  sendSuccess(
    res,
    {
      status_distribution: statusDistribution,
      day_of_week_trends: dayOfWeekTrends,
      lead_time: leadTime[0],
      duration_patterns: durationPatterns,
      filters: { start_date: startDate, end_date: endDate },
    },
    "Booking trends fetched successfully",
    200,
  );
});

// Get user activity reports
export const getUserActivityReport = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get new user registrations
  const [newUsers] = await db.query(
    `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as date,
      COUNT(*) as new_users
    FROM users
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND deleted_at IS NULL
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC
  `,
    [startDate, endDate],
  );

  // Get active users (users who made bookings)
  const [activeUsers] = await db.query(
    `
    SELECT 
      COUNT(DISTINCT user_id) as active_users,
      COUNT(*) as total_bookings,
      ROUND(COUNT(*) / COUNT(DISTINCT user_id), 2) as avg_bookings_per_user
    FROM bookings
    WHERE DATE(created_at) BETWEEN ? AND ?
  `,
    [startDate, endDate],
  );

  // Get top customers by bookings
  const [topCustomers] = await db.query(
    `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_spent,
      MAX(b.created_at) as last_booking_date
    FROM users u
    JOIN bookings b ON u.id = b.user_id
    WHERE DATE(b.created_at) BETWEEN ? AND ?
    AND u.deleted_at IS NULL
    GROUP BY u.id, u.full_name, u.email
    ORDER BY total_spent DESC
    LIMIT 10
  `,
    [startDate, endDate],
  );

  // Get user type distribution (from separate tables)
  const [usersCount] = await db.query(`
    SELECT COUNT(*) as count, 'user' as user_type,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END) as blocked
    FROM users
    WHERE deleted_at IS NULL
  `);

  const [vendorsCount] = await db.query(`
    SELECT COUNT(*) as count, 'vendor' as user_type,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
    FROM vendors
    WHERE deleted_at IS NULL
  `);

  const roleDistribution = [
    {
      role: "user",
      count: usersCount[0].count,
      active: usersCount[0].active,
      blocked: usersCount[0].blocked,
    },
    {
      role: "vendor",
      count: vendorsCount[0].count,
      active: vendorsCount[0].active,
      inactive: vendorsCount[0].inactive,
    },
  ];

  sendSuccess(
    res,
    {
      new_users: newUsers,
      active_users: activeUsers[0],
      top_customers: topCustomers,
      role_distribution: roleDistribution,
      filters: { start_date: startDate, end_date: endDate },
    },
    "User activity report fetched successfully",
    200,
  );
});

// Get property performance metrics
export const getPropertyPerformance = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Get overall property stats
  const [overallStats] = await db.query(
    `
    SELECT 
      COUNT(DISTINCT p.id) as total_properties,
      COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as active_properties,
      COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN p.id END) as properties_with_bookings,
      ROUND(COUNT(DISTINCT CASE WHEN b.id IS NOT NULL THEN p.id END) * 100.0 / 
            COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END), 2) as booking_rate_percentage
    FROM properties p
    LEFT JOIN bookings b ON p.id = b.property_id 
      AND DATE(b.created_at) BETWEEN ? AND ?
    WHERE p.deleted_at IS NULL
  `,
    [startDate, endDate],
  );

  // Get property performance by occupancy
  const [propertyOccupancy] = await db.query(
    `
    SELECT 
      p.id,
      p.title,
      c.name as city_name,
      v.name as vendor_name,
      COUNT(b.id) as bookings,
      COALESCE(SUM(b.nights), 0) as nights_booked,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as revenue,
      ROUND(AVG(b.total_amount), 2) as avg_booking_value
    FROM properties p
    JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN bookings b ON p.id = b.property_id 
      AND DATE(b.created_at) BETWEEN ? AND ?
    WHERE p.deleted_at IS NULL
    AND p.status = 'approved'
    GROUP BY p.id, p.title, c.name, v.name
    ORDER BY revenue DESC
  `,
    [startDate, endDate],
  );

  // Get new property additions
  const [newProperties] = await db.query(
    `
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m-%d') as date,
      COUNT(*) as new_properties
    FROM properties
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND deleted_at IS NULL
    GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
    ORDER BY date ASC
  `,
    [startDate, endDate],
  );

  // Get property status distribution
  const [statusDistribution] = await db.query(`
    SELECT 
      status,
      COUNT(*) as count
    FROM properties
    WHERE deleted_at IS NULL
    GROUP BY status
  `);

  sendSuccess(
    res,
    {
      overall_stats: overallStats[0],
      property_occupancy: propertyOccupancy,
      new_properties: newProperties,
      status_distribution: statusDistribution,
      filters: { start_date: startDate, end_date: endDate },
    },
    "Property performance metrics fetched successfully",
    200,
  );
});

// Get vendor performance report
export const getVendorPerformance = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [vendorStats] = await db.query(
    `
    SELECT 
      v.id,
      v.name,
      v.email,
      v.phone,
      COUNT(DISTINCT p.id) as total_properties,
      COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as active_properties,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN vs.status = 'paid' THEN vs.amount END), 0) as paid_settlements,
      COALESCE(SUM(CASE WHEN vs.status = 'pending' THEN vs.amount END), 0) as pending_settlements
    FROM vendors v
    LEFT JOIN properties p ON v.id = p.vendor_id AND p.deleted_at IS NULL
    LEFT JOIN bookings b ON p.id = b.property_id AND DATE(b.created_at) BETWEEN ? AND ?
    LEFT JOIN vendor_settlements vs ON v.id = vs.vendor_id
    WHERE v.deleted_at IS NULL
    GROUP BY v.id, v.name, v.email, v.phone
    ORDER BY total_revenue DESC
  `,
    [startDate, endDate],
  );

  sendSuccess(
    res,
    {
      vendor_stats: vendorStats,
      filters: { start_date: startDate, end_date: endDate },
    },
    "Vendor performance report fetched successfully",
    200,
  );
});

// ===================================================================
// PROPERTY MANAGEMENT - SESSION 15 (Admin & Vendor Property Forms)
// SESSION 17 - ADDED CACHING FOR PERFORMANCE
// ===================================================================

// Get all cities (for dropdown) - WITH CACHING
export const getAllCities = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.cities)) {
    return sendSuccess(
      res,
      cache.cities.data,
      "Cities fetched successfully (cached)",
      200,
    );
  }

  // Cache miss - fetch from database
  const [cities] = await db.query(`
    SELECT id, name, state, status
    FROM cities
    WHERE status = 'active'
    ORDER BY name ASC
  `);

  // Update cache
  cache.cities = {
    data: cities,
    timestamp: Date.now(),
  };

  sendSuccess(res, cities, "Cities fetched successfully", 200);
});

// Create a new city (for auto-add in combobox)
export const createCity = asyncHandler(async (req, res) => {
  const { name, state } = req.body;

  // Validation
  if (!name || !state) {
    return sendError(res, "City name and state are required", 400);
  }

  // Check if city already exists (case-insensitive)
  const [existingCity] = await db.query(
    `SELECT id, name, state, status FROM cities WHERE LOWER(name) = LOWER(?) AND LOWER(state) = LOWER(?)`,
    [name.trim(), state.trim()],
  );

  if (existingCity.length > 0) {
    // Return existing city if found
    return sendSuccess(res, existingCity[0], "City already exists", 200);
  }

  // Create new city (auto-approved)
  const cityId = generateUUID();
  await db.query(
    `INSERT INTO cities (id, name, state, status) VALUES (?, ?, ?, 'active')`,
    [cityId, name.trim(), state.trim()],
  );

  // Clear cities cache
  cache.cities = { data: null, timestamp: null };

  const newCity = {
    id: cityId,
    name: name.trim(),
    state: state.trim(),
    status: "active",
  };

  sendSuccess(res, newCity, "City created successfully", 201);
});

// Get all vendors (for dropdown) - WITH CACHING
export const getAllVendors = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.vendors)) {
    return sendSuccess(
      res,
      cache.vendors.data,
      "Vendors fetched successfully (cached)",
      200,
    );
  }

  // Cache miss - fetch from database
  const [vendors] = await db.query(`
    SELECT id, name, email, phone, status
    FROM vendors
    WHERE deleted_at IS NULL AND status = 'active'
    ORDER BY name ASC
  `);

  // Update cache
  cache.vendors = {
    data: vendors,
    timestamp: Date.now(),
  };

  sendSuccess(res, vendors, "Vendors fetched successfully", 200);
});

// Get all property types (for dropdown) - WITH CACHING
export const getAllPropertyTypes = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.propertyTypes)) {
    return sendSuccess(
      res,
      cache.propertyTypes.data,
      "Property types fetched successfully (cached)",
      200,
    );
  }

  // Cache miss - fetch from database
  const [propertyTypes] = await db.query(`
    SELECT id, name, slug, stay_type, icon, description, sort_order
    FROM property_types
    WHERE is_active = 1
    ORDER BY sort_order ASC, name ASC
  `);

  // Update cache
  cache.propertyTypes = {
    data: propertyTypes,
    timestamp: Date.now(),
  };

  sendSuccess(res, propertyTypes, "Property types fetched successfully", 200);
});

// Get all amenities (for checkbox grid) - WITH CACHING
export const getAllAmenities = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.amenities)) {
    return sendSuccess(
      res,
      cache.amenities.data,
      "Amenities fetched successfully (cached)",
      200,
    );
  }

  // Cache miss - fetch from database
  const [amenities] = await db.query(`
    SELECT id, name, category, icon, description, display_order, apartment_only
    FROM amenities
    WHERE is_active = 1
    ORDER BY category ASC, display_order ASC, name ASC
  `);

  // Group by category for better UI organization
  const groupedAmenities = amenities.reduce((acc, amenity) => {
    const category = amenity.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(amenity);
    return acc;
  }, {});

  const response = {
    all: amenities,
    grouped: groupedAmenities,
  };

  // Update cache
  cache.amenities = {
    data: response,
    timestamp: Date.now(),
  };

  sendSuccess(res, response, "Amenities fetched successfully", 200);
});

// Get vendor Terms & Conditions (latest version)
export const getVendorTerms = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, content, version, updated_at FROM vendor_terms_conditions ORDER BY id DESC LIMIT 1`,
  );
  if (rows.length === 0) {
    return sendSuccess(res, { content: "", version: 0 }, "No terms found", 200);
  }
  sendSuccess(res, rows[0], "Terms fetched successfully", 200);
});

// Update vendor Terms & Conditions (admin only)
export const updateVendorTerms = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Content is required" });
  }

  const adminId = req.user?.id || null;

  // Check if any record exists
  const [existing] = await db.query(
    `SELECT id, version FROM vendor_terms_conditions ORDER BY id DESC LIMIT 1`,
  );

  if (existing.length > 0) {
    const newVersion = (existing[0].version || 1) + 1;
    await db.query(
      `UPDATE vendor_terms_conditions SET content = ?, version = ?, updated_by = ? WHERE id = ?`,
      [content.trim(), newVersion, adminId, existing[0].id],
    );
    sendSuccess(
      res,
      { version: newVersion },
      "Terms updated successfully",
      200,
    );
  } else {
    await db.query(
      `INSERT INTO vendor_terms_conditions (content, version, updated_by) VALUES (?, 1, ?)`,
      [content.trim(), adminId],
    );
    sendSuccess(res, { version: 1 }, "Terms created successfully", 201);
  }
});

// Create new property
export const createProperty = asyncHandler(async (req, res) => {
  const {
    vendor_id,
    city_id,
    property_type_id,
    title,
    description,
    address,
    area,
    city,
    state,
    pincode,
    maps_location,
    pool_type,
    garden_type,
    pets_allowed,
    events_allowed,
    event_capacity,
    bedrooms,
    bathrooms,
    max_guests,
    living_area,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
    // Long-term Pricing & Discounts
    weekly_discount_percent,
    monthly_discount_percent,
    quarterly_discount_percent,
    long_term_discount_percent,
    allow_corporate_booking,
    corporate_discount_percent,
    maintenance_charges,
    // Session 70: Villa Duration Discount Slabs
    discount_3_5_days,
    discount_6_14_days,
    discount_15_plus_days,
    // Service Apartment Fields
    min_stay_days,
    max_stay_days,
    housekeeping_frequency,
    laundry_frequency,
    utilities_included,
    parking_slots,
    floor_number,
    wifi_speed_mbps,
    wifi_provider,
    furnishing_type,
    // Recommendations
    is_recommended,
    recommended_priority,
    // Existing fields
    primary_incharge_name,
    primary_incharge_phone,
    primary_incharge_email,
    primary_incharge_whatsapp,
    primary_incharge_alt_contact,
    secondary_incharge_name,
    secondary_incharge_phone,
    secondary_incharge_email,
    secondary_incharge_whatsapp,
    secondary_incharge_alt_contact,
    safety_information,
    local_area_info,
    emergency_contacts,
    same_day_booking_allowed,
    max_booking_days,
    check_in_time,
    check_out_time,
    amenities,
    house_rules,
    cancellation_policy,
    photos,
    price_per_night,
    original_price,
    gst_percentage,
    status,
  } = req.body;

  // Validation
  if (
    !title ||
    !vendor_id ||
    !city_id ||
    !property_type_id ||
    !price_per_night
  ) {
    return sendError(
      res,
      "Title, vendor, city, property type, and price are required",
      400,
    );
  }

  // XSS Protection - Sanitize rich text fields
  const safeSafetyInfo = safety_information
    ? sanitizeRichText(safety_information)
    : null;
  const safeLocalAreaInfo = local_area_info
    ? sanitizeRichText(local_area_info)
    : null;
  const safeEmergencyContacts = emergency_contacts
    ? sanitizeRichText(emergency_contacts)
    : null;

  const propertyId = generateUUID();

  const query = `
    INSERT INTO properties (
      id, vendor_id, city_id, property_type_id, title, description,
      address, area, state, pincode, maps_location,
      pool_type, garden_type, pets_allowed, events_allowed, event_capacity,
      bedrooms, bathrooms, max_guests, living_area,
      min_stay_days, max_stay_days, housekeeping_frequency, laundry_frequency,
      utilities_included, parking_slots, floor_number, wifi_speed_mbps, wifi_provider, furnishing_type,
      is_recommended, recommended_priority, recommended_at, recommended_by,
      safety_information, local_area_info, emergency_contacts,
      same_day_booking_allowed, max_booking_days, check_in_time, check_out_time,
      house_rules, cancellation_policy, photos, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `;

  const values = [
    propertyId,
    vendor_id,
    city_id,
    property_type_id,
    title,
    description || null,
    address || null,
    area || null,
    state || null,
    pincode || null,
    maps_location || null,
    pool_type || "none",
    garden_type || "none",
    pets_allowed || false,
    events_allowed || false,
    event_capacity || null,
    bedrooms || 0,
    bathrooms || 0,
    max_guests || 2,
    living_area || 1,
    min_stay_days || 1,
    max_stay_days || null,
    housekeeping_frequency || "weekly",
    laundry_frequency || "weekly",
    utilities_included || false,
    parking_slots || 0,
    floor_number || null,
    wifi_speed_mbps || null,
    wifi_provider || null,
    furnishing_type || "fully_furnished",
    is_recommended || false,
    recommended_priority || 0,
    is_recommended ? new Date() : null,
    is_recommended ? req.user.id : null,
    safeSafetyInfo,
    safeLocalAreaInfo,
    safeEmergencyContacts,
    same_day_booking_allowed || false,
    max_booking_days || null,
    check_in_time || "2:00 PM",
    check_out_time || "11:00 AM",
    house_rules || "{}",
    cancellation_policy || "{}",
    photos || "[]",
    status || "draft",
  ];

  await db.query(query, values);

  // Insert pricing data into property_pricing table
  if (price_per_night) {
    const pricingQuery = `
      INSERT INTO property_pricing (
        id, property_id, price_per_night, original_price, gst_percentage,
        min_guests, extra_guest_charge, min_children, max_children, extra_child_charge,
        weekly_discount_percent, monthly_discount_percent,
        quarterly_discount_percent, long_term_discount_percent,
        allow_corporate_booking, corporate_discount_percent,
        maintenance_charges,
        discount_3_5_days, discount_6_14_days, discount_15_plus_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const pricingValues = [
      generateUUID(),
      propertyId,
      price_per_night,
      original_price || null,
      gst_percentage || 18,
      min_guests || 1,
      extra_guest_charge || 0,
      min_children || 0,
      max_children || 5,
      extra_child_charge || 0,
      weekly_discount_percent || 0,
      monthly_discount_percent || 0,
      quarterly_discount_percent || 0,
      long_term_discount_percent || 0,
      allow_corporate_booking || false,
      corporate_discount_percent || 0,
      maintenance_charges || 0,
      parseFloat(discount_3_5_days) || 0,
      parseFloat(discount_6_14_days) || 0,
      parseFloat(discount_15_plus_days) || 0,
    ];

    await db.query(pricingQuery, pricingValues);
  }

  // Insert property contacts (primary and secondary)
  if (
    primary_incharge_name ||
    primary_incharge_phone ||
    primary_incharge_email
  ) {
    const primaryContactQuery = `
      INSERT INTO property_contacts (
        property_id, contact_type_id, name, phone, email, whatsapp, alt_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const primaryContactValues = [
      propertyId,
      1, // contact_type_id = 1 for primary
      primary_incharge_name || null,
      primary_incharge_phone || null,
      primary_incharge_email || null,
      primary_incharge_whatsapp || null,
      primary_incharge_alt_contact || null,
    ];

    await db.query(primaryContactQuery, primaryContactValues);
  }

  if (
    secondary_incharge_name ||
    secondary_incharge_phone ||
    secondary_incharge_email
  ) {
    const secondaryContactQuery = `
      INSERT INTO property_contacts (
        property_id, contact_type_id, name, phone, email, whatsapp, alt_contact
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const secondaryContactValues = [
      propertyId,
      2, // contact_type_id = 2 for secondary
      secondary_incharge_name || null,
      secondary_incharge_phone || null,
      secondary_incharge_email || null,
      secondary_incharge_whatsapp || null,
      secondary_incharge_alt_contact || null,
    ];

    await db.query(secondaryContactQuery, secondaryContactValues);
  }

  // Insert property guidelines (rich text fields)
  if (safety_information || local_area_info || emergency_contacts) {
    const guidelinesQuery = `
      INSERT INTO property_guidelines (
        id, property_id,
        safety_information, local_area_info, emergency_contacts
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const guidelinesValues = [
      generateUUID(),
      propertyId,
      safeSafetyInfo,
      safeLocalAreaInfo,
      safeEmergencyContacts,
    ];

    await db.query(guidelinesQuery, guidelinesValues);
  }

  // Insert amenities into property_amenities junction table
  if (amenities) {
    try {
      // Parse amenities - could be JSON string or array
      let amenitiesArray = [];
      if (typeof amenities === "string") {
        amenitiesArray = JSON.parse(amenities);
      } else if (Array.isArray(amenities)) {
        amenitiesArray = amenities;
      }

      // Insert each amenity into junction table
      if (amenitiesArray.length > 0) {
        const amenityInserts = amenitiesArray.map((amenityId) => {
          return db.query(
            "INSERT INTO property_amenities (id, property_id, amenity_id) VALUES (?, ?, ?)",
            [generateUUID(), propertyId, amenityId],
          );
        });

        await Promise.all(amenityInserts);
      }
    } catch (error) {
      // Log error but don't fail property creation
      console.error("Error inserting amenities:", error.message);
    }
  }

  sendSuccess(res, { id: propertyId }, "Property created successfully", 201);
});

// Update existing property
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // AGGRESSIVE LOGGING - START
  console.log("\n========================================");
  console.log("🔍 UPDATE PROPERTY REQUEST RECEIVED");
  console.log("========================================");
  console.log("📝 Property ID:", id);
  console.log("📊 Request body keys:", Object.keys(req.body));
  console.log("👤 User:", req.user?.email);
  console.log("⏰ Timestamp:", new Date().toISOString());
  console.log("========================================\n");

  const {
    vendor_id,
    city_id,
    property_type_id, // Changed from property_type (now UUID)
    title,
    description,
    address,
    area, // NEW: Specific locality
    city,
    state,
    pincode,
    maps_location, // NEW: Google Maps URL/coordinates
    pool_type,
    garden_type,
    pets_allowed,
    events_allowed,
    event_capacity,
    bedrooms,
    bathrooms,
    max_guests,
    living_area,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
    // NEW: Long-term Pricing & Discounts (9 fields)
    weekly_discount_percent,
    monthly_discount_percent,
    quarterly_discount_percent,
    long_term_discount_percent,
    allow_corporate_booking,
    corporate_discount_percent,
    maintenance_charges,
    // Session 70: Villa Duration Discount Slabs
    discount_3_5_days,
    discount_6_14_days,
    discount_15_plus_days,
    // NEW: Service Apartment Fields (10 fields)
    min_stay_days,
    max_stay_days,
    housekeeping_frequency,
    laundry_frequency,
    utilities_included,
    parking_slots,
    floor_number,
    wifi_speed_mbps,
    wifi_provider,
    furnishing_type,
    // NEW: Recommendations (2 fields)
    is_recommended,
    recommended_priority,
    // Existing fields
    primary_incharge_name,
    primary_incharge_phone,
    primary_incharge_email,
    primary_incharge_whatsapp,
    primary_incharge_alt_contact,
    secondary_incharge_name,
    secondary_incharge_phone,
    secondary_incharge_email,
    secondary_incharge_whatsapp,
    secondary_incharge_alt_contact,
    safety_information,
    local_area_info,
    emergency_contacts,
    same_day_booking_allowed,
    max_booking_days,
    check_in_time,
    check_out_time,
    house_rules,
    cancellation_policy,
    price_per_night,
    original_price,
    gst_percentage,
    status,
  } = req.body;

  // NOTE: photos field removed - images are managed through separate APIs:
  // - Upload: POST /api/admin/properties/:id/images
  // - Delete: DELETE /api/admin/properties/:id/images/:imageId

  // Check if property exists
  const [existing] = await db.query(
    "SELECT id, is_recommended FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (!existing || existing.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const wasRecommended = existing[0].is_recommended;

  // XSS Protection for rich text guideline fields
  // Use empty string instead of null for TEXT fields
  const safeSafetyInfo =
    safety_information && typeof safety_information === "string"
      ? sanitizeRichText(safety_information)
      : "";
  const safeLocalAreaInfo =
    local_area_info && typeof local_area_info === "string"
      ? sanitizeRichText(local_area_info)
      : "";
  const safeEmergencyContacts =
    emergency_contacts && typeof emergency_contacts === "string"
      ? sanitizeRichText(emergency_contacts)
      : "";

  // Handle recommendation timestamp
  const recommendedAt =
    is_recommended && !wasRecommended ? new Date() : undefined;
  const recommendedBy =
    is_recommended && !wasRecommended ? req.user.id : undefined;

  const query = `
    UPDATE properties SET
      vendor_id = ?,
      city_id = ?,
      property_type_id = ?,
      title = ?,
      description = ?,
      address = ?,
      area = ?,
      state = ?,
      pincode = ?,
      maps_location = ?,
      pool_type = ?,
      garden_type = ?,
      pets_allowed = ?,
      events_allowed = ?,
      event_capacity = ?,
      bedrooms = ?,
      bathrooms = ?,
      max_guests = ?,
      living_area = ?,
      min_stay_days = ?,
      max_stay_days = ?,
      housekeeping_frequency = ?,
      laundry_frequency = ?,
      utilities_included = ?,
      parking_slots = ?,
      floor_number = ?,
      wifi_speed_mbps = ?,
      wifi_provider = ?,
      furnishing_type = ?,
      is_recommended = ?,
      recommended_priority = ?,
      ${recommendedAt ? "recommended_at = ?," : ""}
      ${recommendedBy ? "recommended_by = ?," : ""}
      safety_information = ?,
      local_area_info = ?,
      emergency_contacts = ?,
      same_day_booking_allowed = ?,
      max_booking_days = ?,
      check_in_time = ?,
      check_out_time = ?,
      house_rules = ?,
      cancellation_policy = ?,
      status = ?
    WHERE id = ? AND deleted_at IS NULL
  `;

  const values = [
    vendor_id,
    city_id,
    property_type_id,
    title,
    description || null,
    address || null,
    area || null,
    state || null,
    pincode || null,
    maps_location || null,
    pool_type || "none",
    garden_type || "none",
    pets_allowed || false,
    events_allowed || false,
    event_capacity || null,
    bedrooms || 0,
    bathrooms || 0,
    max_guests || 2,
    living_area || 1,
    min_stay_days || 1,
    max_stay_days || null,
    housekeeping_frequency || "weekly",
    laundry_frequency || "weekly",
    utilities_included || false,
    parking_slots || 0,
    floor_number || null,
    wifi_speed_mbps || null,
    wifi_provider || null,
    furnishing_type || "fully_furnished",
    is_recommended || false,
    recommended_priority || 0,
  ];

  console.log("📋 Base values array length:", values.length);

  if (recommendedAt) {
    values.push(recommendedAt);
    console.log("➕ Added recommendedAt:", recommendedAt);
  }
  if (recommendedBy) {
    values.push(recommendedBy);
    console.log("➕ Added recommendedBy:", recommendedBy);
  }

  values.push(
    safeSafetyInfo,
    safeLocalAreaInfo,
    safeEmergencyContacts,
    same_day_booking_allowed || false,
    max_booking_days || null,
    check_in_time || "2:00 PM",
    check_out_time || "11:00 AM",
    house_rules || "{}",
    cancellation_policy || "{}",
    status || "draft",
    id,
  );

  console.log("📊 Final query values count:", values.length);
  console.log("🎯 Sample values:", {
    title: values[4],
    status: values[values.length - 2],
    id: values[values.length - 1],
  });

  console.log("🔄 Executing UPDATE query...");
  try {
    const updateResult = await db.query(query, values);
    console.log("✅ Properties table updated:", {
      affectedRows: updateResult[0].affectedRows,
      changedRows: updateResult[0].changedRows,
      warningCount: updateResult[0].warningCount,
    });

    if (updateResult[0].affectedRows === 0) {
      console.error(
        "⚠️ WARNING: No rows affected! Property may not exist or WHERE clause failed",
      );
    }
    if (updateResult[0].changedRows === 0) {
      console.log("ℹ️  INFO: No changes detected (values match existing data)");
    }
  } catch (error) {
    console.error("❌ UPDATE query failed:", error.message);
    console.error("Query:", query.substring(0, 200) + "...");
    console.error("Values length:", values.length);
    throw error;
  }

  // Update or insert property_pricing table
  if (price_per_night) {
    console.log("💰 Updating property_pricing table...");
    const [existingPricing] = await db.query(
      "SELECT id FROM property_pricing WHERE property_id = ?",
      [id],
    );

    if (existingPricing.length > 0) {
      console.log("✏️ Existing pricing found, updating...");
      // Update existing pricing
      const pricingUpdateQuery = `
        UPDATE property_pricing SET
          price_per_night = ?,
          original_price = ?,
          gst_percentage = ?,
          min_guests = ?,
          extra_guest_charge = ?,
          min_children = ?,
          max_children = ?,
          extra_child_charge = ?,
          weekly_discount_percent = ?,
          monthly_discount_percent = ?,
          quarterly_discount_percent = ?,
          long_term_discount_percent = ?,
          allow_corporate_booking = ?,
          corporate_discount_percent = ?,
          maintenance_charges = ?,
          discount_3_5_days = ?,
          discount_6_14_days = ?,
          discount_15_plus_days = ?
        WHERE property_id = ?
      `;

      const pricingValues = [
        price_per_night,
        original_price || null,
        gst_percentage || 18,
        min_guests || 1,
        extra_guest_charge || 0,
        min_children || 0,
        max_children || 5,
        extra_child_charge || 0,
        weekly_discount_percent || 0,
        monthly_discount_percent || 0,
        quarterly_discount_percent || 0,
        long_term_discount_percent || 0,
        allow_corporate_booking || false,
        corporate_discount_percent || 0,
        maintenance_charges || 0,
        parseFloat(discount_3_5_days) || 0,
        parseFloat(discount_6_14_days) || 0,
        parseFloat(discount_15_plus_days) || 0,
        id,
      ];

      await db.query(pricingUpdateQuery, pricingValues);
      console.log("✅ Property pricing updated successfully");
    } else {
      console.log("➕ No existing pricing, inserting new...");
      // Insert new pricing record
      const pricingInsertQuery = `
        INSERT INTO property_pricing (
          id, property_id, price_per_night, original_price, gst_percentage,
          min_guests, extra_guest_charge, min_children, max_children, extra_child_charge,
          weekly_discount_percent, monthly_discount_percent,
          quarterly_discount_percent, long_term_discount_percent,
          allow_corporate_booking, corporate_discount_percent,
          maintenance_charges,
          discount_3_5_days, discount_6_14_days, discount_15_plus_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const pricingValues = [
        generateUUID(),
        id,
        price_per_night,
        original_price || null,
        gst_percentage || 18,
        min_guests || 1,
        extra_guest_charge || 0,
        min_children || 0,
        max_children || 5,
        extra_child_charge || 0,
        weekly_discount_percent || 0,
        monthly_discount_percent || 0,
        quarterly_discount_percent || 0,
        long_term_discount_percent || 0,
        allow_corporate_booking || false,
        corporate_discount_percent || 0,
        maintenance_charges || 0,
        parseFloat(discount_3_5_days) || 0,
        parseFloat(discount_6_14_days) || 0,
        parseFloat(discount_15_plus_days) || 0,
      ];

      await db.query(pricingInsertQuery, pricingValues);
      console.log("✅ Property pricing inserted successfully");
    }
  }

  // CRITICAL: Update amenities
  console.log("🏷️  Updating amenities...");
  const { amenities } = req.body;
  if (amenities && Array.isArray(amenities)) {
    console.log("📋 Amenities received:", amenities.length, "items");

    // Delete existing amenities
    await db.query("DELETE FROM property_amenities WHERE property_id = ?", [
      id,
    ]);
    console.log("🗑️  Deleted existing amenities");

    // Insert new amenities
    if (amenities.length > 0) {
      for (const amenity_id of amenities) {
        await db.query(
          "INSERT INTO property_amenities (id, property_id, amenity_id) VALUES (UUID(), ?, ?)",
          [id, amenity_id],
        );
      }
      console.log("✅ Inserted", amenities.length, "amenities");
    }
  } else {
    console.log("ℹ️  No amenities provided or invalid format");
  }

  // CRITICAL: Update property contacts (NORMALIZED DATABASE APPROACH)
  console.log("👤 Updating property contacts (incharge info)...");
  // Note: incharge fields already destructured at top of function

  // Delete existing primary (type 1) and secondary (type 2) contacts
  await db.query(
    "DELETE FROM property_contacts WHERE property_id = ? AND contact_type_id IN (1, 2)",
    [id],
  );
  console.log("🗑️  Deleted existing primary/secondary contacts");

  // Insert primary incharge if provided (contact_type_id = 1)
  if (
    primary_incharge_name ||
    primary_incharge_phone ||
    primary_incharge_email
  ) {
    await db.query(
      "INSERT INTO property_contacts (property_id, contact_type_id, name, phone, email, whatsapp, alt_contact) VALUES (?, 1, ?, ?, ?, ?, ?)",
      [
        id,
        primary_incharge_name || null,
        primary_incharge_phone || null,
        primary_incharge_email || null,
        primary_incharge_whatsapp || null,
        primary_incharge_alt_contact || null,
      ],
    );
    console.log(
      "✅ Inserted primary incharge:",
      primary_incharge_name || primary_incharge_phone,
    );
  }

  // Insert secondary incharge if provided (contact_type_id = 2)
  if (
    secondary_incharge_name ||
    secondary_incharge_phone ||
    secondary_incharge_email
  ) {
    await db.query(
      "INSERT INTO property_contacts (property_id, contact_type_id, name, phone, email, whatsapp, alt_contact) VALUES (?, 2, ?, ?, ?, ?, ?)",
      [
        id,
        secondary_incharge_name || null,
        secondary_incharge_phone || null,
        secondary_incharge_email || null,
        secondary_incharge_whatsapp || null,
        secondary_incharge_alt_contact || null,
      ],
    );
    console.log(
      "✅ Inserted secondary incharge:",
      secondary_incharge_name || secondary_incharge_phone,
    );
  }

  console.log("\n========================================");
  console.log("🎉 PROPERTY UPDATE COMPLETED SUCCESSFULLY");
  console.log("========================================");
  console.log("📝 Property ID:", id);
  console.log("⏰ Completed at:", new Date().toISOString());
  console.log("========================================\n");

  // Sync property_guidelines table to stay consistent with properties columns
  const [existingGuidelines] = await db.query(
    "SELECT id FROM property_guidelines WHERE property_id = ?",
    [id],
  );
  if (existingGuidelines.length > 0) {
    await db.query(
      `UPDATE property_guidelines SET
        safety_information = ?, local_area_info = ?, emergency_contacts = ?
       WHERE property_id = ?`,
      [safeSafetyInfo, safeLocalAreaInfo, safeEmergencyContacts, id],
    );
  } else {
    await db.query(
      `INSERT INTO property_guidelines (id, property_id, safety_information, local_area_info, emergency_contacts)
       VALUES (?, ?, ?, ?, ?)`,
      [
        generateUUID(),
        id,
        safeSafetyInfo,
        safeLocalAreaInfo,
        safeEmergencyContacts,
      ],
    );
  }

  sendSuccess(res, { id }, "Property updated successfully", 200);
});

// Delete property (soft delete)
export const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if property has active bookings
  const [activeBookings] = await db.query(
    `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE property_id = ? 
     AND status IN ('pending_payment', 'confirmed') 
     AND deleted_at IS NULL`,
    [id],
  );

  if (activeBookings[0].count > 0) {
    return sendError(res, "Cannot delete property with active bookings", 400);
  }

  await db.query("UPDATE properties SET deleted_at = NOW() WHERE id = ?", [id]);

  sendSuccess(res, null, "Property deleted successfully", 200);
});

// ===================================================================
// RECOMMENDED PROPERTIES MANAGEMENT
// ===================================================================

// Get all recommended properties with management info
export const getRecommendedPropertiesAdmin = asyncHandler(async (req, res) => {
  const { property_type_id } = req.query; // Optional filter

  let query = `
    SELECT 
      p.id,
      p.title,
      p.city_id,
      c.name as city_name,
      c.state,
      p.property_type_id,
      pt.name as property_type,
      p.is_recommended,
      p.recommended_priority,
      p.recommended_at,
      p.recommended_by,
      a.name as recommended_by_name,
      p.rating,
      p.reviews_count,
      p.status,
      p.photos
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_types pt ON p.property_type_id = pt.id
    LEFT JOIN admins a ON p.recommended_by = a.id
    WHERE p.deleted_at IS NULL
    AND p.status = 'approved'
    AND p.is_recommended = 1
  `;

  const params = [];

  if (property_type_id) {
    query += " AND p.property_type_id = ?";
    params.push(property_type_id);
  }

  query += " ORDER BY p.recommended_priority DESC, p.created_at DESC";

  const [properties] = await db.query(query, params);

  // Parse photos
  const parsedProperties = properties.map((prop) => {
    try {
      prop.photos = prop.photos ? JSON.parse(prop.photos) : [];
      prop.thumbnail = prop.photos[0] || null;
    } catch (error) {
      prop.photos = [];
      prop.thumbnail = null;
    }
    return prop;
  });

  sendSuccess(
    res,
    {
      properties: parsedProperties,
      count: parsedProperties.length,
    },
    "Recommended properties fetched successfully",
    200,
  );
});

// Toggle recommended status for a property
export const toggleRecommendedStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_recommended } = req.body;
  const adminId = req.user.id;

  // Validate property exists and is approved
  const [properties] = await db.query(
    "SELECT id, property_type_id, is_recommended, title, status FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const property = properties[0];

  if (is_recommended && property.status !== "approved") {
    return sendError(
      res,
      "Only approved properties can be marked as recommended",
      400,
    );
  }

  // If marking as recommended, check limit (12 per property type)
  if (is_recommended) {
    const [count] = await db.query(
      `SELECT COUNT(*) as total 
       FROM properties 
       WHERE property_type_id = ? 
       AND is_recommended = 1 
       AND status = 'approved'
       AND deleted_at IS NULL
       AND id != ?`,
      [property.property_type_id, id],
    );

    if (count[0].total >= 12) {
      return sendError(
        res,
        "Maximum 12 properties can be recommended per property type",
        400,
      );
    }

    // Get next priority (highest current + 1)
    const [maxPriority] = await db.query(
      `SELECT COALESCE(MAX(recommended_priority), 0) as max_priority 
       FROM properties 
       WHERE property_type_id = ? 
       AND is_recommended = 1 
       AND status = 'approved'
       AND deleted_at IS NULL`,
      [property.property_type_id],
    );

    const newPriority = maxPriority[0].max_priority + 1;

    await db.query(
      `UPDATE properties 
       SET is_recommended = 1, 
           recommended_priority = ?,
           recommended_at = NOW(),
           recommended_by = ?
       WHERE id = ?`,
      [newPriority, adminId, id],
    );

    sendSuccess(
      res,
      {
        property_id: id,
        is_recommended: true,
        recommended_priority: newPriority,
      },
      "Property marked as recommended",
      200,
    );
  } else {
    // Remove from recommended
    await db.query(
      `UPDATE properties 
       SET is_recommended = 0, 
           recommended_priority = 0,
           recommended_at = NULL,
           recommended_by = NULL
       WHERE id = ?`,
      [id],
    );

    // Reorder remaining properties of same type
    const [remainingProperties] = await db.query(
      `SELECT id 
       FROM properties 
       WHERE property_type_id = ? 
       AND is_recommended = 1 
       AND status = 'approved'
       AND deleted_at IS NULL
       ORDER BY recommended_priority DESC`,
      [property.property_type_id],
    );

    // Reset priorities to 1, 2, 3...
    for (let i = 0; i < remainingProperties.length; i++) {
      await db.query(
        "UPDATE properties SET recommended_priority = ? WHERE id = ?",
        [remainingProperties.length - i, remainingProperties[i].id],
      );
    }

    sendSuccess(
      res,
      { property_id: id, is_recommended: false },
      "Property removed from recommended",
      200,
    );
  }
});

// Reorder recommended properties (drag and drop)
export const reorderRecommendedProperties = asyncHandler(async (req, res) => {
  const { property_type_id, ordered_property_ids } = req.body;

  // Validate inputs
  if (!property_type_id || !Array.isArray(ordered_property_ids)) {
    return sendError(
      res,
      "property_type_id and ordered_property_ids array required",
      400,
    );
  }

  if (ordered_property_ids.length > 12) {
    return sendError(res, "Maximum 12 properties can be recommended", 400);
  }

  // Verify all properties exist and belong to the property type
  const placeholders = ordered_property_ids.map(() => "?").join(",");
  const [properties] = await db.query(
    `SELECT id, property_type_id 
     FROM properties 
     WHERE id IN (${placeholders}) 
     AND property_type_id = ?
     AND is_recommended = 1
     AND status = 'approved'
     AND deleted_at IS NULL`,
    [...ordered_property_ids, property_type_id],
  );

  if (properties.length !== ordered_property_ids.length) {
    return sendError(res, "Some properties not found or not recommended", 400);
  }

  // Update priorities (highest priority = first in array)
  const totalProperties = ordered_property_ids.length;
  for (let i = 0; i < totalProperties; i++) {
    const priority = totalProperties - i; // Reverse: first = highest
    await db.query(
      "UPDATE properties SET recommended_priority = ? WHERE id = ?",
      [priority, ordered_property_ids[i]],
    );
  }

  sendSuccess(
    res,
    {
      property_type_id,
      reordered_count: totalProperties,
    },
    "Recommended properties reordered successfully",
    200,
  );
});

// ===========================================
// Property Images Management
// ===========================================

/**
 * Get property images
 * GET /api/admin/properties/:id/images
 */
export const getPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log("🖼️ Get images request for property:", id);

  // Get property photos
  const [rows] = await db.query(
    "SELECT photos FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (!rows || rows.length === 0) {
    console.log("❌ Property not found:", id);
    return sendError(res, "Property not found", 404);
  }

  let images = [];
  try {
    const photosData = rows[0].photos;
    console.log("📸 Raw photos data:", photosData);
    if (photosData && photosData !== "[]" && photosData !== "") {
      const photosArray = JSON.parse(photosData);
      // Transform array to objects with id (index) and image_url
      images = Array.isArray(photosArray)
        ? photosArray.map((url, index) => ({
            id: index,
            image_url: url.trim(),
            order: index,
          }))
        : [];
      console.log("✅ Parsed images:", images.length);
    } else {
      console.log("ℹ️ No photos found for property:", id);
    }
  } catch (error) {
    console.error("❌ Error parsing photos JSON:", error);
    return sendError(res, "Error parsing property images", 500);
  }

  console.log("✅ Returning images:", images.length);
  sendSuccess(res, images, "Property images retrieved successfully", 200);
});

/**
 * Upload property images
 * POST /api/admin/properties/:id/images
 */
export const uploadPropertyImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const useR2 = isR2Configured();

  console.log("📤 Upload images request for property:", id);
  console.log("📎 Files received:", req.files?.length || 0);
  console.log("📦 Storage mode:", useR2 ? "Cloudflare R2" : "Local disk");

  // Check if property exists
  const [existing] = await db.query(
    "SELECT id, photos FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (!existing || existing.length === 0) {
    console.log("❌ Property not found:", id);
    return sendError(res, "Property not found", 404);
  }

  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    console.log("❌ No files in request");
    return sendError(res, "No images uploaded", 400);
  }

  // Get existing photos
  let existingPhotos = [];
  try {
    const photosData = existing[0].photos;
    if (photosData && photosData !== "[]" && photosData !== "") {
      existingPhotos = JSON.parse(photosData);
    }
    console.log("📸 Existing photos:", existingPhotos.length);
  } catch (error) {
    console.error("Error parsing existing photos:", error);
    existingPhotos = [];
  }

  // Note: We APPEND new images to existing ones (don't delete old images)
  // Users can manually delete images they don't want using the delete endpoint
  console.log("📝 Upload strategy: APPEND new images to existing collection");

  // Upload images based on storage mode
  let newImageUrls;
  const failedUploads = [];

  if (useR2) {
    // Upload to Cloudflare R2 (fault-tolerant: continue even if some files fail)
    console.log("☁️  Uploading to Cloudflare R2...");
    newImageUrls = [];
    for (const file of req.files) {
      try {
        const ext = file.originalname.split(".").pop();
        const imageUrl = await uploadToR2(file.buffer, "properties", null, {
          ext,
        });
        newImageUrls.push(imageUrl);
      } catch (error) {
        console.error("❌ R2 upload failed for file:", file.originalname, error);
        failedUploads.push({
          filename: file.originalname,
          error: error?.message || "Upload failed",
        });
      }
    }
    if (newImageUrls.length === 0) {
      return sendError(
        res,
        failedUploads[0]?.error || "Failed to upload images to R2",
        500,
      );
    }
    console.log("✅ R2 upload successful:", newImageUrls.length, "images");
  } else {
    // Local storage fallback
    console.log("💾 Using local disk storage...");
    newImageUrls = req.files.map(
      (file) => `/uploads/properties/${file.filename}`,
    );
  }

  console.log("✅ New image URLs generated:", newImageUrls);

  // APPEND new images to existing ones (industry standard)
  // Users can manually delete unwanted images
  const updatedPhotos = [...existingPhotos, ...newImageUrls];
  console.log("📦 Photos before upload:", existingPhotos.length);
  console.log("📤 New images uploaded:", newImageUrls.length);
  console.log("📊 Total photos after upload:", updatedPhotos.length);
  console.log("✅ Action: APPENDED new images to existing collection");

  // Update database
  console.log("💾 Updating database with new photos array...");
  const updateResult = await db.query(
    "UPDATE properties SET photos = ? WHERE id = ? AND deleted_at IS NULL",
    [JSON.stringify(updatedPhotos), id],
  );
  console.log("✅ Database UPDATE result:", {
    affectedRows: updateResult[0].affectedRows,
    changedRows: updateResult[0].changedRows,
  });

  if (updateResult[0].affectedRows === 0) {
    console.error(
      "⚠️ WARNING: No rows updated! Photos may not have been saved.",
    );
  }

  // Verify the photos were actually saved
  const [verification] = await db.query(
    "SELECT photos FROM properties WHERE id = ?",
    [id],
  );
  const savedPhotos = verification[0]?.photos;
  console.log(
    "🔍 Verification - Photos in database:",
    savedPhotos ? JSON.parse(savedPhotos).length + " images" : "NULL or empty",
  );

  // Return all images with indices
  const allImages = updatedPhotos.map((url, index) => ({
    id: index,
    image_url: url.trim(),
    order: index,
  }));

  console.log("✅ Returning all images:", allImages.length);
  sendSuccess(
    res,
    {
      images: allImages,
      failed: failedUploads,
      summary: {
        total: req.files.length,
        uploaded: newImageUrls.length,
        failed: failedUploads.length,
      },
    },
    failedUploads.length
      ? `Uploaded ${newImageUrls.length} image(s). ${failedUploads.length} failed.`
      : "Images uploaded successfully",
    200,
  );
});

/**
 * Delete property image
 * DELETE /api/admin/properties/:id/images/:imageId
 */
export const deletePropertyImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;
  const imageIndex = parseInt(imageId, 10);
  const useR2 = isR2Configured();

  console.log("\n🗑️  DELETE IMAGE REQUEST");
  console.log("Property ID:", id);
  console.log("Image Index:", imageIndex);

  if (isNaN(imageIndex) || imageIndex < 0) {
    console.error("❌ Invalid image index:", imageId);
    return sendError(res, "Invalid image ID", 400);
  }

  // Get property photos
  const [existing] = await db.query(
    "SELECT photos FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (!existing || existing.length === 0) {
    console.error("❌ Property not found:", id);
    return sendError(res, "Property not found", 404);
  }

  let photos = [];
  try {
    const photosData = existing[0].photos;
    console.log("📸 Raw photos data:", photosData);
    if (photosData && photosData !== "[]" && photosData !== "") {
      photos = JSON.parse(photosData);
    }
    console.log("📊 Parsed photos count:", photos.length);
  } catch (error) {
    console.error("❌ Error parsing photos JSON:", error);
    return sendError(res, "Error parsing property images", 500);
  }

  // Check if image index exists
  if (imageIndex >= photos.length) {
    console.error(
      `❌ Image index ${imageIndex} >= photos length ${photos.length}`,
    );
    return sendError(
      res,
      `Image not found (index ${imageIndex} but only ${photos.length} images exist)`,
      404,
    );
  }

  // Get the image URL to delete
  const deletedImageUrl = photos[imageIndex];
  console.log("🗑️  Deleting image:", deletedImageUrl);

  // Delete from R2 if configured
  if (useR2 && deletedImageUrl.startsWith("http")) {
    console.log("☁️  Deleting from Cloudflare R2...");
    const deleted = await deleteFromR2(deletedImageUrl);
    if (deleted) {
      console.log("✅ R2 deletion successful");
    } else {
      console.warn("⚠️  R2 deletion failed, continuing with DB update");
    }
  } else if (!useR2 && deletedImageUrl.startsWith("/uploads/")) {
    // Delete local file if it exists
    console.log("💾 Deleting from local storage...");
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const filePath = path.join(process.cwd(), deletedImageUrl);
      await fs.unlink(filePath);
      console.log("✅ Local file deleted");
    } catch (error) {
      console.warn("⚠️  Local file deletion failed:", error.message);
    }
  }

  // Remove image from array
  photos.splice(imageIndex, 1);

  // Update database
  await db.query(
    "UPDATE properties SET photos = ? WHERE id = ? AND deleted_at IS NULL",
    [JSON.stringify(photos), id],
  );

  // Note: You may want to delete the physical file from uploads folder
  // using fs.unlink() if the image is stored locally

  sendSuccess(
    res,
    {
      deleted_image: deletedImageUrl,
      remaining_images: photos.map((url, index) => ({
        id: index,
        image_url: url.trim(),
        order: index,
      })),
    },
    "Image deleted successfully",
    200,
  );
});

export const updatePropertyPricing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db.query(
    "SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
  if (!existing || existing.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  const allowedFields = [
    "price_per_night",
    "original_price",
    "gst_percentage",
    "min_guests",
    "extra_guest_charge",
    "min_children",
    "max_children",
    "extra_child_charge",
    "weekly_discount_percent",
    "monthly_discount_percent",
    "quarterly_discount_percent",
    "long_term_discount_percent",
    "allow_corporate_booking",
    "corporate_discount_percent",
    "maintenance_charges",
  ];

  const updates = [];
  const values = [];

  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  });

  if (updates.length === 0) {
    return sendError(res, "No valid pricing fields provided", 400);
  }

  values.push(id);

  const [result] = await db.query(
    `UPDATE property_pricing SET ${updates.join(", ")} WHERE property_id = ?`,
    values,
  );

  if (result.affectedRows === 0) {
    return sendError(res, "Pricing record not found for this property", 404);
  }

  const [updated] = await db.query(
    "SELECT * FROM property_pricing WHERE property_id = ?",
    [id],
  );

  sendSuccess(res, { pricing: updated[0] }, "Pricing updated successfully");
});
