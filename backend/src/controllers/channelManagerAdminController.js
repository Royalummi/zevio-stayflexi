import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { getPaginationMeta } from "../middlewares/pagination.js";
import { generateUUID } from "../utils/helpers.js";
import {
  triggerPushBookingForBooking,
  replayOutboundSyncLogById,
} from "../services/channelManagerOutboundService.js";
import {
  getMonitoringOverview,
  runMonitoringInboundTest,
  listMonitoringIntegrations,
  listPropertiesForMonitoring,
} from "../services/channelManagerMonitoringService.js";

const ALLOWED_STATUSES = new Set([
  "received",
  "processed",
  "failed",
  "ignored",
]);

const MAX_FILTER_DATE_RANGE_DAYS = 93;

export const getChannelManagerSyncLogs = asyncHandler(async (req, res) => {
  const pagination = req.pagination || { page: 1, limit: 20, offset: 0 };
  const providerKey = String(req.query.provider_key || "stayflexi")
    .trim()
    .toLowerCase();
  const processingStatus = String(req.query.processing_status || "")
    .trim()
    .toLowerCase();
  const eventType = String(req.query.event_type || "")
    .trim()
    .toLowerCase();
  const direction = String(req.query.direction || "")
    .trim()
    .toLowerCase();
  const search = String(req.query.search || "")
    .trim()
    .toLowerCase();
  const fromDate = String(req.query.from_date || "").trim();
  const toDate = String(req.query.to_date || "").trim();
  const hasErrorRaw = String(req.query.has_error || "")
    .trim()
    .toLowerCase();
  const sortByRaw = String(req.query.sort_by || "received_at")
    .trim()
    .toLowerCase();
  const sortOrderRaw = String(req.query.sort_order || "desc")
    .trim()
    .toLowerCase();
  const sortBy = sortByRaw === "processed_at" ? "processed_at" : "received_at";
  const sortOrder = sortOrderRaw === "asc" ? "ASC" : "DESC";

  const whereClauses = [];
  const whereParams = [];

  if (providerKey) {
    whereClauses.push("e.provider_key = ?");
    whereParams.push(providerKey);
  }

  if (processingStatus) {
    if (!ALLOWED_STATUSES.has(processingStatus)) {
      return sendError(
        res,
        "Invalid processing_status. Use one of: received, processed, failed, ignored",
        400,
      );
    }
    whereClauses.push("e.processing_status = ?");
    whereParams.push(processingStatus);
  }

  if (eventType) {
    whereClauses.push("LOWER(e.event_type) LIKE ?");
    whereParams.push(`%${eventType}%`);
  }

  if (search) {
    whereClauses.push(
      "(LOWER(e.event_type) LIKE ? OR LOWER(COALESCE(e.external_event_id, '')) LIKE ? OR LOWER(COALESCE(e.error_message, '')) LIKE ?)",
    );
    whereParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (fromDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) {
      return sendError(res, "Invalid from_date format. Use YYYY-MM-DD", 400);
    }
    whereClauses.push("DATE(e.received_at) >= ?");
    whereParams.push(fromDate);
  }

  if (toDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
      return sendError(res, "Invalid to_date format. Use YYYY-MM-DD", 400);
    }
    whereClauses.push("DATE(e.received_at) <= ?");
    whereParams.push(toDate);
  }

  if (fromDate && toDate) {
    const from = new Date(`${fromDate}T00:00:00Z`);
    const to = new Date(`${toDate}T00:00:00Z`);

    if (from.getTime() > to.getTime()) {
      return sendError(res, "from_date cannot be after to_date", 400);
    }

    const diffDays = Math.floor((to.getTime() - from.getTime()) / 86400000);
    if (diffDays > MAX_FILTER_DATE_RANGE_DAYS) {
      return sendError(
        res,
        `Date range too large. Maximum ${MAX_FILTER_DATE_RANGE_DAYS + 1} days allowed`,
        400,
      );
    }
  }

  if (hasErrorRaw) {
    if (!["true", "false", "1", "0"].includes(hasErrorRaw)) {
      return sendError(
        res,
        "Invalid has_error value. Use true/false or 1/0",
        400,
      );
    }
    const hasError = hasErrorRaw === "true" || hasErrorRaw === "1";
    if (hasError) {
      whereClauses.push("COALESCE(TRIM(e.error_message), '') <> ''");
    } else {
      whereClauses.push("COALESCE(TRIM(e.error_message), '') = ''");
    }
  }

  if (direction === "outbound") {
    whereClauses.push("e.event_type LIKE 'push_booking_%'");
  } else if (direction === "inbound") {
    whereClauses.push("e.event_type NOT LIKE 'push_booking_%'");
  } else if (direction) {
    return sendError(res, "Invalid direction. Use inbound or outbound", 400);
  }

  const whereSql =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM channel_manager_webhook_events e
      ${whereSql}
    `,
    whereParams,
  );

  const total = Number(countRows[0]?.total || 0);

  const [summaryRows] = await db.query(
    `
      SELECT
        SUM(CASE WHEN e.processing_status = 'received' THEN 1 ELSE 0 END) AS received,
        SUM(CASE WHEN e.processing_status = 'processed' THEN 1 ELSE 0 END) AS processed,
        SUM(CASE WHEN e.processing_status = 'failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN e.processing_status = 'ignored' THEN 1 ELSE 0 END) AS ignored,
        SUM(CASE WHEN e.event_type LIKE 'push_booking_%' THEN 1 ELSE 0 END) AS outbound,
        SUM(CASE WHEN e.event_type NOT LIKE 'push_booking_%' THEN 1 ELSE 0 END) AS inbound,
        MAX(e.received_at) AS last_received_at,
        MAX(e.processed_at) AS last_processed_at
      FROM channel_manager_webhook_events e
      ${whereSql}
    `,
    whereParams,
  );

  const summary = {
    total,
    received: Number(summaryRows[0]?.received || 0),
    processed: Number(summaryRows[0]?.processed || 0),
    failed: Number(summaryRows[0]?.failed || 0),
    ignored: Number(summaryRows[0]?.ignored || 0),
    inbound: Number(summaryRows[0]?.inbound || 0),
    outbound: Number(summaryRows[0]?.outbound || 0),
    last_received_at: summaryRows[0]?.last_received_at || null,
    last_processed_at: summaryRows[0]?.last_processed_at || null,
  };

  const [rows] = await db.query(
    `
      SELECT
        e.id,
        e.integration_id,
        e.provider_key,
        e.external_event_id,
        e.event_type,
        e.processing_status,
        e.error_message,
        e.received_at,
        e.processed_at,
        i.external_hotel_id,
        i.status AS integration_status
      FROM channel_manager_webhook_events e
      LEFT JOIN channel_manager_integrations i ON i.id = e.integration_id
      ${whereSql}
      ORDER BY e.${sortBy} ${sortOrder}, e.id DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, pagination.limit, pagination.offset],
  );

  return sendSuccess(
    res,
    {
      logs: rows,
      summary,
      pagination: getPaginationMeta(total, pagination.page, pagination.limit),
      filters: {
        provider_key: providerKey || null,
        processing_status: processingStatus || null,
        event_type: eventType || null,
        direction: direction || null,
        search: search || null,
        from_date: fromDate || null,
        to_date: toDate || null,
        has_error: hasErrorRaw || null,
        sort_by: sortBy,
        sort_order: sortOrder.toLowerCase(),
      },
    },
    "Channel manager sync logs fetched",
    200,
  );
});

