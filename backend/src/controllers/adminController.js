import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import {
  sendCancellationEmail,
  sendRefundEmail,
} from "../services/emailService.js";
import { sanitizeRichText } from "../utils/sanitize.js";
import Razorpay from "razorpay";

// Initialize Razorpay for refunds
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===================================================================
// IN-MEMORY CACHE FOR DROPDOWN DATA (SESSION 17 - PERFORMANCE OPTIMIZATION)
// ===================================================================
const cache = {
  cities: { data: null, timestamp: null },
  vendors: { data: null, timestamp: null },
  employees: { data: null, timestamp: null },
};

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const isCacheValid = (cacheEntry) => {
  if (!cacheEntry.data || !cacheEntry.timestamp) return false;
  return Date.now() - cacheEntry.timestamp < CACHE_TTL;
};

// Get all bookings (with filters)
export const getAllBookings = asyncHandler(async (req, res) => {
  const {
    status,
    property_id,
    user_id,
    from_date,
    to_date,
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

  // Count total
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    "SELECT COUNT(*) as total FROM"
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
    200
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
    [booking_id]
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
      400
    );
  }

  // Get payment details
  const [payments] = await db.query(
    'SELECT * FROM payments WHERE booking_id = ? AND status = "success" ORDER BY created_at DESC LIMIT 1',
    [booking_id]
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
    ]
  );

  // Update booking status
  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [
    booking_id,
  ]);

  // Initiate actual refund with Razorpay
  try {
    // Get Razorpay payment ID from gateway_payment_id
    const razorpayPaymentId = payment.gateway_payment_id;

    if (!razorpayPaymentId) {
      throw new Error("Razorpay payment ID not found");
    }

    // Create refund in Razorpay
    const razorpayRefund = await razorpay.payments.refund(razorpayPaymentId, {
      amount: Math.round(refundAmount * 100), // Amount in paise
      speed: "normal", // 'normal' or 'optimum'
      notes: {
        booking_id: booking_id,
        refund_id: refundId,
        refund_percentage: refund_percentage,
      },
      receipt: `refund_${refundId.substring(0, 8)}`,
    });

    // Update refund record with Razorpay refund ID and mark as completed
    await db.query(
      'UPDATE refunds SET status = "completed", gateway_refund_id = ? WHERE id = ?',
      [razorpayRefund.id, refundId]
    );

    console.log(`✅ Refund processed successfully: ${razorpayRefund.id}`);
  } catch (error) {
    console.error("❌ Razorpay refund failed:", error);

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
      ]
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
    ]
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
    ]
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
    ]
  );

  sendSuccess(
    res,
    { refund_id: refundId, refund_amount: refundAmount },
    "Refund processed successfully",
    200
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
    "SELECT COUNT(*) as total FROM"
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY vs.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [settlements] = await db.query(query, params);

  sendSuccess(
    res,
    {
      settlements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Vendor settlements fetched successfully",
    200
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
    [settlement_id]
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
    [payment_proof || null, settlement_id]
  );

  // Create notification for vendor
  await db.query(
    "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
    [
      generateUUID(),
      settlement.vendor_id,
      "vendor",
      "Settlement Paid",
      `Your settlement of ₹${settlement.amount} has been paid`,
    ]
  );

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
    ]
  );

  sendSuccess(res, null, "Settlement marked as paid successfully", 200);
});

