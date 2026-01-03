import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";

/**
 * @route   GET /api/employee/dashboard
 * @desc    Get employee dashboard statistics
 * @access  Private (Employee only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;

  // Get total points
  const [pointsResult] = await db.query(
    `SELECT 
      COALESCE(SUM(CASE WHEN status = 'confirmed' THEN points ELSE 0 END), 0) as total_points,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN points ELSE 0 END), 0) as pending_points,
      COALESCE(SUM(CASE WHEN status = 'redeemed' THEN points ELSE 0 END), 0) as redeemed_points
    FROM employee_points
    WHERE employee_id = ?`,
    [employeeId]
  );

  // Get pending claims count
  const [claimsResult] = await db.query(
    `SELECT COUNT(*) as pending_claims
    FROM employee_claims
    WHERE employee_id = ? AND status = 'pending'`,
    [employeeId]
  );

  const stats = {
    total_points: parseFloat(pointsResult[0].total_points),
    pending_points: parseFloat(pointsResult[0].pending_points),
    redeemed_points: parseFloat(pointsResult[0].redeemed_points),
    pending_claims: claimsResult[0].pending_claims,
  };

  sendSuccess(res, stats, "Dashboard stats retrieved successfully");
});

/**
 * @route   GET /api/employee/points
 * @desc    Get employee points history
 * @access  Private (Employee only)
 */
const getPoints = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      ep.id,
      ep.points,
      ep.status,
      ep.created_at,
      b.id as booking_id,
      b.check_in as booking_check_in,
      b.check_out as booking_check_out,
      b.total_amount as booking_amount,
      p.title as property_title,
      p.id as property_id
    FROM employee_points ep
    LEFT JOIN bookings b ON ep.booking_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE ep.employee_id = ?
  `;

  const params = [employeeId];

  if (status) {
    query += ` AND ep.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY ep.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [points] = await db.query(query, params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM employee_points WHERE employee_id = ?`;
  const countParams = [employeeId];

  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  sendSuccess(res, {
    points,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   GET /api/employee/claims
 * @desc    Get employee claims history
 * @access  Private (Employee only)
 */
const getClaims = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      id,
      points_claimed,
      payout_details,
      status,
      payment_proof,
      created_at,
      processed_at
    FROM employee_claims
    WHERE employee_id = ?
  `;

  const params = [employeeId];

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [claims] = await db.query(query, params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM employee_claims WHERE employee_id = ?`;
  const countParams = [employeeId];

  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  sendSuccess(res, {
    claims,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   POST /api/employee/claims
 * @desc    Create a new claim
 * @access  Private (Employee only)
 */
const createClaim = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { points_claimed, payout_details } = req.body;

  // Validate points_claimed
  if (!points_claimed || points_claimed <= 0) {
    return sendError(res, "Invalid points claimed", 400);
  }

  // Check if employee has enough confirmed points
  const [pointsCheck] = await db.query(
    `SELECT COALESCE(SUM(points), 0) as available_points
    FROM employee_points
    WHERE employee_id = ? AND status = 'confirmed'`,
    [employeeId]
  );

  const availablePoints = parseFloat(pointsCheck[0].available_points);

  if (availablePoints < points_claimed) {
    return sendError(
      res,
      `Insufficient points. You have ${availablePoints} available.`,
      400
    );
  }

  // Create claim
  const claimId = require("crypto").randomUUID();

  await db.query(
    `INSERT INTO employee_claims (id, employee_id, points_claimed, payout_details, status)
    VALUES (?, ?, ?, ?, 'pending')`,
    [claimId, employeeId, points_claimed, JSON.stringify(payout_details)]
  );

  sendSuccess(res, { id: claimId }, "Claim created successfully", 201);
});

/**
 * @route   GET /api/employee/properties
 * @desc    Get properties associated with employee
 * @access  Private (Employee only)
 */
const getProperties = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;

  const [properties] = await db.query(
    `SELECT 
      p.id,
      p.title,
      p.description,
      p.price_per_night,
      p.status,
      p.created_at,
      c.name as city_name,
      v.name as vendor_name,
      (SELECT COUNT(*) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_bookings,
      (SELECT SUM(total_amount) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_revenue
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE p.employee_id = ?
    ORDER BY p.created_at DESC`,
    [employeeId]
  );

  sendSuccess(res, properties);
});

export default {
  getDashboardStats,
  getPoints,
  getClaims,
  createClaim,
  getProperties,
};