export const getChannelManagerSyncLogById = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  const providerKey = String(req.query.provider_key || "stayflexi")
    .trim()
    .toLowerCase();

  if (!id) {
    return sendError(res, "Sync log ID is required", 400);
  }

  const [rows] = await db.query(
    `
      SELECT
        e.*,
        i.external_hotel_id,
        i.status AS integration_status
      FROM channel_manager_webhook_events e
      LEFT JOIN channel_manager_integrations i ON i.id = e.integration_id
      WHERE e.id = ?
        AND e.provider_key = ?
      LIMIT 1
    `,
    [id, providerKey],
  );

  if (rows.length === 0) {
    return sendError(res, "Sync log not found", 404);
  }

  return sendSuccess(res, rows[0], "Channel manager sync log fetched", 200);
});

/**
 * POST /api/admin/channel-manager/sync-logs/:id/replay
 * Re-attempt a failed outbound push_booking_* sync log.
 */
export const replayChannelManagerSyncLog = asyncHandler(async (req, res) => {
  const logId = String(req.params.id || "").trim();
  const providerKey = String(req.body?.provider_key || req.query.provider_key || "stayflexi")
    .trim()
    .toLowerCase();

  if (!logId) {
    return sendError(res, "Sync log ID is required", 400);
  }

  const result = await replayOutboundSyncLogById({ logId, providerKey });

  if (result.skipped) {
    return sendSuccess(
      res,
      { skipped: true, reason: result.reason },
      result.reason || "Replay skipped",
      200,
    );
  }

  return sendSuccess(
    res,
    {
      ok: result.ok,
      statusCode: result.statusCode ?? null,
      errorCode: result.errorCode || null,
      error: result.error || null,
    },
    result.ok ? "Replay successful" : "Replay attempted but provider returned an error",
    200,
  );
});

