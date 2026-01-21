import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * @route   GET /api/admin/coupons
 * @desc    Get all coupons with pagination and filtering
 * @access  Private (Admin)
 */
export const getAllCoupons = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;

  let statusFilter = "";
  let searchFilter = "";
  const params = [];

  if (status && ["active", "inactive"].includes(status)) {
    statusFilter = "AND status = ?";
    params.push(status);
  }

  if (search) {
    searchFilter = "AND code LIKE ?";
    params.push(`%${search}%`);
  }

  params.push(parseInt(limit), parseInt(offset));

  const [coupons] = await db.query(
    `SELECT 
      id, code, discount_type, discount_value, max_discount,
      min_booking_amount, start_date, end_date, usage_limit, status,
      (SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = coupons.id) as times_used
    FROM coupons 
    WHERE 1=1 ${statusFilter} ${searchFilter}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?`,
    params
  );

  // Get total count
  const countParams = [];
  if (status) countParams.push(status);
  if (search) countParams.push(`%${search}%`);

  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM coupons 
     WHERE 1=1 ${statusFilter} ${searchFilter}`,
    countParams
  );

  sendSuccess(res, "Coupons retrieved successfully", {
    coupons,
    pagination: {
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit),
    },
  });
});

/**
 * @route   GET /api/admin/coupons/:id
 * @desc    Get single coupon details with usage statistics
 * @access  Private (Admin)
 */
export const getCouponDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [coupons] = await db.query(`SELECT * FROM coupons WHERE id = ?`, [id]);

  if (coupons.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // Get usage statistics
  const [usageStats] = await db.query(
    `SELECT 
      COUNT(*) as total_uses,
      SUM(b.total_amount) as total_booking_value,
      SUM(b.discount_amount) as total_discount_given
    FROM coupon_usages cu
    LEFT JOIN bookings b ON cu.booking_id = b.id
    WHERE cu.coupon_id = ?`,
    [id]
  );

  // Get recent usages
  const [recentUsages] = await db.query(
    `SELECT 
      cu.used_at,
      u.full_name as user_name,
      u.email as user_email,
      b.total_amount as booking_amount,
      b.discount_amount
    FROM coupon_usages cu
    LEFT JOIN users u ON cu.user_id = u.id
    LEFT JOIN bookings b ON cu.booking_id = b.id
    WHERE cu.coupon_id = ?
    ORDER BY cu.used_at DESC
    LIMIT 10`,
    [id]
  );

  sendSuccess(res, "Coupon details retrieved successfully", {
    coupon: coupons[0],
    usage_stats: usageStats[0],
    recent_usages: recentUsages,
  });
});

/**
 * @route   POST /api/admin/coupons
 * @desc    Create new coupon
 * @access  Private (Admin)
 */
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discount_type,
    discount_value,
    max_discount,
    min_booking_amount,
    start_date,
    end_date,
    usage_limit,
  } = req.body;

  // Validate required fields
  if (!code || !discount_type || !discount_value) {
    return sendError(
      res,
      "Code, discount type, and discount value are required",
      400
    );
  }

  // Validate discount type
  if (!["percentage", "flat"].includes(discount_type)) {
    return sendError(res, "Discount type must be 'percentage' or 'flat'", 400);
  }

  // Check if coupon code already exists
  const [existingCoupons] = await db.query(
    `SELECT id FROM coupons WHERE code = ?`,
    [code.toUpperCase()]
  );

  if (existingCoupons.length > 0) {
    return sendError(res, "Coupon code already exists", 400);
  }

  // Insert coupon
  const couponId = generateUUID();
  await db.query(
    `INSERT INTO coupons (
      id, code, discount_type, discount_value, max_discount,
      min_booking_amount, start_date, end_date, usage_limit, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
    [
      couponId,
      code.toUpperCase(),
      discount_type,
      discount_value,
      max_discount || null,
      min_booking_amount || 0,
      start_date,
      end_date,
      usage_limit || null,
    ]
  );

  sendSuccess(res, "Coupon created successfully", { couponId }, 201);
});

