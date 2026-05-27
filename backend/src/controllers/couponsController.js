/**
 * SESSION 64: COUPON SYSTEM
 * Complete coupon management and validation APIs
 * Features: Percentage, Flat, First-Time user coupons
 */

import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

// ============================================
// ADMIN: CREATE COUPON
// POST /api/admin/coupons
// ============================================
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    type, // 'percentage', 'flat', 'first_time'
    discount_percentage,
    discount_amount,
    min_booking_amount,
    max_discount_cap,
    valid_from,
    valid_until,
    usage_limit,
    per_user_limit = 1,
    applicable_properties, // JSON array of property IDs
    description,
    is_active = true,
  } = req.body;

  const adminId = req.user.id;

  // Validation
  if (!code || !type || !valid_from || !valid_until) {
    return sendError(res, "Code, type, and validity dates are required", 400);
  }

  // Validate discount values based on type
  if (type === "percentage" || type === "first_time") {
    if (
      !discount_percentage ||
      discount_percentage <= 0 ||
      discount_percentage > 100
    ) {
      return sendError(res, "Invalid discount percentage (must be 1-100)", 400);
    }
  } else if (type === "flat") {
    if (!discount_amount || discount_amount <= 0) {
      return sendError(res, "Invalid discount amount", 400);
    }
  }

  // Check if coupon code already exists
  const [existing] = await db.query(
    "SELECT id FROM coupons WHERE code = ? AND deleted_at IS NULL",
    [code.toUpperCase()],
  );

  if (existing.length > 0) {
    return sendError(res, "Coupon code already exists", 400);
  }

  // Create coupon
  const couponId = generateUUID();
  await db.query(
    `INSERT INTO coupons (
      id, code, type, discount_percentage, discount_amount,
      min_booking_amount, max_discount_cap, valid_from, valid_until,
      usage_limit, usage_count, per_user_limit, applicable_properties,
      description, is_active, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
    [
      couponId,
      code.toUpperCase(),
      type,
      discount_percentage || null,
      discount_amount || null,
      min_booking_amount || 0,
      max_discount_cap || null,
      valid_from,
      valid_until,
      usage_limit || null,
      per_user_limit,
      applicable_properties ? JSON.stringify(applicable_properties) : null,
      description || null,
      is_active ? 1 : 0,
      adminId,
    ],
  );

  // Log activity
  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
     VALUES (?, ?, 'admin', 'Created coupon', 'coupon', ?)`,
    [generateUUID(), adminId, couponId],
  );

  sendSuccess(res, { coupon_id: couponId }, "Coupon created successfully", 201);
});

