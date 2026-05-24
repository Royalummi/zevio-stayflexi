import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * @route   GET /api/vendor/properties/:id/blackouts
 * @desc    Get blackout dates + upcoming confirmed bookings for a property calendar
 * @access  Private (Vendor only — must own property)
 */
export const getPropertyBlackouts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;

  // Verify vendor owns this property
  const [props] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );
  if (props.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Get manual blackout dates (vendor + admin created)
  const [blackouts] = await db.query(
    `SELECT id,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
            reason, created_by, created_at
     FROM property_blackout_dates
     WHERE property_id = ?
     ORDER BY start_date ASC`,
    [id],
  );

  // Get upcoming confirmed/pending bookings (read-only display)
  const [bookings] = await db.query(
    `SELECT b.id,
            DATE_FORMAT(b.check_in,  '%Y-%m-%d') AS start_date,
            DATE_FORMAT(b.check_out, '%Y-%m-%d') AS end_date,
            b.status, b.created_at, u.full_name as guest_name
     FROM bookings b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.property_id = ?
       AND b.status IN ('confirmed', 'pending_payment')
       AND b.check_out >= CURDATE()
     ORDER BY b.check_in ASC`,
    [id],
  );

  sendSuccess(
    res,
    { blackouts, bookings },
    "Calendar data retrieved successfully",
  );
});

/**
 * @route   POST /api/vendor/properties/:id/blackouts
 * @desc    Create a manual blackout date range
 * @access  Private (Vendor only — must own property)
 */