// ─── Integrations Management ─────────────────────────────────────────────────

export const listIntegrations = asyncHandler(async (req, res) => {
  const pagination = req.pagination || { page: 1, limit: 20, offset: 0 };
  const providerKey = String(req.query.provider_key || "")
    .trim()
    .toLowerCase();
  const status = String(req.query.status || "")
    .trim()
    .toLowerCase();
  const vendorId = String(req.query.vendor_id || "").trim();

  const whereClauses = ["i.deleted_at IS NULL"];
  const whereParams = [];

  if (providerKey) {
    whereClauses.push("i.provider_key = ?");
    whereParams.push(providerKey);
  }
  if (status) {
    if (!["active", "inactive", "test"].includes(status)) {
      return sendError(
        res,
        "Invalid status. Use active, inactive, or test",
        400,
      );
    }
    whereClauses.push("i.status = ?");
    whereParams.push(status);
  }
  if (vendorId) {
    whereClauses.push("i.vendor_id = ?");
    whereParams.push(vendorId);
  }

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM channel_manager_integrations i ${whereSql}`,
    whereParams,
  );

  const [rows] = await db.query(
    `
      SELECT
        i.id, i.vendor_id, i.provider_key, i.external_hotel_id,
        i.sync_mode, i.status, i.last_successful_sync_at,
        i.created_at, i.updated_at,
        COALESCE(v.company_name, v.name) AS vendor_name,
        COUNT(DISTINCT m.id) AS mapping_count,
        SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) AS active_mapping_count
      FROM channel_manager_integrations i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      LEFT JOIN channel_manager_property_mappings m ON m.integration_id = i.id
      ${whereSql}
      GROUP BY i.id
      ORDER BY i.updated_at DESC, i.created_at DESC
      LIMIT ? OFFSET ?
    `,
    [...whereParams, pagination.limit, pagination.offset],
  );

  return sendSuccess(
    res,
    {
      integrations: rows,
      pagination: getPaginationMeta(total, pagination.page, pagination.limit),
    },
    "Integrations fetched",
    200,
  );
});

export const getIntegration = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return sendError(res, "Integration ID is required", 400);

  const [rows] = await db.query(
    `
      SELECT
        i.*,
        COALESCE(v.company_name, v.name) AS vendor_name
      FROM channel_manager_integrations i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.id = ? AND i.deleted_at IS NULL
      LIMIT 1
    `,
    [id],
  );

  if (!rows[0]) return sendError(res, "Integration not found", 404);
  return sendSuccess(res, rows[0], "Integration fetched", 200);
});

export const createIntegration = asyncHandler(async (req, res) => {
  const vendorId = String(req.body.vendor_id || "").trim();
  const providerKey = String(req.body.provider_key || "stayflexi")
    .trim()
    .toLowerCase();
  const externalHotelId = String(req.body.external_hotel_id || "").trim();
  const syncMode = String(req.body.sync_mode || "bi_directional").trim();
  const status = String(req.body.status || "test").trim();
  const credentialsJson = req.body.credentials_json
    ? JSON.stringify(req.body.credentials_json)
    : null;

  if (!vendorId) return sendError(res, "vendor_id is required", 400);
  if (!externalHotelId)
    return sendError(res, "external_hotel_id is required", 400);
  if (!["pull", "push", "bi_directional"].includes(syncMode))
    return sendError(
      res,
      "Invalid sync_mode. Use pull, push, or bi_directional",
      400,
    );
  if (!["active", "inactive", "test"].includes(status))
    return sendError(res, "Invalid status. Use active, inactive, or test", 400);

  // Verify vendor exists
  const [[vendor]] = await db.query(
    `SELECT id FROM vendors WHERE id = ? LIMIT 1`,
    [vendorId],
  );
  if (!vendor) return sendError(res, "Vendor not found", 404);

  const id = generateUUID();
  await db.query(
    `
      INSERT INTO channel_manager_integrations
        (id, vendor_id, provider_key, external_hotel_id, credentials_json, sync_mode, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      id,
      vendorId,
      providerKey,
      externalHotelId,
      credentialsJson,
      syncMode,
      status,
    ],
  );

  const [[created]] = await db.query(
    `SELECT i.*, COALESCE(v.company_name, v.name) AS vendor_name
     FROM channel_manager_integrations i
     LEFT JOIN vendors v ON v.id = i.vendor_id
     WHERE i.id = ? LIMIT 1`,
    [id],
  );

  return sendSuccess(res, created, "Integration created", 201);
});