// ============================================
// ADMIN: LIST ALL COUPONS
// GET /api/admin/coupons
// ============================================
export const listCoupons = asyncHandler(async (req, res) => {
  const { status, type, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let whereConditions = ["c.deleted_at IS NULL"];
  const queryParams = [];

  // Filter by status
  if (status === "active") {
    whereConditions.push("c.is_active = 1");
    whereConditions.push("c.valid_until >= CURDATE()");
  } else if (status === "inactive") {
    whereConditions.push("c.is_active = 0");
  } else if (status === "expired") {
    whereConditions.push("c.valid_until < CURDATE()");
  }

  // Filter by type
  if (type && ["percentage", "flat", "first_time"].includes(type)) {
    whereConditions.push("c.type = ?");
    queryParams.push(type);
  }

  // Search by code or description
  if (search) {
    whereConditions.push("(c.code LIKE ? OR c.description LIKE ?)");
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = whereConditions.join(" AND ");

  // Get total count
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM coupons c WHERE ${whereClause}`,
    queryParams,
  );
  const total = countResult[0].total;

  // Get coupons with admin details
  queryParams.push(parseInt(limit), offset);
  const [coupons] = await db.query(
    `SELECT 
      c.*,
      a.name as created_by_name,
      (SELECT COUNT(*) FROM coupon_usages cu WHERE cu.coupon_id = c.id AND cu.status = 'completed') as actual_usage
    FROM coupons c
    LEFT JOIN admins a ON c.created_by = a.id
    WHERE ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?`,
    queryParams,
  );

  sendSuccess(res, {
    coupons,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
});

// ============================================
// ADMIN: GET COUPON DETAILS
// GET /api/admin/coupons/:id
// ============================================
export const getCouponDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [coupons] = await db.query(
    `SELECT 
      c.*,
      a.name as created_by_name
    FROM coupons c
    LEFT JOIN admins a ON c.created_by = a.id
    WHERE c.id = ? AND c.deleted_at IS NULL`,
    [id],
  );

  if (coupons.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  const coupon = coupons[0];

  // Get usage statistics
  const [usageStats] = await db.query(
    `SELECT 
      COUNT(*) as total_uses,
      SUM(discount_applied) as total_discount_given,
      COUNT(DISTINCT user_id) as unique_users
    FROM coupon_usages
    WHERE coupon_id = ? AND status = 'completed'`,
    [id],
  );

  // Get recent usages
  const [recentUsages] = await db.query(
    `SELECT 
      cu.*, 
      u.full_name as user_name,
      b.id as booking_id,
      b.total_amount
    FROM coupon_usages cu
    LEFT JOIN users u ON cu.user_id = u.id
    LEFT JOIN bookings b ON cu.booking_id = b.id
    WHERE cu.coupon_id = ?
    ORDER BY cu.reserved_at DESC
    LIMIT 10`,
    [id],
  );

  sendSuccess(res, {
    coupon,
    usage_stats: usageStats[0],
    recent_usages: recentUsages,
  });
});

// ============================================
// ADMIN: UPDATE COUPON
// PATCH /api/admin/coupons/:id
// ============================================
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    type,
    discount_percentage,
    discount_amount,
    min_booking_amount,
    max_discount_cap,
    valid_from,
    valid_until,
    usage_limit,
    per_user_limit,
    applicable_properties,
    description,
    is_active,
  } = req.body;

  const adminId = req.user.id;

  // Check if coupon exists
  const [existing] = await db.query(
    "SELECT * FROM coupons WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (existing.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // If code is being changed, check for duplicates
  if (code && code !== existing[0].code) {
    const [duplicate] = await db.query(
      "SELECT id FROM coupons WHERE code = ? AND id != ? AND deleted_at IS NULL",
      [code.toUpperCase(), id],
    );

    if (duplicate.length > 0) {
      return sendError(res, "Coupon code already exists", 400);
    }
  }

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (code) {
    updates.push("code = ?");
    values.push(code.toUpperCase());
  }
  if (type) {
    updates.push("type = ?");
    values.push(type);
  }
  if (discount_percentage !== undefined) {
    updates.push("discount_percentage = ?");
    values.push(discount_percentage);
  }
  if (discount_amount !== undefined) {
    updates.push("discount_amount = ?");
    values.push(discount_amount);
  }
  if (min_booking_amount !== undefined) {
    updates.push("min_booking_amount = ?");
    values.push(min_booking_amount);
  }
  if (max_discount_cap !== undefined) {
    updates.push("max_discount_cap = ?");
    values.push(max_discount_cap);
  }
  if (valid_from) {
    updates.push("valid_from = ?");
    values.push(valid_from);
  }
  if (valid_until) {
    updates.push("valid_until = ?");
    values.push(valid_until);
  }
  if (usage_limit !== undefined) {
    updates.push("usage_limit = ?");
    values.push(usage_limit);
  }
  if (per_user_limit !== undefined) {
    updates.push("per_user_limit = ?");
    values.push(per_user_limit);
  }
  if (applicable_properties !== undefined) {
    updates.push("applicable_properties = ?");
    values.push(
      applicable_properties ? JSON.stringify(applicable_properties) : null,
    );
  }
  if (description !== undefined) {
    updates.push("description = ?");
    values.push(description);
  }
  if (is_active !== undefined) {
    updates.push("is_active = ?");
    values.push(is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  values.push(id);

  await db.query(
    `UPDATE coupons SET ${updates.join(", ")} WHERE id = ?`,
    values,
  );

  // Log activity
  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
     VALUES (?, ?, 'admin', 'Updated coupon', 'coupon', ?)`,
    [generateUUID(), adminId, id],
  );

  sendSuccess(res, null, "Coupon updated successfully");
});

// ============================================
// ADMIN: DELETE COUPON (Soft delete)
// DELETE /api/admin/coupons/:id
// ============================================
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const [existing] = await db.query(
    "SELECT * FROM coupons WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (existing.length === 0) {
    return sendError(res, "Coupon not found", 404);
  }

  // Soft delete
  await db.query("UPDATE coupons SET deleted_at = NOW() WHERE id = ?", [id]);

  // Log activity
  await db.query(
    `INSERT INTO activity_logs (id, actor_id, actor_role, action, entity, entity_id) 
     VALUES (?, ?, 'admin', 'Deleted coupon', 'coupon', ?)`,
    [generateUUID(), adminId, id],
  );

  sendSuccess(res, null, "Coupon deleted successfully");
});