// Get employee claims
export const getEmployeeClaims = asyncHandler(async (req, res) => {
  const { employee_id, status, page = 1, limit = 20 } = req.query;

  let query = `
    SELECT 
      ec.*,
      e.name as employee_name,
      e.email as employee_email,
      e.phone as employee_phone
    FROM employee_claims ec
    INNER JOIN employees e ON ec.employee_id = e.id
    WHERE 1=1
  `;

  const params = [];

  if (employee_id) {
    query += ` AND ec.employee_id = ?`;
    params.push(employee_id);
  }

  if (status) {
    query += ` AND ec.status = ?`;
    params.push(status);
  }

  // Search filter
  if (req.query.search) {
    query += ` AND (e.name LIKE ? OR e.email LIKE ?)`;
    params.push(`%${req.query.search}%`, `%${req.query.search}%`);
  }

  // Count total
  const countQuery = query.replace(
    /SELECT[\s\S]*?FROM/,
    "SELECT COUNT(*) as total FROM"
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult && countResult[0] ? countResult[0].total : 0;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY ec.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [claims] = await db.query(query, params);

  sendSuccess(
    res,
    {
      claims,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Employee claims fetched successfully",
    200
  );
});

// Process employee claim
export const processEmployeeClaim = asyncHandler(async (req, res) => {
  const { claim_id, action, payment_proof, remarks } = req.body;
  const adminId = req.user.id;

  if (!claim_id || !action) {
    return sendError(res, "Claim ID and action are required", 400);
  }

  if (!["approve", "reject", "pay"].includes(action)) {
    return sendError(res, "Action must be approve, reject, or pay", 400);
  }

  // Get claim
  const [claims] = await db.query(
    "SELECT * FROM employee_claims WHERE id = ?",
    [claim_id]
  );

  if (claims.length === 0) {
    return sendError(res, "Claim not found", 404);
  }

  const claim = claims[0];

  let newStatus;
  let message;

  switch (action) {
    case "approve":
      if (claim.status !== "pending") {
        return sendError(res, "Only pending claims can be approved", 400);
      }
      newStatus = "approved";
      message = "Claim approved successfully";
      break;

    case "reject":
      if (claim.status !== "pending") {
        return sendError(res, "Only pending claims can be rejected", 400);
      }
      newStatus = "rejected";
      message = "Claim rejected";
      break;

    case "pay":
      if (claim.status !== "approved") {
        return sendError(
          res,
          "Only approved claims can be marked as paid",
          400
        );
      }
      if (!payment_proof) {
        return sendError(res, "Payment proof is required", 400);
      }
      newStatus = "paid";
      message = "Claim marked as paid successfully";
      break;
  }

  // Update claim
  await db.query(
    "UPDATE employee_claims SET status = ?, payment_proof = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?",
    [newStatus, payment_proof || claim.payment_proof, claim_id]
  );

  // If paid, mark points as redeemed
  if (action === "pay") {
    await db.query(
      'UPDATE employee_points SET status = "redeemed" WHERE employee_id = ? AND status = "confirmed" AND points <= ?',
      [claim.employee_id, claim.points_claimed]
    );
  }

  // Create notification for employee
  await db.query(
    "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
    [
      generateUUID(),
      claim.employee_id,
      "employee",
      `Claim ${newStatus}`,
      `Your claim for ₹${claim.points_claimed} has been ${newStatus}`,
    ]
  );

  // Log activity
  await db.query(
    "INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) VALUES (?, ?, ?, ?, ?, ?)",
    [
      generateUUID(),
      adminId,
      "admin",
      `${action} employee claim`,
      "employee_claim",
      claim_id,
    ]
  );

  sendSuccess(res, null, message, 200);
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

  // Pending claims
  const [claimStats] = await db.query(`
    SELECT 
      COUNT(*) as pending_claims,
      COALESCE(SUM(points_claimed), 0) as pending_amount
    FROM employee_claims
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
      pending_employee_claims: claimStats[0].pending_claims,
      pending_employee_amount: claimStats[0].pending_amount,
    },
    "Dashboard statistics fetched successfully",
    200
  );
});

// ============ PROPERTIES MANAGEMENT ============

// Get all properties with filters
export const getAllProperties = asyncHandler(async (req, res) => {
  const {
    status,
    city_id,
    vendor_id,
    search,
    page = 1,
    limit = 20,
  } = req.query;

  let query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.price_per_night,
      p.gst_percentage,
      p.status,
      p.created_at,
      c.name as city_name,
      c.state as city_state,
      v.name as vendor_name,
      v.email as vendor_email,
      v.phone as vendor_phone,
      e.name as employee_name,
      e.email as employee_email,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY sort_order LIMIT 1) as thumbnail,
      (SELECT COUNT(*) FROM property_images WHERE property_id = p.id) as image_count
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN employees e ON p.employee_id = e.id
    WHERE p.deleted_at IS NULL
  `;

  const params = [];

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (city_id) {
    query += ` AND p.city_id = ?`;
    params.push(city_id);
  }

  if (vendor_id) {
    query += ` AND p.vendor_id = ?`;
    params.push(vendor_id);
  }

  if (search) {
    query += ` AND (p.title LIKE ? OR p.description LIKE ? OR v.name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  // Count total
  const countQuery = query.replace(
    /SELECT.*FROM/,
    "SELECT COUNT(*) as total FROM"
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult[0].total;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [properties] = await db.query(query, params);

  sendSuccess(
    res,
    {
      properties,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Properties fetched successfully",
    200
  );
});

// Get property details for admin
export const getPropertyDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [properties] = await db.query(
    `
    SELECT 
      p.*,
      c.name as city_name,
      c.state as city_state,
      v.name as vendor_name,
      v.email as vendor_email,
      v.phone as vendor_phone,
      v.gst_number as vendor_gst,
      e.name as employee_name,
      e.email as employee_email,
      e.phone as employee_phone
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    LEFT JOIN employees e ON p.employee_id = e.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `,
    [id]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  // Get images
  const [images] = await db.query(
    `SELECT id, image_url, sort_order FROM property_images WHERE property_id = ? ORDER BY sort_order`,
    [id]
  );

  // Get blackout dates
  const [blackoutDates] = await db.query(
    `SELECT id, start_date, end_date, reason, created_by, created_at 
     FROM property_blackout_dates 
     WHERE property_id = ? 
     ORDER BY start_date DESC`,
    [id]
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
    [id]
  );

  const property = {
    ...properties[0],
    images,
    blackout_dates: blackoutDates,
    booking_stats: bookingStats[0],
  };

  sendSuccess(res, property, "Property details fetched successfully", 200);
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
    [id]
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
    [req.user.id, `Property status changed to ${status}`, id]
  );

  // If rejected and reason provided, could store in change_requests or notifications
  if (status === "inactive" && rejection_reason) {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, 'vendor', ?, ?, NOW())`,
      [
        property[0].vendor_id,
        "Property Status Updated",
        `Your property has been marked as inactive. Reason: ${rejection_reason}`,
      ]
    );
  }

  // If approved, send notification
  if (status === "approved") {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, 'vendor', ?, ?, NOW())`,
      [
        property[0].vendor_id,
        "Property Approved",
        "Your property has been approved and is now live on the platform!",
      ]
    );
  }

  sendSuccess(res, null, `Property status updated to ${status}`, 200);
});

// Get property statistics
export const getPropertyStats = asyncHandler(async (req, res) => {
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

  sendSuccess(res, stats[0], "Property statistics fetched successfully", 200);
});

// ================== USER MANAGEMENT ==================

// Get all users with filters and pagination
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role = "",
    status = "",
    search = "",
    page = 1,
    limit = 1000,
  } = req.query;

  const offset = (page - 1) * limit;
  let conditions = ["u.deleted_at IS NULL"];
  let params = [];

  // Status filter (active/blocked)
  if (status && status !== "all") {
    if (status === "active") {
      conditions.push("u.status = 'active'");
    } else if (status === "blocked") {
      conditions.push("u.status = 'blocked'");
    }
  }

  // Search filter
  if (search.trim()) {
    conditions.push("(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  const whereClause = conditions.join(" AND ");

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM users u WHERE ${whereClause}`,
    params
  );

  // Get users with additional info
  const [users] = await db.query(
    `SELECT 
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      u.created_at,
      (SELECT COUNT(*) FROM bookings WHERE user_id = u.id) as total_bookings,
      (SELECT COUNT(*) FROM bookings WHERE user_id = u.id AND status = 'completed') as completed_bookings,
      (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE user_id = u.id AND status = 'completed') as total_spent
    FROM users u
    WHERE ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?`,
    [...params, parseInt(limit), parseInt(offset)]
  );

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

  // Get user details
  const [users] = await db.query(
    `SELECT 
      u.id,
      u.full_name,
      u.email,
      u.phone,
      u.status,
      u.created_at
    FROM users u
    WHERE u.id = ? AND u.deleted_at IS NULL`,
    [id]
  );

  if (users.length === 0) {
    return sendError(res, "User not found", 404);
  }

  const user = users[0];

  // Get booking history
  const [bookings] = await db.query(
    `SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.total_amount,
      b.status,
      b.created_at,
      p.title as property_title,
      p.thumbnail,
      c.name as city_name
    FROM bookings b
    JOIN properties p ON b.property_id = p.id
    LEFT JOIN cities c ON p.city_id = c.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
    LIMIT 10`,
    [id]
  );

  // Get activity statistics
  const [stats] = await db.query(
    `SELECT 
      COUNT(*) as total_bookings,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN status IN ('cancelled', 'cancel_requested') THEN 1 ELSE 0 END) as cancelled_bookings,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_spent
    FROM bookings
    WHERE user_id = ?`,
    [id]
  );

  sendSuccess(
    res,
    {
      user,
      bookings,
      stats: stats[0],
    },
    "User details fetched successfully",
    200
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

  // Check if user exists
  const [user] = await db.query(
    "SELECT id, name, email, status FROM users WHERE id = ? AND deleted_at IS NULL",
    [id]
  );

  if (user.length === 0) {
    return sendError(res, "User not found", 404);
  }

  // Prevent self-blocking
  if (req.user.id === id && status === "blocked") {
    return sendError(res, "You cannot block yourself", 400);
  }

  // Update user status
  await db.query(
    "UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?",
    [status, id]
  );

  // Create activity log
  const action =
    status === "blocked"
      ? `Blocked user: ${user[0].name} (${user[0].email})${
          reason ? `. Reason: ${reason}` : ""
        }`
      : `Unblocked user: ${user[0].name} (${user[0].email})`;

  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity_type, entity_id, created_at)
     VALUES (UUID(), ?, ?, ?, 'user', ?, NOW())`,
    [req.user.id, req.user.role, action, id]
  );

  // Send notification to user
  if (status === "blocked") {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, 'customer', ?, ?, NOW())`,
      [
        id,
        "Account Blocked",
        reason
          ? `Your account has been blocked. Reason: ${reason}`
          : "Your account has been blocked. Please contact support for more information.",
      ]
    );
  } else if (status === "active") {
    await db.query(
      `INSERT INTO notifications (id, recipient_id, recipient_role, title, message, created_at)
       VALUES (UUID(), ?, 'customer', ?, ?, NOW())`,
      [
        id,
        "Account Activated",
        "Your account has been reactivated. You can now access the platform.",
      ]
    );
  }

  sendSuccess(res, null, `User status updated to ${status}`, 200);
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
    SELECT COUNT(*) as total_vendors
    FROM vendors
    WHERE deleted_at IS NULL
  `);

  const [employeeStats] = await db.query(`
    SELECT COUNT(*) as total_employees
    FROM employees
    WHERE deleted_at IS NULL
  `);

  const stats = {
    total_users: userStats[0].total_users,
    active_users: userStats[0].active_users,
    blocked_users: userStats[0].blocked_users,
    vendors: vendorStats[0].total_vendors,
    employees: employeeStats[0].total_employees,
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
    [startDate, endDate]
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
    [dateFormat, startDate, endDate]
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
    [startDate, endDate]
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
    [startDate, endDate]
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
    200
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
    [startDate, endDate]
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
    [startDate, endDate]
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
    [startDate, endDate]
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
    [startDate, endDate]
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
    200
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
      DATE(created_at) as date,
      COUNT(*) as new_users
    FROM users
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND deleted_at IS NULL
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `,
    [startDate, endDate]
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
    [startDate, endDate]
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
    [startDate, endDate]
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

  const [employeesCount] = await db.query(`
    SELECT COUNT(*) as count, 'employee' as user_type,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
    FROM employees
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
    {
      role: "employee",
      count: employeesCount[0].count,
      active: employeesCount[0].active,
      inactive: employeesCount[0].inactive,
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
    200
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
    [startDate, endDate]
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
    [startDate, endDate]
  );

  // Get new property additions
  const [newProperties] = await db.query(
    `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_properties
    FROM properties
    WHERE DATE(created_at) BETWEEN ? AND ?
    AND deleted_at IS NULL
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `,
    [startDate, endDate]
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
    200
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
    [startDate, endDate]
  );

  sendSuccess(
    res,
    {
      vendor_stats: vendorStats,
      filters: { start_date: startDate, end_date: endDate },
    },
    "Vendor performance report fetched successfully",
    200
  );
});

// Get employee performance report
export const getEmployeePerformance = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;

  const endDate = end_date || new Date().toISOString().split("T")[0];
  const startDate =
    start_date ||
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [employeeStats] = await db.query(
    `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.phone,
      e.incentive_percentage,
      COUNT(DISTINCT p.id) as managed_properties,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as total_booking_value,
      COALESCE(SUM(CASE WHEN ep.status = 'confirmed' THEN ep.points END), 0) as earned_points,
      COALESCE(SUM(CASE WHEN ec.status IN ('approved', 'paid') THEN ec.points_claimed END), 0) as claimed_points,
      COALESCE(SUM(CASE WHEN ep.status = 'confirmed' THEN ep.points END), 0) - 
      COALESCE(SUM(CASE WHEN ec.status IN ('approved', 'paid') THEN ec.points_claimed END), 0) as pending_points
    FROM employees e
    LEFT JOIN properties p ON e.id = p.employee_id AND p.deleted_at IS NULL
    LEFT JOIN bookings b ON p.id = b.property_id AND DATE(b.created_at) BETWEEN ? AND ?
    LEFT JOIN employee_points ep ON e.id = ep.employee_id
    LEFT JOIN employee_claims ec ON e.id = ec.employee_id
    WHERE e.deleted_at IS NULL
    GROUP BY e.id, e.name, e.email, e.phone, e.incentive_percentage
    ORDER BY earned_points DESC
  `,
    [startDate, endDate]
  );

  sendSuccess(
    res,
    {
      employee_stats: employeeStats,
      filters: { start_date: startDate, end_date: endDate },
    },
    "Employee performance report fetched successfully",
    200
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
      200
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

// Get all vendors (for dropdown) - WITH CACHING
export const getAllVendors = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.vendors)) {
    return sendSuccess(
      res,
      cache.vendors.data,
      "Vendors fetched successfully (cached)",
      200
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

// Get all employees (for dropdown) - WITH CACHING
export const getAllEmployees = asyncHandler(async (req, res) => {
  // Check cache first
  if (isCacheValid(cache.employees)) {
    return sendSuccess(
      res,
      cache.employees.data,
      "Employees fetched successfully (cached)",
      200
    );
  }

  // Cache miss - fetch from database
  const [employees] = await db.query(`
    SELECT id, name, email, phone, incentive_percentage, status
    FROM employees
    WHERE deleted_at IS NULL AND status = 'active'
    ORDER BY name ASC
  `);

  // Update cache
  cache.employees = {
    data: employees,
    timestamp: Date.now(),
  };

  sendSuccess(res, employees, "Employees fetched successfully", 200);
});

// Create new property
export const createProperty = asyncHandler(async (req, res) => {
  const {
    vendor_id,
    employee_id,
    city_id,
    title,
    property_type,
    description,
    address,
    city,
    state,
    pincode,
    bedrooms,
    bathrooms,
    max_guests,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
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
    check_in_guidelines,
    house_rules_text,
    amenities_guide,
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
    gst_percentage,
    status,
  } = req.body;

  // Validation
  if (!title || !vendor_id || !city_id || !price_per_night) {
    return sendError(res, "Title, vendor, city, and price are required", 400);
  }

  // ============================================
  // CRITICAL FIX: XSS PROTECTION
  // Sanitize all rich text fields to prevent script injection
  // ============================================
  const safeCheckInGuidelines = check_in_guidelines
    ? sanitizeRichText(check_in_guidelines)
    : null;
  const safeHouseRulesText = house_rules_text
    ? sanitizeRichText(house_rules_text)
    : null;
  const safeAmenitiesGuide = amenities_guide
    ? sanitizeRichText(amenities_guide)
    : null;
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
      id, vendor_id, employee_id, city_id, title, property_type, description,
      address, city, state, pincode, bedrooms, bathrooms, max_guests,
      min_guests, extra_guest_charge, min_children, max_children, extra_child_charge,
      primary_incharge_name, primary_incharge_phone, primary_incharge_email,
      primary_incharge_whatsapp, primary_incharge_alt_contact,
      secondary_incharge_name, secondary_incharge_phone, secondary_incharge_email,
      secondary_incharge_whatsapp, secondary_incharge_alt_contact,
      check_in_guidelines, house_rules_text, amenities_guide,
      safety_information, local_area_info, emergency_contacts,
      same_day_booking_allowed, max_booking_days,
      check_in_time, check_out_time, amenities, house_rules,
      cancellation_policy, photos, price_per_night, gst_percentage, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?,
      ?, ?, ?,
      ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `;

  const values = [
    propertyId,
    vendor_id,
    employee_id || null,
    city_id,
    title,
    property_type || "Villa",
    description || null,
    address || null,
    city || null,
    state || null,
    pincode || null,
    bedrooms || 0,
    bathrooms || 0,
    max_guests || 2,
    min_guests || 1,
    extra_guest_charge || 0,
    min_children || 0,
    max_children || 5,
    extra_child_charge || 0,
    primary_incharge_name || null,
    primary_incharge_phone || null,
    primary_incharge_email || null,
    primary_incharge_whatsapp || null,
    primary_incharge_alt_contact || null,
    secondary_incharge_name || null,
    secondary_incharge_phone || null,
    secondary_incharge_email || null,
    secondary_incharge_whatsapp || null,
    secondary_incharge_alt_contact || null,
    safeCheckInGuidelines,
    safeHouseRulesText,
    safeAmenitiesGuide,
    safeSafetyInfo,
    safeLocalAreaInfo,
    safeEmergencyContacts,
    same_day_booking_allowed || false,
    max_booking_days || null,
    check_in_time || "2:00 PM",
    check_out_time || "11:00 AM",
    amenities || "[]",
    house_rules || "{}",
    cancellation_policy || "{}",
    photos || "[]",
    price_per_night,
    gst_percentage || 18,
    status || "draft",
  ];

  await db.query(query, values);

  sendSuccess(res, { id: propertyId }, "Property created successfully", 201);
});