export const updateIntegration = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return sendError(res, "Integration ID is required", 400);

  const [[existing]] = await db.query(
    `SELECT id FROM channel_manager_integrations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  if (!existing) return sendError(res, "Integration not found", 404);

  const fields = [];
  const params = [];

  if (req.body.external_hotel_id !== undefined) {
    const v = String(req.body.external_hotel_id).trim();
    if (!v) return sendError(res, "external_hotel_id cannot be empty", 400);
    fields.push("external_hotel_id = ?");
    params.push(v);
  }
  if (req.body.sync_mode !== undefined) {
    const v = String(req.body.sync_mode).trim();
    if (!["pull", "push", "bi_directional"].includes(v))
      return sendError(res, "Invalid sync_mode", 400);
    fields.push("sync_mode = ?");
    params.push(v);
  }
  if (req.body.status !== undefined) {
    const v = String(req.body.status).trim();
    if (!["active", "inactive", "test"].includes(v))
      return sendError(res, "Invalid status", 400);
    fields.push("status = ?");
    params.push(v);
  }
  if (req.body.credentials_json !== undefined) {
    fields.push("credentials_json = ?");
    params.push(
      req.body.credentials_json
        ? JSON.stringify(req.body.credentials_json)
        : null,
    );
  }

  if (!fields.length)
    return sendError(res, "No updatable fields provided", 400);

  params.push(id);
  await db.query(
    `UPDATE channel_manager_integrations SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );

  const [[updated]] = await db.query(
    `SELECT i.*, COALESCE(v.company_name, v.name) AS vendor_name
     FROM channel_manager_integrations i
     LEFT JOIN vendors v ON v.id = i.vendor_id
     WHERE i.id = ? LIMIT 1`,
    [id],
  );

  return sendSuccess(res, updated, "Integration updated", 200);
});

export const deleteIntegration = asyncHandler(async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return sendError(res, "Integration ID is required", 400);

  const [[existing]] = await db.query(
    `SELECT id FROM channel_manager_integrations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id],
  );
  if (!existing) return sendError(res, "Integration not found", 404);

  // Deactivate all mappings before soft-delete
  await db.query(
    `UPDATE channel_manager_property_mappings SET is_active = 0 WHERE integration_id = ?`,
    [id],
  );
  await db.query(
    `UPDATE channel_manager_integrations SET deleted_at = NOW(), status = 'inactive' WHERE id = ?`,
    [id],
  );

  return sendSuccess(res, null, "Integration deleted", 200);
});

// ─── Property Mappings Management ────────────────────────────────────────────

export const listMappings = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  if (!integrationId) return sendError(res, "Integration ID is required", 400);

  const [[integration]] = await db.query(
    `SELECT id FROM channel_manager_integrations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [integrationId],
  );
  if (!integration) return sendError(res, "Integration not found", 404);

  const [rows] = await db.query(
    `
      SELECT
        m.id, m.integration_id, m.property_id, m.external_property_id,
        m.external_room_type_id, m.is_active, m.created_at, m.updated_at,
        p.title AS property_title,
        COALESCE(c.name, p.area) AS property_city,
        p.status AS property_status
      FROM channel_manager_property_mappings m
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN cities c ON p.city_id = c.id
      WHERE m.integration_id = ?
      ORDER BY m.updated_at DESC, m.created_at DESC
    `,
    [integrationId],
  );

  return sendSuccess(res, { mappings: rows }, "Mappings fetched", 200);
});

