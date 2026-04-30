/**
 * CANCELLATION POLICIES CONTROLLER – SESSION 70
 * Handles CRUD for per-property-type cancellation policies.
 * Admin-only write access. Public read for display.
 */

import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";

// ──────────────────────────────────────────────────────────
// GET /api/admin/cancellation-policies
// GET /api/public/cancellation-policies
// Optional: ?property_type_id=pt-001
// ──────────────────────────────────────────────────────────
export const getAllCancellationPolicies = asyncHandler(async (req, res) => {
  const { property_type_id } = req.query;

  let where = "";
  const params = [];

  if (property_type_id) {
    where = "WHERE cp.property_type_id = ?";
    params.push(property_type_id);
  }

  const [rows] = await db.query(
    `SELECT
       cp.id,
       cp.property_type_id,
       pt.name AS property_type_name,
       cp.policy_name,
       cp.description,
       cp.tiers,
       cp.is_active,
       cp.created_at,
       cp.updated_at
     FROM cancellation_policies cp
     LEFT JOIN property_types pt ON cp.property_type_id = pt.id
     ${where}
     ORDER BY pt.name ASC, cp.created_at DESC`,
    params,
  );

  // Parse tiers JSON
  const policies = rows.map((row) => ({
    ...row,
    tiers: typeof row.tiers === "string" ? JSON.parse(row.tiers) : row.tiers,
  }));

  return sendSuccess(res, policies, "Cancellation policies fetched");
});

// ──────────────────────────────────────────────────────────
// GET /api/public/cancellation-policies/active
// Returns one active policy per property type
// ──────────────────────────────────────────────────────────
export const getActivePoliciesByType = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT
       cp.id,
       cp.property_type_id,
       pt.name AS property_type_name,
       cp.policy_name,
       cp.description,
       cp.tiers
     FROM cancellation_policies cp
     LEFT JOIN property_types pt ON cp.property_type_id = pt.id
     WHERE cp.is_active = 1
     ORDER BY pt.name ASC`,
  );

  const policies = rows.map((row) => ({
    ...row,
    tiers: typeof row.tiers === "string" ? JSON.parse(row.tiers) : row.tiers,
  }));

  return sendSuccess(res, policies, "Active cancellation policies fetched");
});

// ──────────────────────────────────────────────────────────
// POST /api/admin/cancellation-policies
// ──────────────────────────────────────────────────────────
export const createCancellationPolicy = asyncHandler(async (req, res) => {
  const {
    property_type_id,
    policy_name,
    description,
    tiers,
    is_active = true,
  } = req.body;

  if (
    !property_type_id ||
    !policy_name ||
    !Array.isArray(tiers) ||
    tiers.length === 0
  )
    return sendError(
      res,
      "property_type_id, policy_name, and tiers[] are required",
      400,
    );

  // Validate tiers structure
  for (const tier of tiers) {
    if (
      tier.days_before_checkin === undefined ||
      tier.refund_percent === undefined ||
      !tier.label
    )
      return sendError(
        res,
        "Each tier must have label, days_before_checkin, and refund_percent",
        400,
      );
    if (tier.refund_percent < 0 || tier.refund_percent > 100)
      return sendError(res, "refund_percent must be between 0 and 100", 400);
  }

  // Verify property_type_id exists
  const [typeRows] = await db.query(
    "SELECT id FROM property_types WHERE id = ?",
    [property_type_id],
  );
  if (typeRows.length === 0)
    return sendError(res, "Invalid property_type_id", 400);

  // If setting as active, deactivate all existing for that type first
  if (is_active) {
    await db.query(
      "UPDATE cancellation_policies SET is_active = 0 WHERE property_type_id = ?",
      [property_type_id],
    );
  }

  const id = generateUUID();
  await db.query(
    `INSERT INTO cancellation_policies
       (id, property_type_id, policy_name, description, tiers, is_active, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      property_type_id,
      policy_name,
      description || null,
      JSON.stringify(tiers),
      is_active ? 1 : 0,
      req.user.id,
    ],
  );

  const [created] = await db.query(
    "SELECT * FROM cancellation_policies WHERE id = ?",
    [id],
  );

  const policy = {
    ...created[0],
    tiers:
      typeof created[0].tiers === "string"
        ? JSON.parse(created[0].tiers)
        : created[0].tiers,
  };

  return sendSuccess(res, policy, "Cancellation policy created", 201);
});

// ──────────────────────────────────────────────────────────
// PUT /api/admin/cancellation-policies/:id
// ──────────────────────────────────────────────────────────
export const updateCancellationPolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { policy_name, description, tiers, is_active } = req.body;

  const [existing] = await db.query(
    "SELECT * FROM cancellation_policies WHERE id = ?",
    [id],
  );
  if (existing.length === 0)
    return sendError(res, "Cancellation policy not found", 404);

  const current = existing[0];

  // Validate tiers if provided
  if (tiers !== undefined) {
    if (!Array.isArray(tiers) || tiers.length === 0)
      return sendError(res, "tiers must be a non-empty array", 400);
    for (const tier of tiers) {
      if (
        tier.days_before_checkin === undefined ||
        tier.refund_percent === undefined ||
        !tier.label
      )
        return sendError(
          res,
          "Each tier must have label, days_before_checkin, and refund_percent",
          400,
        );
    }
  }

  // If activating this policy, deactivate others for same property type
  if (is_active === true || is_active === 1) {
    await db.query(
      "UPDATE cancellation_policies SET is_active = 0 WHERE property_type_id = ? AND id != ?",
      [current.property_type_id, id],
    );
  }

  await db.query(
    `UPDATE cancellation_policies SET
       policy_name = ?,
       description = ?,
       tiers = ?,
       is_active = ?,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      policy_name ?? current.policy_name,
      description !== undefined ? description : current.description,
      tiers ? JSON.stringify(tiers) : current.tiers,
      is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
      id,
    ],
  );

  const [updated] = await db.query(
    "SELECT * FROM cancellation_policies WHERE id = ?",
    [id],
  );
  const policy = {
    ...updated[0],
    tiers:
      typeof updated[0].tiers === "string"
        ? JSON.parse(updated[0].tiers)
        : updated[0].tiers,
  };

  return sendSuccess(res, policy, "Cancellation policy updated");
});

// ──────────────────────────────────────────────────────────
// DELETE /api/admin/cancellation-policies/:id
// ──────────────────────────────────────────────────────────
export const deleteCancellationPolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await db.query(
    "SELECT * FROM cancellation_policies WHERE id = ?",
    [id],
  );
  if (existing.length === 0)
    return sendError(res, "Cancellation policy not found", 404);

  if (existing[0].is_active) {
    return sendError(
      res,
      "Cannot delete the active policy. Please activate another policy first, or create a new one before deleting.",
      400,
    );
  }

  await db.query("DELETE FROM cancellation_policies WHERE id = ?", [id]);

  return sendSuccess(res, null, "Cancellation policy deleted");
});