// Update existing property
export const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    vendor_id,
    employee_id,
    city_id,
    title,
    property_type,
    description,
    address,
    city,
    state,
    pincode,
    bedrooms,
    bathrooms,
    max_guests,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
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
    check_in_guidelines,
    house_rules_text,
    amenities_guide,
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
    gst_percentage,
    status,
  } = req.body;

  // Check if property exists
  const [existing] = await db.query(
    "SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL",
    [id]
  );

  if (!existing || existing.length === 0) {
    return sendError(res, "Property not found", 404);
  }

  // ============================================
  // CRITICAL FIX: XSS PROTECTION
  // Sanitize all rich text fields to prevent script injection
  // ============================================
  const safeCheckInGuidelines = check_in_guidelines
    ? sanitizeRichText(check_in_guidelines)
    : null;
  const safeHouseRulesText = house_rules_text
    ? sanitizeRichText(house_rules_text)
    : null;
  const safeAmenitiesGuide = amenities_guide
    ? sanitizeRichText(amenities_guide)
    : null;
  const safeSafetyInfo = safety_information
    ? sanitizeRichText(safety_information)
    : null;
  const safeLocalAreaInfo = local_area_info
    ? sanitizeRichText(local_area_info)
    : null;
  const safeEmergencyContacts = emergency_contacts
    ? sanitizeRichText(emergency_contacts)
    : null;

  const query = `
    UPDATE properties SET
      vendor_id = ?,
      employee_id = ?,
      city_id = ?,
      title = ?,
      property_type = ?,
      description = ?,
      address = ?,
      city = ?,
      state = ?,
      pincode = ?,
      bedrooms = ?,
      bathrooms = ?,
      max_guests = ?,
      min_guests = ?,
      extra_guest_charge = ?,
      min_children = ?,
      max_children = ?,
      extra_child_charge = ?,
      primary_incharge_name = ?,
      primary_incharge_phone = ?,
      primary_incharge_email = ?,
      primary_incharge_whatsapp = ?,
      primary_incharge_alt_contact = ?,
      secondary_incharge_name = ?,
      secondary_incharge_phone = ?,
      secondary_incharge_email = ?,
      secondary_incharge_whatsapp = ?,
      secondary_incharge_alt_contact = ?,
      check_in_guidelines = ?,
      house_rules_text = ?,
      amenities_guide = ?,
      safety_information = ?,
      local_area_info = ?,
      emergency_contacts = ?,
      same_day_booking_allowed = ?,
      max_booking_days = ?,
      check_in_time = ?,
      check_out_time = ?,
      amenities = ?,
      house_rules = ?,
      cancellation_policy = ?,
      photos = ?,
      price_per_night = ?,
      gst_percentage = ?,
      status = ?
    WHERE id = ? AND deleted_at IS NULL
  `;

  const values = [
    vendor_id,
    employee_id || null,
    city_id,
    title,
    property_type,
    description,
    address,
    city,
    state,
    pincode,
    bedrooms,
    bathrooms,
    max_guests,
    min_guests,
    extra_guest_charge,
    min_children,
    max_children,
    extra_child_charge,
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
    safeCheckInGuidelines,
    safeHouseRulesText,
    safeAmenitiesGuide,
    safeSafetyInfo,
    safeLocalAreaInfo,
    safeEmergencyContacts,
    same_day_booking_allowed,
    max_booking_days,
    check_in_time,
    check_out_time,
    amenities,
    house_rules,
    cancellation_policy,
    photos,
    price_per_night,
    gst_percentage,
    status,
    id,
  ];

  await db.query(query, values);

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
    [id]
  );

  if (activeBookings[0].count > 0) {
    return sendError(res, "Cannot delete property with active bookings", 400);
  }

  await db.query("UPDATE properties SET deleted_at = NOW() WHERE id = ?", [id]);

  sendSuccess(res, null, "Property deleted successfully", 200);
});