export const createBlackout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vendorId = req.user.id;
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date) {
    return sendError(res, "start_date and end_date are required", 400);
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return sendError(res, "Invalid date format", 400);
  }

  if (start > end) {
    return sendError(
      res,
      "start_date must be before or equal to end_date",
      400,
    );
  }

  // Verify vendor owns this property
  const [props] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL`,
    [id, vendorId],
  );
  if (props.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Ensure no overlap with confirmed/pending bookings
  const [overlappingBookings] = await db.query(
    `SELECT id FROM bookings
     WHERE property_id = ?
       AND status IN ('confirmed', 'pending_payment')
       AND check_in <= ? AND check_out >= ?`,
    [id, end_date, start_date],
  );

  if (overlappingBookings.length > 0) {
    return sendError(
      res,
      "Cannot block dates that overlap with existing confirmed bookings",
      409,
    );
  }

  // Truncate reason to DB column limit
  const safeReason = reason ? String(reason).substring(0, 200) : null;

  const blackoutId = generateUUID();
  await db.query(
    `INSERT INTO property_blackout_dates (id, property_id, start_date, end_date, reason, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 'vendor', NOW())`,
    [blackoutId, id, start_date, end_date, safeReason],
  );

  sendSuccess(
    res,
    {
      id: blackoutId,
      property_id: id,
      start_date,
      end_date,
      reason: safeReason,
      created_by: "vendor",
    },
    "Blackout date created successfully",
    201,
  );
});

/**
 * @route   DELETE /api/vendor/properties/:id/blackouts/:blackoutId
 * @desc    Delete a manual blackout date (vendor can only delete their own)
 * @access  Private (Vendor only)
 */
export const deleteBlackout = asyncHandler(async (req, res) => {
  const { id, blackoutId } = req.params;
  const vendorId = req.user.id;

  // Verify vendor owns this property
  const [props] = await db.query(
    `SELECT p.id FROM properties p WHERE p.id = ? AND p.vendor_id = ? AND p.deleted_at IS NULL`,
    [id, vendorId],
  );
  if (props.length === 0) {
    return sendError(res, "Property not found or unauthorized", 404);
  }

  // Find the blackout record — must belong to this property and be vendor-created
  const [blackouts] = await db.query(
    `SELECT id, created_by FROM property_blackout_dates WHERE id = ? AND property_id = ?`,
    [blackoutId, id],
  );

  if (blackouts.length === 0) {
    return sendError(res, "Blackout date not found", 404);
  }

  if (blackouts[0].created_by === "admin") {
    return sendError(
      res,
      "You cannot delete admin-created blackout dates",
      403,
    );
  }

  await db.query(`DELETE FROM property_blackout_dates WHERE id = ?`, [
    blackoutId,
  ]);

  sendSuccess(res, { id: blackoutId }, "Blackout date removed successfully");
});

// ── Admin Blackout Functions ──────────────────────────────────────────────────

/**
 * @route   GET /api/admin/properties/:id/blackouts
 * @desc    Get blackout dates + upcoming bookings for any property (admin)
 * @access  Private (Admin only)
 */
export const adminGetPropertyBlackouts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [props] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  if (props.length === 0) return sendError(res, "Property not found", 404);

  const [blackouts] = await db.query(
    `SELECT id,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date,   '%Y-%m-%d') AS end_date,
            reason, created_by, created_at
     FROM property_blackout_dates
     WHERE property_id = ?
     ORDER BY start_date ASC`,
    [id],
  );

  const [bookings] = await db.query(
    `SELECT b.id,
            DATE_FORMAT(b.check_in,  '%Y-%m-%d') AS start_date,
            DATE_FORMAT(b.check_out, '%Y-%m-%d') AS end_date,
            b.status, b.created_at, u.full_name as guest_name
     FROM bookings b
     LEFT JOIN users u ON b.user_id = u.id
     WHERE b.property_id = ?
       AND b.status IN ('confirmed', 'pending_payment')
       AND b.check_out >= CURDATE()
     ORDER BY b.check_in ASC`,
    [id],
  );

  sendSuccess(
    res,
    { blackouts, bookings },
    "Calendar data retrieved successfully",
  );
});

/**
 * @route   POST /api/admin/properties/:id/blackouts
 * @desc    Create a blackout date range as admin
 * @access  Private (Admin only)
 */
export const adminCreateBlackout = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date)
    return sendError(res, "start_date and end_date are required", 400);

  const start = new Date(start_date);
  const end = new Date(end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime()))
    return sendError(res, "Invalid date format", 400);
  if (start > end)
    return sendError(
      res,
      "start_date must be before or equal to end_date",
      400,
    );

  const [props] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );
  if (props.length === 0) return sendError(res, "Property not found", 404);

  const [overlapping] = await db.query(
    `SELECT id FROM bookings
     WHERE property_id = ?
       AND status IN ('confirmed', 'pending_payment')
       AND check_in <= ? AND check_out >= ?`,
    [id, end_date, start_date],
  );
  if (overlapping.length > 0)
    return sendError(
      res,
      "Cannot block dates that overlap with existing confirmed bookings",
      409,
    );

  const safeReason = reason ? String(reason).substring(0, 200) : null;
  const blackoutId = generateUUID();
  await db.query(
    `INSERT INTO property_blackout_dates (id, property_id, start_date, end_date, reason, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 'admin', NOW())`,
    [blackoutId, id, start_date, end_date, safeReason],
  );

  sendSuccess(
    res,
    {
      id: blackoutId,
      property_id: id,
      start_date,
      end_date,
      reason: safeReason,
      created_by: "admin",
    },
    "Blackout date created successfully",
    201,
  );
});

/**
 * @route   DELETE /api/admin/properties/:id/blackouts/:blackoutId
 * @desc    Delete any blackout date (admin can remove vendor or admin blocks)
 * @access  Private (Admin only)
 */
export const adminDeleteBlackout = asyncHandler(async (req, res) => {
  const { id, blackoutId } = req.params;

  const [blackouts] = await db.query(
    `SELECT id FROM property_blackout_dates WHERE id = ? AND property_id = ?`,
    [blackoutId, id],
  );
  if (blackouts.length === 0)
    return sendError(res, "Blackout date not found", 404);

  await db.query(`DELETE FROM property_blackout_dates WHERE id = ?`, [
    blackoutId,
  ]);
  sendSuccess(res, { id: blackoutId }, "Blackout date removed successfully");
});