export const createMapping = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  if (!integrationId) return sendError(res, "Integration ID is required", 400);

  const propertyId = String(req.body.property_id || "").trim();
  const externalPropertyId = String(req.body.external_property_id || "").trim();
  const externalRoomTypeId = String(
    req.body.external_room_type_id || "",
  ).trim();

  if (!propertyId) return sendError(res, "property_id is required", 400);
  if (!externalPropertyId)
    return sendError(res, "external_property_id is required", 400);

  const [[integration]] = await db.query(
    `SELECT id FROM channel_manager_integrations WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [integrationId],
  );
  if (!integration) return sendError(res, "Integration not found", 404);

  const [[property]] = await db.query(
    `SELECT id FROM properties WHERE id = ? LIMIT 1`,
    [propertyId],
  );
  if (!property) return sendError(res, "Property not found", 404);

  const id = generateUUID();
  await db.query(
    `
      INSERT INTO channel_manager_property_mappings
        (id, integration_id, property_id, external_property_id, external_room_type_id, is_active)
      VALUES (?, ?, ?, ?, ?, 0)
    `,
    [
      id,
      integrationId,
      propertyId,
      externalPropertyId,
      externalRoomTypeId || null,
    ],
  );

  const [[created]] = await db.query(
    `SELECT m.*, p.title AS property_title
     FROM channel_manager_property_mappings m
     LEFT JOIN properties p ON p.id = m.property_id
     WHERE m.id = ? LIMIT 1`,
    [id],
  );

  return sendSuccess(
    res,
    created,
    "Mapping created (inactive by default)",
    201,
  );
});

export const updateMapping = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  const mappingId = String(req.params.mappingId || "").trim();
  if (!integrationId || !mappingId)
    return sendError(res, "Integration ID and Mapping ID are required", 400);

  const [[existing]] = await db.query(
    `SELECT id FROM channel_manager_property_mappings WHERE id = ? AND integration_id = ? LIMIT 1`,
    [mappingId, integrationId],
  );
  if (!existing) return sendError(res, "Mapping not found", 404);

  const fields = [];
  const params = [];

  if (req.body.external_property_id !== undefined) {
    const v = String(req.body.external_property_id).trim();
    if (!v) return sendError(res, "external_property_id cannot be empty", 400);
    fields.push("external_property_id = ?");
    params.push(v);
  }
  if (req.body.external_room_type_id !== undefined) {
    fields.push("external_room_type_id = ?");
    params.push(req.body.external_room_type_id || null);
  }

  if (!fields.length)
    return sendError(res, "No updatable fields provided", 400);

  params.push(mappingId);
  await db.query(
    `UPDATE channel_manager_property_mappings SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );

  const [[updated]] = await db.query(
    `SELECT m.*, p.title AS property_title
     FROM channel_manager_property_mappings m
     LEFT JOIN properties p ON p.id = m.property_id
     WHERE m.id = ? LIMIT 1`,
    [mappingId],
  );

  return sendSuccess(res, updated, "Mapping updated", 200);
});

export const deleteMapping = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  const mappingId = String(req.params.mappingId || "").trim();
  if (!integrationId || !mappingId)
    return sendError(res, "Integration ID and Mapping ID are required", 400);

  const [[existing]] = await db.query(
    `SELECT id FROM channel_manager_property_mappings WHERE id = ? AND integration_id = ? LIMIT 1`,
    [mappingId, integrationId],
  );
  if (!existing) return sendError(res, "Mapping not found", 404);

  await db.query(`DELETE FROM channel_manager_property_mappings WHERE id = ?`, [
    mappingId,
  ]);

  return sendSuccess(res, null, "Mapping deleted", 200);
});

