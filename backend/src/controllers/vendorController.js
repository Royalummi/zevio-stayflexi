import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { sanitizeRichText } from "../utils/sanitize.js";

/**
 * @route   GET /api/vendor/dashboard
 * @desc    Get vendor dashboard statistics
 * @access  Private (Vendor only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;

  // Get properties count by status
  const [propertiesCount] = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
    FROM properties
    WHERE vendor_id = ? AND deleted_at IS NULL`,
    [vendorId],
  );

  // Get bookings count and revenue
  const [bookingsData] = await db.query(
    `SELECT 
      COUNT(CASE WHEN b.status IN ('confirmed', 'completed') THEN 1 END) as active_bookings,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ?`,
    [vendorId],
  );

  // Get average rating from reviews
  const [ratingData] = await db.query(
    `SELECT 
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(r.id) as total_reviews
    FROM reviews r
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.vendor_id = ? AND r.status = 'approved'`,
    [vendorId],
  );

  // Get pending settlements
  const [settlementsData] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as pending_settlements
    FROM vendor_settlements
    WHERE vendor_id = ? AND status = 'pending'`,
    [vendorId],
  );

  const stats = {
    // Property counts by status
    total: propertiesCount[0].total,
    draft: propertiesCount[0].draft,
    pending_approval: propertiesCount[0].pending_approval,
    approved: propertiesCount[0].approved,
    inactive: propertiesCount[0].inactive,

    // Bookings & Revenue
    active_bookings: bookingsData[0].active_bookings,
    total_revenue: parseFloat(bookingsData[0].total_revenue),

    // Reviews
    avg_rating: parseFloat(ratingData[0].avg_rating).toFixed(1),
    total_reviews: ratingData[0].total_reviews,

    // Settlements
    pending_settlements: parseFloat(settlementsData[0].pending_settlements),
  };

  sendSuccess(res, stats, "Dashboard stats retrieved successfully");
});

/**
 * @route   GET /api/vendor/properties
 * @desc    Get vendor properties
 * @access  Private (Vendor only)
 */