/**
 * @route   PATCH /api/admin/coupons/:id
 * @desc    Update coupon
 * @access  Private (Admin)
 */
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    discount_type,
    discount_value,
    max_discount,
    min_booking_amount,
    start_date,
    end_date,
    usage_limit,
    status,
  } = req.body;

  // Check if coupon exists
  const [coupons] = await db.query(`SELECT id FROM coupons WHERE id = ?`, [id]);

  if (coupons.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // If updating code, check for duplicates
  if (code) {
    const [existingCoupons] = await db.query(
      `SELECT id FROM coupons WHERE code = ? AND id != ?`,
      [code.toUpperCase(), id]
    );

    if (existingCoupons.length > 0) {
      return sendError(res, "Coupon code already exists", 400);
    }
  }

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (code) {
    updates.push("code = ?");
    params.push(code.toUpperCase());
  }
  if (discount_type) {
    updates.push("discount_type = ?");
    params.push(discount_type);
  }
  if (discount_value !== undefined) {
    updates.push("discount_value = ?");
    params.push(discount_value);
  }
  if (max_discount !== undefined) {
    updates.push("max_discount = ?");
    params.push(max_discount);
  }
  if (min_booking_amount !== undefined) {
    updates.push("min_booking_amount = ?");
    params.push(min_booking_amount);
  }
  if (start_date) {
    updates.push("start_date = ?");
    params.push(start_date);
  }
  if (end_date) {
    updates.push("end_date = ?");
    params.push(end_date);
  }
  if (usage_limit !== undefined) {
    updates.push("usage_limit = ?");
    params.push(usage_limit);
  }
  if (status && ["active", "inactive"].includes(status)) {
    updates.push("status = ?");
    params.push(status);
  }

  if (updates.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  params.push(id);

  await db.query(
    `UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`,
    params
  );

  sendSuccess(res, "Coupon updated successfully");
});

/**
 * @route   DELETE /api/admin/coupons/:id
 * @desc    Deactivate coupon (soft delete)
 * @access  Private (Admin)
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if coupon exists
  const [coupons] = await db.query(`SELECT id FROM coupons WHERE id = ?`, [id]);

  if (coupons.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // Deactivate coupon
  await db.query(`UPDATE coupons SET status = 'inactive' WHERE id = ?`, [id]);

  sendSuccess(res, "Coupon deactivated successfully");
});

/**
 * @route   GET /api/admin/coupons/:id/usage
 * @desc    Get detailed usage statistics for a coupon
 * @access  Private (Admin)
 */
export const getCouponUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if coupon exists
  const [coupons] = await db.query(
    `SELECT code, usage_limit FROM coupons WHERE id = ?`,
    [id]
  );

  if (coupons.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // Get all usages with details
  const [usages] = await db.query(
    `SELECT 
      cu.used_at,
      u.full_name as user_name,
      u.email as user_email,
      u.phone as user_phone,
      b.id as booking_id,
      b.check_in,
      b.check_out,
      b.total_amount as booking_amount,
      b.discount_amount,
      p.title as property_title
    FROM coupon_usages cu
    LEFT JOIN users u ON cu.user_id = u.id
    LEFT JOIN bookings b ON cu.booking_id = b.id
    LEFT JOIN properties p ON b.property_id = p.id
    WHERE cu.coupon_id = ?
    ORDER BY cu.used_at DESC`,
    [id]
  );

  // Get summary statistics
  const [summary] = await db.query(
    `SELECT 
      COUNT(*) as total_uses,
      COUNT(DISTINCT cu.user_id) as unique_users,
      SUM(b.total_amount) as total_booking_value,
      SUM(b.discount_amount) as total_discount_given,
      AVG(b.total_amount) as avg_booking_value,
      MAX(cu.used_at) as last_used
    FROM coupon_usages cu
    LEFT JOIN bookings b ON cu.booking_id = b.id
    WHERE cu.coupon_id = ?`,
    [id]
  );

  sendSuccess(res, "Coupon usage retrieved successfully", {
    coupon_code: coupons[0].code,
    usage_limit: coupons[0].usage_limit,
    summary: summary[0],
    usages,
  });
});