// ============================================
// USER: VALIDATE COUPON (Before checkout)
// POST /api/coupons/validate
// ============================================
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, property_id, booking_amount } = req.body;
  const userId = req.user.id;

  if (!code || !booking_amount) {
    return sendError(res, "Coupon code and booking amount are required", 400);
  }

  // Fetch coupon
  const [coupons] = await db.query(
    `SELECT * FROM coupons 
     WHERE code = ? AND is_active = 1 AND deleted_at IS NULL`,
    [code.toUpperCase()],
  );

  if (coupons.length === 0) {
    return sendError(res, "Invalid or inactive coupon code", 400);
  }

  const coupon = coupons[0];

  // Check expiry date — compare as IST date strings to avoid UTC/IST offset issues on UTC server
  // mysql2 returns DATE columns as JS Date objects at midnight IST (= 18:30 UTC prev day)
  const nowIST = new Date(Date.now() + 19800000).toISOString().split("T")[0];
  const validFromIST = new Date(
    new Date(coupon.valid_from).getTime() + 19800000,
  )
    .toISOString()
    .split("T")[0];
  const validUntilIST = new Date(
    new Date(coupon.valid_until).getTime() + 19800000,
  )
    .toISOString()
    .split("T")[0];
  if (nowIST < validFromIST || nowIST > validUntilIST) {
    return sendError(res, "Coupon has expired or not yet valid", 400);
  }

  // Check minimum booking amount
  if (booking_amount < coupon.min_booking_amount) {
    return sendError(
      res,
      `Minimum booking amount of ₹${coupon.min_booking_amount} required for this coupon`,
      400,
    );
  }

  // Check usage limit (total)
  if (coupon.usage_limit) {
    const [usageCount] = await db.query(
      "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ? AND status = 'completed'",
      [coupon.id],
    );

    if (usageCount[0].count >= coupon.usage_limit) {
      return sendError(res, "Coupon usage limit reached", 400);
    }
  }

  // Check per-user limit
  const [userUsage] = await db.query(
    "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ? AND user_id = ? AND status = 'completed'",
    [coupon.id, userId],
  );

  if (userUsage[0].count >= coupon.per_user_limit) {
    return sendError(
      res,
      "You have already used this coupon the maximum number of times",
      400,
    );
  }

  // Check first-time user restriction
  if (coupon.type === "first_time") {
    const [completedBookings] = await db.query(
      "SELECT COUNT(*) as count FROM bookings WHERE user_id = ? AND payment_status = 'completed'",
      [userId],
    );

    if (completedBookings[0].count > 0) {
      return sendError(
        res,
        "This coupon is only valid for first-time bookings",
        400,
      );
    }
  }

  // Check property applicability
  if (coupon.applicable_properties && property_id) {
    const applicableProps = JSON.parse(coupon.applicable_properties);
    if (!applicableProps.includes(property_id)) {
      return sendError(
        res,
        "This coupon is not applicable to the selected property",
        400,
      );
    }
  }

  // Calculate discount
  let discount = 0;
  if (coupon.type === "percentage" || coupon.type === "first_time") {
    discount = (booking_amount * coupon.discount_percentage) / 100;
    if (coupon.max_discount_cap) {
      discount = Math.min(discount, coupon.max_discount_cap);
    }
  } else if (coupon.type === "flat") {
    discount = coupon.discount_amount;
  }

  // Round to 2 decimals
  discount = Math.round(discount * 100) / 100;

  sendSuccess(res, {
    valid: true,
    coupon_id: coupon.id,
    coupon_code: coupon.code,
    discount_amount: discount,
    final_amount: booking_amount - discount,
    message: coupon.description || `Coupon applied! You save ₹${discount}`,
  });
});

// ============================================
// ADMIN: GET COUPON ANALYTICS
// GET /api/admin/coupons/analytics
// ============================================
export const getCouponAnalytics = asyncHandler(async (req, res) => {
  // Overall stats
  const [overallStats] = await db.query(`
    SELECT 
      COUNT(*) as total_coupons,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_coupons,
      SUM(CASE WHEN valid_until < CURDATE() THEN 1 ELSE 0 END) as expired_coupons
    FROM coupons
    WHERE deleted_at IS NULL
  `);

  // Usage stats
  const [usageStats] = await db.query(`
    SELECT 
      COUNT(*) as total_redemptions,
      SUM(discount_applied) as total_discount_given,
      COUNT(DISTINCT user_id) as unique_users
    FROM coupon_usages
    WHERE status = 'completed'
  `);

  // Top performing coupons
  const [topCoupons] = await db.query(`
    SELECT 
      c.code,
      c.description,
      COUNT(cu.id) as redemptions,
      SUM(cu.discount_applied) as total_discount
    FROM coupons c
    LEFT JOIN coupon_usages cu ON c.id = cu.coupon_id AND cu.status = 'completed'
    WHERE c.deleted_at IS NULL
    GROUP BY c.id
    ORDER BY redemptions DESC
    LIMIT 10
  `);

  sendSuccess(res, {
    overall: overallStats[0],
    usage: usageStats[0],
    top_coupons: topCoupons,
  });
});