// ─── Activate / Deactivate Mapping ───────────────────────────────────────────

export const activateMapping = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  const mappingId = String(req.params.mappingId || "").trim();
  if (!integrationId || !mappingId)
    return sendError(res, "Integration ID and Mapping ID are required", 400);

  const [[mapping]] = await db.query(
    `
      SELECT m.*, i.provider_key, i.external_hotel_id, i.status AS integration_status
      FROM channel_manager_property_mappings m
      INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
      WHERE m.id = ? AND m.integration_id = ? AND i.deleted_at IS NULL
      LIMIT 1
    `,
    [mappingId, integrationId],
  );
  if (!mapping) return sendError(res, "Mapping not found", 404);

  if (mapping.is_active)
    return sendError(res, "Mapping is already active", 400);

  // Completeness check
  if (!mapping.external_property_id || !mapping.external_room_type_id) {
    return sendError(
      res,
      "Mapping is incomplete. external_property_id and external_room_type_id are required before activation",
      400,
    );
  }

  // Pre-flight: upcoming confirmed bookings on this property
  const today = new Date().toISOString().slice(0, 10);
  const [upcomingBookings] = await db.query(
    `
      SELECT id, check_in, check_out, status, booking_source
      FROM bookings
      WHERE property_id = ?
        AND deleted_at IS NULL
        AND status = 'confirmed'
        AND check_out >= ?
      ORDER BY check_in ASC
      LIMIT 20
    `,
    [mapping.property_id, today],
  );

  // Dry-run mode: return pre-activation summary without committing
  if (req.query.dry_run === "true") {
    return sendSuccess(
      res,
      {
        mapping_id: mappingId,
        property_id: mapping.property_id,
        provider_key: mapping.provider_key,
        external_hotel_id: mapping.external_hotel_id,
        upcoming_confirmed_bookings: upcomingBookings,
        upcoming_booking_count: upcomingBookings.length,
        ready_to_activate: true,
      },
      "Pre-activation summary (dry run — no changes made)",
      200,
    );
  }

  // Activate
  await db.query(
    `UPDATE channel_manager_property_mappings SET is_active = 1 WHERE id = ?`,
    [mappingId],
  );

  return sendSuccess(
    res,
    {
      mapping_id: mappingId,
      property_id: mapping.property_id,
      provider_key: mapping.provider_key,
      upcoming_confirmed_bookings_count: upcomingBookings.length,
    },
    "Mapping activated",
    200,
  );
});

export const deactivateMapping = asyncHandler(async (req, res) => {
  const integrationId = String(req.params.integrationId || "").trim();
  const mappingId = String(req.params.mappingId || "").trim();
  if (!integrationId || !mappingId)
    return sendError(res, "Integration ID and Mapping ID are required", 400);

  const [[mapping]] = await db.query(
    `
      SELECT m.*, i.provider_key
      FROM channel_manager_property_mappings m
      INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
      WHERE m.id = ? AND m.integration_id = ? AND i.deleted_at IS NULL
      LIMIT 1
    `,
    [mappingId, integrationId],
  );
  if (!mapping) return sendError(res, "Mapping not found", 404);

  if (!mapping.is_active)
    return sendError(res, "Mapping is already inactive", 400);

  // Deactivate
  await db.query(
    `UPDATE channel_manager_property_mappings SET is_active = 0 WHERE id = ?`,
    [mappingId],
  );

  // Remove stayflexi-sourced blackouts for this property
  const [deleteResult] = await db.query(
    `
      DELETE FROM property_blackout_dates
      WHERE property_id = ?
        AND blackout_source = 'stayflexi'
    `,
    [mapping.property_id],
  );

  return sendSuccess(
    res,
    {
      mapping_id: mappingId,
      property_id: mapping.property_id,
      provider_key: mapping.provider_key,
      stayflexi_blackouts_removed: deleteResult.affectedRows,
    },
    "Mapping deactivated and StayFlexi blackouts removed",
    200,
  );
});

