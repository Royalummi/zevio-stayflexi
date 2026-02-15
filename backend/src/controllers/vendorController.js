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

  // Get total properties
  const [propertiesCount] = await db.query(
    `SELECT COUNT(*) as total_properties,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as active_properties
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

  // Get pending settlements
  const [settlementsData] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as pending_settlements
    FROM vendor_settlements
    WHERE vendor_id = ? AND status = 'pending'`,
    [vendorId],
  );

  const stats = {
    total_properties: propertiesCount[0].total_properties,
    active_properties: propertiesCount[0].active_properties,
    active_bookings: bookingsData[0].active_bookings,
    total_revenue: parseFloat(bookingsData[0].total_revenue),
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
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.status,
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

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [properties] = await db.query(query, params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM properties WHERE vendor_id = ? AND deleted_at IS NULL`;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  sendSuccess(res, {
    properties,
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

  sendSuccess(res, {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
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
      b.id as booking_id,
      p.title as property_title
    FROM vendor_settlements vs
    LEFT JOIN bookings b ON vs.booking_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
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

  sendSuccess(res, {
    settlements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
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
  const [bookingTrends] = await db.query(
    `SELECT 
      DATE_FORMAT(b.created_at, '%Y-%m') as month,
      COUNT(*) as bookings,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ? AND b.status IN ('confirmed', 'completed')
    GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12`,
    [vendorId],
  );

  sendSuccess(res, {
    revenue_by_property: revenueByProperty,
    booking_trends: bookingTrends,
  });
});

export default {
  getDashboardStats,
  getProperties,
  getBookings,
  getSettlements,
  getAnalytics,
};