const getProperties = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status, city } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.status,
      p.photos,
      p.created_at,
      c.name as city_name,
      e.name as employee_name,
      pr.price_per_night,
      pr.gst_percentage,
      (SELECT COUNT(*) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_bookings,
      (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_revenue
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN employees e ON p.employee_id = e.id
    LEFT JOIN property_pricing pr ON p.id = pr.property_id
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (city) {
    query += ` AND c.name = ?`;
    params.push(city);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [properties] = await db.query(query, params);

  // Extract thumbnail from photos JSON for each property
  const propertiesWithThumbnail = properties.map((p) => {
    let thumbnail = null;
    try {
      if (p.photos) {
        const photosArray =
          typeof p.photos === "string" ? JSON.parse(p.photos) : p.photos;
        if (Array.isArray(photosArray) && photosArray.length > 0) {
          thumbnail = photosArray[0];
        }
      }
    } catch (_) {
      // ignore parse errors
    }
    const { photos, ...rest } = p;
    return { ...rest, thumbnail };
  });

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM properties p LEFT JOIN cities c ON p.city_id = c.id WHERE p.vendor_id = ? AND p.deleted_at IS NULL`;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND p.status = ?`;
    countParams.push(status);
  }

  if (city) {
    countQuery += ` AND c.name = ?`;
    countParams.push(city);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  sendSuccess(res, {
    properties: propertiesWithThumbnail,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   GET /api/vendor/bookings
 * @desc    Get bookings for vendor properties
 * @access  Private (Vendor only)
 */
const getBookings = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.nights,
      b.total_amount,
      b.status,
      b.created_at,
      p.title as property_title,
      p.id as property_id,
      u.full_name as guest_name,
      u.email as guest_email,
      u.phone as guest_phone
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE p.vendor_id = ?
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [bookings] = await db.query(query, params);

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ?
  `;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND b.status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Aggregate stats across ALL bookings for this vendor (not just current page)
  let statsQuery = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN b.status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment,
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ?
  `;
  const statsParams = [vendorId];
  if (status) {
    statsQuery += ` AND b.status = ?`;
    statsParams.push(status);
  }
  const [statsResult] = await db.query(statsQuery, statsParams);

  sendSuccess(res, {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: statsResult[0],
  });
});

/**
 * @route   GET /api/vendor/settlements
 * @desc    Get vendor settlements
 * @access  Private (Vendor only)
 */
const getSettlements = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      vs.id,
      vs.amount,
      vs.status,
      vs.payment_proof,
      vs.created_at,
      vs.booking_id,
      p_booking.title as property_title
    FROM vendor_settlements vs
    LEFT JOIN bookings b ON vs.booking_id = b.id
    LEFT JOIN properties p_booking ON b.property_id = p_booking.id
    WHERE vs.vendor_id = ?
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND vs.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY vs.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [settlements] = await db.query(query, params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM vendor_settlements WHERE vendor_id = ?`;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Aggregate stats across ALL settlements for this vendor (not just current page)
  let settlementStatsQuery = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN vs.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN vs.status = 'paid' THEN 1 ELSE 0 END) as paid,
      COALESCE(SUM(vs.amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN vs.status = 'pending' THEN vs.amount ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN vs.status = 'paid' THEN vs.amount ELSE 0 END), 0) as paid_amount
    FROM vendor_settlements vs
    WHERE vs.vendor_id = ?
  `;
  const settlementStatsParams = [vendorId];
  if (status) {
    settlementStatsQuery += ` AND vs.status = ?`;
    settlementStatsParams.push(status);
  }
  const [settlementStatsResult] = await db.query(
    settlementStatsQuery,
    settlementStatsParams,
  );

  sendSuccess(res, {
    settlements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: settlementStatsResult[0],
  });
});

/**
 * @route   GET /api/vendor/analytics
 * @desc    Get vendor analytics
 * @access  Private (Vendor only)
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { start_date, end_date } = req.query;

  // Revenue by property
  const [revenueByProperty] = await db.query(
    `SELECT 
      p.title,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(b.total_amount), 0) as total_revenue
    FROM properties p
    LEFT JOIN bookings b ON p.id = b.property_id 
      AND b.status IN ('confirmed', 'completed')
      ${start_date ? "AND b.created_at >= ?" : ""}
      ${end_date ? "AND b.created_at <= ?" : ""}
    WHERE p.vendor_id = ?
    GROUP BY p.id, p.title
    ORDER BY total_revenue DESC`,
    [
      ...(start_date ? [start_date] : []),
      ...(end_date ? [end_date] : []),
      vendorId,
    ],
  );

  // Booking trends (monthly)
  let trendsQuery = `
    SELECT 
      DATE_FORMAT(b.created_at, '%Y-%m') as month,
      COUNT(*) as bookings,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ? AND b.status IN ('confirmed', 'completed')
  `;
  const trendsParams = [vendorId];

  if (start_date) {
    trendsQuery += ` AND b.created_at >= ?`;
    trendsParams.push(start_date);
  }
  if (end_date) {
    trendsQuery += ` AND b.created_at <= ?`;
    trendsParams.push(end_date);
  }

  trendsQuery += `
    GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  const [bookingTrends] = await db.query(trendsQuery, trendsParams);

  sendSuccess(res, {
    revenue_by_property: revenueByProperty,
    booking_trends: bookingTrends,
  });
});

/**
 * @route   PUT /api/vendor/bank-details
 * @desc    Update vendor bank details
 * @access  Private (Vendor only)
 */
const updateBankDetails = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const {
    bank_name,
    account_holder_name,
    account_number,
    ifsc_code,
    branch_name,
  } = req.body;

  if (!account_number || !ifsc_code || !account_holder_name) {
    return sendError(
      res,
      "account_holder_name, account_number, and ifsc_code are required",
      400,
    );
  }

  // Sanitize: only allow known safe characters in banking fields
  const safeIfsc = String(ifsc_code)
    .replace(/[^A-Z0-9]/gi, "")
    .substring(0, 11);
  const safeAccount = String(account_number)
    .replace(/[^0-9]/g, "")
    .substring(0, 20);

  const bankDetails = {
    bank_name: bank_name ? String(bank_name).substring(0, 100) : null,
    account_holder_name: String(account_holder_name).substring(0, 150),
    account_number: safeAccount,
    ifsc_code: safeIfsc,
    branch_name: branch_name ? String(branch_name).substring(0, 100) : null,
  };

  await db.query(`UPDATE vendors SET bank_details = ? WHERE id = ?`, [
    JSON.stringify(bankDetails),
    vendorId,
  ]);

  sendSuccess(res, bankDetails, "Bank details updated successfully");
});

export default {
  getDashboardStats,
  getProperties,
  getBookings,
  getSettlements,
  getAnalytics,
  updateBankDetails,
};