/**
 * POST /api/admin/channel-manager/push-booking/:bookingId
 * Manually trigger a PushBooking outbound push for a confirmed booking.
 * Useful for ops/troubleshooting when the automatic push failed or needs to be retried.
 * Accepts optional body: { status: "CONFIRMED" | "CANCELLED" | "MODIFIED" }
 * If status is omitted, derives it from the booking's current DB status.
 */
export const manualPushBooking = asyncHandler(async (req, res) => {
  const bookingId = String(req.params.bookingId || "").trim();
  if (!bookingId) return sendError(res, "Booking ID is required", 400);

  const VALID_STATUSES = ["CONFIRMED", "CANCELLED", "MODIFIED"];
  const rawStatus = String(req.body?.status || "")
    .trim()
    .toUpperCase();
  let resolvedStatus = rawStatus || null;

  if (resolvedStatus && !VALID_STATUSES.includes(resolvedStatus)) {
    return sendError(
      res,
      `Invalid status. Use one of: ${VALID_STATUSES.join(", ")}`,
      400,
    );
  }

  // Auto-derive status from booking if not provided
  if (!resolvedStatus) {
    const [[booking]] = await db.query(
      `SELECT status FROM bookings WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [bookingId],
    );
    if (!booking) return sendError(res, "Booking not found", 404);

    const statusMap = {
      confirmed: "CONFIRMED",
      completed: "CONFIRMED",
      cancelled: "CANCELLED",
      cancel_requested: "CANCELLED",
    };
    resolvedStatus = statusMap[booking.status] || null;
    if (!resolvedStatus) {
      return sendError(
        res,
        `Cannot push booking in status '${booking.status}'. Supply an explicit status or ensure booking is confirmed/cancelled.`,
        400,
      );
    }
  }

  const result = await triggerPushBookingForBooking({
    bookingId,
    bookingStatus: resolvedStatus,
  });

  if (result.skipped) {
    return sendSuccess(
      res,
      { skipped: true, reason: result.reason },
      "Push skipped",
      200,
    );
  }

  return sendSuccess(
    res,
    {
      ok: result.ok,
      statusCode: result.statusCode,
      errorCode: result.errorCode || null,
      error: result.error || null,
    },
    result.ok
      ? "Push successful"
      : "Push attempted but provider returned an error",
    200,
  );
});

export const getChannelManagerMonitoringOverview = asyncHandler(
  async (req, res) => {
    const providerKey = String(req.query.provider_key || "stayflexi")
      .trim()
      .toLowerCase();
    const integrationId = String(req.query.integration_id || "").trim();
    const days = Number(req.query.days || 7);

    const overview = await getMonitoringOverview({
      providerKey,
      integrationId,
      days,
    });

    return sendSuccess(res, overview, "Channel manager monitoring overview", 200);
  },
);

export const getChannelManagerMonitoringIntegrations = asyncHandler(
  async (req, res) => {
    const integrations = await listMonitoringIntegrations();
    const properties = await listPropertiesForMonitoring();
    return sendSuccess(
      res,
      { integrations, properties },
      "Monitoring integrations fetched",
      200,
    );
  },
);

export const runChannelManagerMonitoringTest = asyncHandler(async (req, res) => {
  const integrationId = String(req.body?.integration_id || "").trim();
  const operationKey = String(req.body?.operation_key || "").trim();
  const ratePlanCode = String(req.body?.rate_plan_code || "RP01").trim();
  const roomTypeCode = String(req.body?.room_type_code || "").trim();

  if (!integrationId) {
    return sendError(res, "integration_id is required", 400);
  }
  if (!operationKey) {
    return sendError(res, "operation_key is required", 400);
  }

  const result = await runMonitoringInboundTest({
    integrationId,
    operationKey,
    ratePlanCode,
    roomTypeCode,
  });

  if (result.error && !result.responseBody) {
    return sendError(res, result.error, 400);
  }

  return sendSuccess(res, result, result.ok ? "Test passed" : "Test completed with errors", 200);
});
