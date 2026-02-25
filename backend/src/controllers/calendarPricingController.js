/**
 * CALENDAR PRICING CONTROLLER – SESSION 70
 * Handles day-wise price overrides for properties.
 * Accessible by: admin (any property), vendor (own properties only).
 */

import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

// ──────────────────────────────────────────────────────────
// GET /api/admin/properties/:propertyId/calendar-pricing
// GET /api/vendor/properties/:propertyId/calendar-pricing
// Query params: ?year=2026&month=3  (defaults to current month)
// ──────────────────────────────────────────────────────────
export const getCalendarPricing = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { year, month } = req.query;

  // Vendor ownership check
  if (req.user.role === "vendor") {
    const [rows] = await db.query(
      "SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL",
      [propertyId, req.user.id],
    );
    if (rows.length === 0)
      return sendError(res, "Property not found or access denied", 404);
  }

  // Build date range filter (default: whole year if no month given, or specific month)
  let dateFilter = "";
  const params = [propertyId];

  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    dateFilter = "AND price_date BETWEEN ? AND ?";
    params.push(startDate, endDate);
  } else if (year) {
    dateFilter = "AND YEAR(price_date) = ?";
    params.push(year);
  }

  const [rows] = await db.query(
    `SELECT id, DATE_FORMAT(price_date, '%Y-%m-%d') AS price_date, price, note, created_by_role
     FROM property_calendar_pricing
     WHERE property_id = ? ${dateFilter}
     ORDER BY price_date ASC`,
    params,
  );

  return sendSuccess(res, rows, "Calendar pricing fetched");
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/admin/properties/:propertyId/calendar-pricing   (bulk upsert)
// POST /api/vendor/properties/:propertyId/calendar-pricing  (bulk upsert)
// Body: { dates: [{date: "YYYY-MM-DD", price: 5000, note?: "..."}, ...] }
// ──────────────────────────────────────────────────────────────────────────────
export const setCalendarPricing = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { dates } = req.body;

  if (!Array.isArray(dates) || dates.length === 0)
    return sendError(res, "dates array is required", 400);

  // Vendor ownership check
  if (req.user.role === "vendor") {
    const [rows] = await db.query(
      "SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL",
      [propertyId, req.user.id],
    );
    if (rows.length === 0)
      return sendError(res, "Property not found or access denied", 404);
  }

  const role =
    req.user.role === "admin" || req.user.role === "super_admin"
      ? "admin"
      : "vendor";

  // Validate each entry
  for (const entry of dates) {
    if (!entry.date || isNaN(new Date(entry.date).getTime()))
      return sendError(res, `Invalid date: ${entry.date}`, 400);
    if (
      !entry.price ||
      isNaN(parseFloat(entry.price)) ||
      parseFloat(entry.price) < 0
    )
      return sendError(res, `Invalid price for date ${entry.date}`, 400);
  }

  // Bulk upsert using INSERT ... ON DUPLICATE KEY UPDATE
  const values = dates.map((entry) => [
    generateUUID(),
    propertyId,
    entry.date,
    parseFloat(entry.price),
    entry.note || null,
    req.user.id,
    role,
  ]);

  await db.query(
    `INSERT INTO property_calendar_pricing
       (id, property_id, price_date, price, note, created_by, created_by_role)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       price = VALUES(price),
       note = VALUES(note),
       created_by = VALUES(created_by),
       created_by_role = VALUES(created_by_role),
       updated_at = CURRENT_TIMESTAMP`,
    [values],
  );

  return sendSuccess(
    res,
    { upserted: dates.length },
    `${dates.length} calendar prices saved`,
  );
});

// ──────────────────────────────────────────────────────────────────────
// DELETE /api/admin/properties/:propertyId/calendar-pricing/:priceDate
// DELETE /api/vendor/properties/:propertyId/calendar-pricing/:priceDate
// ──────────────────────────────────────────────────────────────────────
export const deleteCalendarPricing = asyncHandler(async (req, res) => {
  const { propertyId, priceDate } = req.params;

  // Vendor ownership check
  if (req.user.role === "vendor") {
    const [rows] = await db.query(
      "SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL",
      [propertyId, req.user.id],
    );
    if (rows.length === 0)
      return sendError(res, "Property not found or access denied", 404);
  }

  const [result] = await db.query(
    "DELETE FROM property_calendar_pricing WHERE property_id = ? AND price_date = ?",
    [propertyId, priceDate],
  );

  if (result.affectedRows === 0)
    return sendError(res, "Price entry not found for that date", 404);

  return sendSuccess(res, null, "Calendar price deleted");
});

// ──────────────────────────────────────────────────────────────────────
// DELETE /api/admin/properties/:propertyId/calendar-pricing   (bulk clear range)
// DELETE /api/vendor/properties/:propertyId/calendar-pricing  (bulk clear range)
// Body: { start_date: "YYYY-MM-DD", end_date: "YYYY-MM-DD" }
// ──────────────────────────────────────────────────────────────────────
export const clearCalendarPricingRange = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { start_date, end_date } = req.body;

  if (!start_date || !end_date)
    return sendError(res, "start_date and end_date are required", 400);

  // Vendor ownership check
  if (req.user.role === "vendor") {
    const [rows] = await db.query(
      "SELECT id FROM properties WHERE id = ? AND vendor_id = ? AND deleted_at IS NULL",
      [propertyId, req.user.id],
    );
    if (rows.length === 0)
      return sendError(res, "Property not found or access denied", 404);
  }

  const [result] = await db.query(
    "DELETE FROM property_calendar_pricing WHERE property_id = ? AND price_date BETWEEN ? AND ?",
    [propertyId, start_date, end_date],
  );

  return sendSuccess(
    res,
    { deleted: result.affectedRows },
    `${result.affectedRows} calendar prices cleared`,
  );
});

// ───────────────────────────────────────────────────────────────────────────
// GET /api/public/properties/:propertyId/calendar-pricing
// Public (no auth) — used by guest-facing detail pages to show price calendar
// Query: ?year=2026  (defaults to current year)
// ───────────────────────────────────────────────────────────────────────────
export const getPublicCalendarPricing = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const { year } = req.query;
  const effectiveYear = year || new Date().getFullYear();

  // Verify property exists and is publicly visible
  const [propRows] = await db.query(
    "SELECT id FROM properties WHERE id = ? AND status = 'approved' AND deleted_at IS NULL",
    [propertyId],
  );
  if (propRows.length === 0) return sendError(res, "Property not found", 404);

  const [rows] = await db.query(
    `SELECT DATE_FORMAT(price_date, '%Y-%m-%d') AS price_date, price, note
     FROM property_calendar_pricing
     WHERE property_id = ? AND YEAR(price_date) = ?
     ORDER BY price_date ASC`,
    [propertyId, effectiveYear],
  );

  return sendSuccess(res, rows, "Calendar pricing fetched");
});
