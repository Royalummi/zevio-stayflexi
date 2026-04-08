/**
 * SESSION 70: POP-BANNER SYSTEM
 * Admin-managed promotional banners for the Next.js user site
 */

import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

// ============================================
// ADMIN: CREATE BANNER
// POST /api/admin/banners
// ============================================
export const createBanner = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    button_text,
    button_link,
    inline_link_text,
    inline_link_url,
    property_id,
    background_color = "#1F3A5F",
    text_color = "#FFFFFF",
    banner_type = "popup",
    show_once = false,
    is_active = true,
    valid_from,
    valid_until,
  } = req.body;

  if (!title) {
    return sendError(res, "Banner title is required", 400);
  }

  if (!["popup", "top_bar", "slide_in"].includes(banner_type)) {
    return sendError(res, "Invalid banner type", 400);
  }

  if (
    valid_from &&
    valid_until &&
    new Date(valid_from) >= new Date(valid_until)
  ) {
    return sendError(res, "valid_from must be before valid_until", 400);
  }

  const bannerId = generateUUID();
  const adminId = req.user.id;

  await db.query(
    `INSERT INTO banners (
      id, title, description, button_text, button_link,
      inline_link_text, inline_link_url, property_id,
      background_color, text_color, banner_type, show_once,
      is_active, valid_from, valid_until, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      bannerId,
      title,
      description || null,
      button_text || null,
      button_link || null,
      inline_link_text || null,
      inline_link_url || null,
      property_id || null,
      background_color,
      text_color,
      banner_type,
      show_once ? 1 : 0,
      is_active ? 1 : 0,
      valid_from || null,
      valid_until || null,
      adminId,
    ],
  );

  const [rows] = await db.query("SELECT * FROM banners WHERE id = ?", [
    bannerId,
  ]);
  return sendSuccess(res, "Banner created successfully", rows[0], 201);
});

// ============================================
// ADMIN: LIST ALL BANNERS
// GET /api/admin/banners
// ============================================
export const listBanners = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = "WHERE b.deleted_at IS NULL";
  const params = [];

  if (status === "active") {
    whereClause += " AND b.is_active = 1";
  } else if (status === "inactive") {
    whereClause += " AND b.is_active = 0";
  } else if (status === "expired") {
    whereClause += " AND b.valid_until IS NOT NULL AND b.valid_until < NOW()";
  } else if (status === "scheduled") {
    whereClause += " AND b.valid_from IS NOT NULL AND b.valid_from > NOW()";
  }

  if (type && ["popup", "top_bar", "slide_in"].includes(type)) {
    whereClause += " AND b.banner_type = ?";
    params.push(type);
  }

  const [banners] = await db.query(
    `SELECT b.*,
        p.title AS property_title,
        u.name  AS created_by_name
     FROM banners b
     LEFT JOIN properties p ON p.id = b.property_id
     LEFT JOIN users u      ON u.id = b.created_by
     ${whereClause}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM banners b ${whereClause}`,
    params,
  );

  return sendSuccess(res, "Banners retrieved", {
    banners,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============================================
// ADMIN: GET SINGLE BANNER
// GET /api/admin/banners/:id
// ============================================
export const getBannerById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(
    `SELECT b.*,
        p.title AS property_title
     FROM banners b
     LEFT JOIN properties p ON p.id = b.property_id
     WHERE b.id = ? AND b.deleted_at IS NULL`,
    [id],
  );

  if (rows.length === 0) {
    return sendError(res, "Banner not found", 404);
  }

  return sendSuccess(res, "Banner retrieved", rows[0]);
});

// ============================================
// ADMIN: UPDATE BANNER
// PATCH /api/admin/banners/:id
// ============================================
export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    button_text,
    button_link,
    inline_link_text,
    inline_link_url,
    property_id,
    background_color,
    text_color,
    banner_type,
    show_once,
    is_active,
    valid_from,
    valid_until,
  } = req.body;

  const [existing] = await db.query(
    "SELECT id FROM banners WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (existing.length === 0) {
    return sendError(res, "Banner not found", 404);
  }

  if (banner_type && !["popup", "top_bar", "slide_in"].includes(banner_type)) {
    return sendError(res, "Invalid banner type", 400);
  }

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description || null;
  if (button_text !== undefined) updates.button_text = button_text || null;
  if (button_link !== undefined) updates.button_link = button_link || null;
  if (inline_link_text !== undefined)
    updates.inline_link_text = inline_link_text || null;
  if (inline_link_url !== undefined)
    updates.inline_link_url = inline_link_url || null;
  if (property_id !== undefined) updates.property_id = property_id || null;
  if (background_color !== undefined)
    updates.background_color = background_color;
  if (text_color !== undefined) updates.text_color = text_color;
  if (banner_type !== undefined) updates.banner_type = banner_type;
  if (show_once !== undefined) updates.show_once = show_once ? 1 : 0;
  if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
  if (valid_from !== undefined) updates.valid_from = valid_from || null;
  if (valid_until !== undefined) updates.valid_until = valid_until || null;

  if (Object.keys(updates).length === 0) {
    return sendError(res, "No fields to update", 400);
  }

  const setClauses = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = [...Object.values(updates), id];

  await db.query(`UPDATE banners SET ${setClauses} WHERE id = ?`, values);

  const [rows] = await db.query(
    `SELECT b.*, p.title AS property_title
     FROM banners b
     LEFT JOIN properties p ON p.id = b.property_id
     WHERE b.id = ?`,
    [id],
  );

  return sendSuccess(res, "Banner updated successfully", rows[0]);
});

// ============================================
// ADMIN: TOGGLE ACTIVE STATUS
// PATCH /api/admin/banners/:id/toggle
// ============================================
export const toggleBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(
    "SELECT id, is_active FROM banners WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (rows.length === 0) {
    return sendError(res, "Banner not found", 404);
  }

  const newStatus = rows[0].is_active ? 0 : 1;
  await db.query("UPDATE banners SET is_active = ? WHERE id = ?", [
    newStatus,
    id,
  ]);

  return sendSuccess(res, `Banner ${newStatus ? "activated" : "deactivated"}`, {
    id,
    is_active: newStatus === 1,
  });
});

// ============================================
// ADMIN: SOFT DELETE BANNER
// DELETE /api/admin/banners/:id
// ============================================
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [rows] = await db.query(
    "SELECT id FROM banners WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (rows.length === 0) {
    return sendError(res, "Banner not found", 404);
  }

  await db.query(
    "UPDATE banners SET deleted_at = NOW(), is_active = 0 WHERE id = ?",
    [id],
  );

  return sendSuccess(res, "Banner deleted successfully", { id });
});

// ============================================
// PUBLIC: GET ACTIVE BANNERS (for Next.js frontend)
// GET /api/banners/active
// No authentication required
// ============================================
export const getActiveBanners = asyncHandler(async (req, res) => {
  const now = new Date();

  const [banners] = await db.query(
    `SELECT
       b.id, b.title, b.description,
       b.button_text, b.button_link,
       b.inline_link_text, b.inline_link_url,
       b.property_id, b.background_color, b.text_color,
       b.banner_type, b.show_once,
       b.valid_from, b.valid_until,
       p.title AS property_title
     FROM banners b
     LEFT JOIN properties p ON p.id = b.property_id
     WHERE b.is_active = 1
       AND b.deleted_at IS NULL
       AND (b.valid_from IS NULL  OR b.valid_from  <= ?)
       AND (b.valid_until IS NULL OR b.valid_until >= ?)
     ORDER BY b.created_at DESC`,
    [now, now],
  );

  return sendSuccess(res, "Active banners retrieved", banners);
});
