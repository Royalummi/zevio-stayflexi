import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";

export const CM_MONITORING_OPERATIONS = [
  {
    key: "update_inventory",
    label: "Update Inventory",
    direction: "inbound",
    path: "inventory/update",
    eventType: "update_inventory",
  },
  {
    key: "get_inventory",
    label: "Get Inventory",
    direction: "inbound",
    path: "inventory/get",
    eventType: "get_inventory",
  },
  {
    key: "update_rates",
    label: "Update Rates",
    direction: "inbound",
    path: "rates/update",
    eventType: "update_rates",
  },
  {
    key: "get_rates",
    label: "Get Rates",
    direction: "inbound",
    path: "rates/get",
    eventType: "get_rates",
  },
  {
    key: "update_restriction",
    label: "Update Restrictions",
    direction: "inbound",
    path: "restrictions/update",
    eventType: "update_restriction",
  },
  {
    key: "get_restriction",
    label: "Get Restrictions",
    direction: "inbound",
    path: "restrictions/get",
    eventType: "get_restriction",
  },
  {
    key: "get_hotel_detail",
    label: "Get Hotel Detail",
    direction: "inbound",
    path: "hotel/detail",
    eventType: "get_hotel_detail",
  },
  {
    key: "push_booking_confirmed",
    label: "Push Booking — Confirmed",
    direction: "outbound",
    path: null,
    eventType: "push_booking_confirmed",
  },
  {
    key: "push_booking_cancelled",
    label: "Push Booking — Cancelled",
    direction: "outbound",
    path: null,
    eventType: "push_booking_cancelled",
  },
  {
    key: "push_booking_modified",
    label: "Push Booking — Modified",
    direction: "outbound",
    path: null,
    eventType: "push_booking_modified",
  },
];

const pad = (n) => String(n).padStart(2, "0");

const addDays = (base, days) => {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

const toIsoDate = (d) => d.toISOString().slice(0, 10);

const toSfDate = (d) =>
  `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;

const getSharedSecret = () =>
  process.env.CHANNEL_MANAGER_PROVIDER_STAYFLEXI_SHARED_SECRET ||
  process.env.STAYFLEXI_SHARED_SECRET ||
  "";

const getBackendBase = () => {
  const fromEnv = String(process.env.BACKEND_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  const port = Number(process.env.PORT || 5000);
  return `http://127.0.0.1:${port}`;
};

export const loadIntegrationContext = async (integrationId) => {
  const [[integration]] = await db.query(
    `
      SELECT i.id, i.provider_key, i.external_hotel_id, i.status, i.vendor_id,
             COALESCE(v.company_name, v.name) AS vendor_name
      FROM channel_manager_integrations i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.id = ? AND i.deleted_at IS NULL
      LIMIT 1
    `,
    [integrationId],
  );
  if (!integration) return null;

  const [mappings] = await db.query(
    `
      SELECT m.id, m.property_id, m.external_property_id, m.external_room_type_id,
             m.is_active, p.title AS property_title
      FROM channel_manager_property_mappings m
      INNER JOIN properties p ON p.id = m.property_id AND p.deleted_at IS NULL
      WHERE m.integration_id = ?
      ORDER BY m.is_active DESC, m.created_at ASC
    `,
    [integrationId],
  );

  return { integration, mappings };
};

const buildTestXml = ({
  operationKey,
  hotelCode,
  roomTypeCode,
  ratePlanCode,
}) => {
  const start = addDays(new Date(), 3);
  const end = addDays(start, 2);
  const isoStart = toIsoDate(start);
  const isoEnd = toIsoDate(end);
  const sfStart = toSfDate(start);
  const sfEnd = toSfDate(end);

  switch (operationKey) {
    case "update_inventory":
      return `<UpdateRoomInventoryRQ HotelCode="${hotelCode}" Version="1.0">
  <RoomType>
    <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
    <StartDate Format="yyyy-MM-dd">${isoStart}</StartDate>
    <EndDate Format="yyyy-MM-dd">${isoEnd}</EndDate>
    <Count>3</Count>
  </RoomType>
</UpdateRoomInventoryRQ>`;
    case "get_inventory":
      return `<GetRoomInventoryRQ HotelCode="${hotelCode}" Version="1.0">
  <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
  <StartDate>${sfStart}</StartDate>
  <EndDate>${sfEnd}</EndDate>
</GetRoomInventoryRQ>`;
    case "update_rates":
      return `<UpdateRoomRatesRQ Currency="INR" HotelCode="${hotelCode}" Version="1.0">
  <RatePlan>
    <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
    <RatePlanCode>${ratePlanCode}</RatePlanCode>
    <StartDate Format="yyyy-MM-dd">${isoStart}</StartDate>
    <EndDate Format="yyyy-MM-dd">${isoEnd}</EndDate>
    <Single>2500</Single>
    <Double>3000</Double>
    <Triple>3500</Triple>
    <ExtraAdult>500</ExtraAdult>
    <ExtraChild>300</ExtraChild>
  </RatePlan>
</UpdateRoomRatesRQ>`;
    case "get_rates":
      return `<GetRoomRateRQ HotelCode="${hotelCode}" Version="1.0">
  <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
  <RatePlanCode>${ratePlanCode}</RatePlanCode>
  <StartDate>${sfStart}</StartDate>
  <EndDate>${sfEnd}</EndDate>
</GetRoomRateRQ>`;
    case "update_restriction":
      return `<UpdateRestrictionRQ>
  <HotelCode>${hotelCode}</HotelCode>
  <Version>1.0</Version>
  <Restriction>
    <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
    <RatePlanCode>${ratePlanCode}</RatePlanCode>
    <StartDate Format="yyyy-MM-dd">${isoStart}</StartDate>
    <EndDate Format="yyyy-MM-dd">${isoEnd}</EndDate>
    <MinLOS>1</MinLOS>
    <MaxLOS>30</MaxLOS>
  </Restriction>
</UpdateRestrictionRQ>`;
    case "get_restriction":
      return `<GetRestrictionRQ HotelCode="${hotelCode}" Version="1.0">
  <RoomTypeCode>${roomTypeCode}</RoomTypeCode>
  <RatePlanCode>${ratePlanCode}</RatePlanCode>
  <StartDate>${sfStart}</StartDate>
  <EndDate>${sfEnd}</EndDate>
</GetRestrictionRQ>`;
    case "get_hotel_detail":
      return `<HotelDetailRQ HotelCode="${hotelCode}" Version="1.0" />`;
    default:
      return null;
  }
};

export const getMonitoringOverview = async ({
  providerKey = "stayflexi",
  integrationId = "",
  days = 7,
}) => {
  const safeDays = Math.min(Math.max(Number(days) || 7, 1), 93);
  const where = ["e.provider_key = ?", "e.received_at >= DATE_SUB(NOW(), INTERVAL ? DAY)"];
  const params = [providerKey, safeDays];

  if (integrationId) {
    where.push("e.integration_id = ?");
    params.push(integrationId);
  }

  const whereSql = where.join(" AND ");

  const [statsRows] = await db.query(
    `
      SELECT
        e.event_type,
        e.processing_status,
        COUNT(*) AS count
      FROM channel_manager_webhook_events e
      WHERE ${whereSql}
      GROUP BY e.event_type, e.processing_status
    `,
    params,
  );

  const [lastRows] = await db.query(
    `
      SELECT e.id, e.event_type, e.processing_status, e.error_message,
             e.received_at, e.processed_at, e.integration_id, i.external_hotel_id
      FROM channel_manager_webhook_events e
      LEFT JOIN channel_manager_integrations i ON i.id = e.integration_id
      INNER JOIN (
        SELECT event_type, MAX(received_at) AS max_received_at
        FROM channel_manager_webhook_events e
        WHERE ${whereSql}
        GROUP BY event_type
      ) latest
        ON latest.event_type = e.event_type
       AND latest.max_received_at = e.received_at
      WHERE ${whereSql}
      ORDER BY e.received_at DESC
    `,
    [...params, ...params],
  );

  const [recentRows] = await db.query(
    `
      SELECT e.id, e.event_type, e.processing_status, e.error_message,
             e.received_at, e.processed_at, i.external_hotel_id
      FROM channel_manager_webhook_events e
      LEFT JOIN channel_manager_integrations i ON i.id = e.integration_id
      WHERE ${whereSql}
      ORDER BY e.received_at DESC
      LIMIT 30
    `,
    params,
  );

  const statsByEvent = {};
  for (const row of statsRows) {
    const key = row.event_type;
    if (!statsByEvent[key]) {
      statsByEvent[key] = {
        total: 0,
        received: 0,
        processed: 0,
        failed: 0,
        ignored: 0,
      };
    }
    const count = Number(row.count || 0);
    statsByEvent[key].total += count;
    if (statsByEvent[key][row.processing_status] !== undefined) {
      statsByEvent[key][row.processing_status] += count;
    }
  }

  const lastByEvent = Object.fromEntries(
    lastRows.map((row) => [row.event_type, row]),
  );

  const operations = CM_MONITORING_OPERATIONS.map((op) => {
    const stats = statsByEvent[op.eventType] || {
      total: 0,
      received: 0,
      processed: 0,
      failed: 0,
      ignored: 0,
    };
    const last = lastByEvent[op.eventType] || null;
    const successRate =
      stats.total > 0
        ? Math.round((stats.processed / stats.total) * 100)
        : null;
    return { ...op, stats, last, successRate };
  });

  const totals = operations.reduce(
    (acc, op) => {
      acc.total += op.stats.total;
      acc.processed += op.stats.processed;
      acc.failed += op.stats.failed;
      return acc;
    },
    { total: 0, processed: 0, failed: 0 },
  );

  return {
    providerKey,
    integrationId: integrationId || null,
    windowDays: safeDays,
    totals,
    operations,
    recent: recentRows,
    generatedAt: new Date().toISOString(),
  };
};

export const runMonitoringInboundTest = async ({
  integrationId,
  operationKey,
  ratePlanCode = "RP01",
  roomTypeCode = "",
}) => {
  const operation = CM_MONITORING_OPERATIONS.find((op) => op.key === operationKey);
  if (!operation || operation.direction !== "inbound" || !operation.path) {
    return { ok: false, error: "Invalid or unsupported inbound operation" };
  }

  const context = await loadIntegrationContext(integrationId);
  if (!context) {
    return { ok: false, error: "Integration not found" };
  }

  const mapping =
    context.mappings.find((m) => m.is_active) || context.mappings[0];
  if (!mapping) {
    return {
      ok: false,
      error: "No property mapping found for this integration. Add a mapping first.",
    };
  }

  const hotelCode = context.integration.external_hotel_id;
  const room = roomTypeCode || mapping.external_room_type_id;
  if (!room) {
    return { ok: false, error: "Room type code is required" };
  }

  const requestXml = buildTestXml({
    operationKey,
    hotelCode,
    roomTypeCode: room,
    ratePlanCode,
  });

  const secret = getSharedSecret();
  if (!secret) {
    return { ok: false, error: "Channel manager shared secret is not configured" };
  }

  const url = `${getBackendBase()}/api/channel-manager/stayflexi/${operation.path}`;
  const startedAt = Date.now();

  let responseStatus = 0;
  let responseBody = "";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/xml",
        "x-channel-secret": secret,
      },
      body: requestXml,
    });
    responseStatus = response.status;
    responseBody = await response.text();
  } catch (error) {
    return {
      ok: false,
      error: error.message || "Failed to call channel manager endpoint",
      requestXml,
      url,
    };
  }

  const durationMs = Date.now() - startedAt;
  const appOk =
    responseStatus === 200 &&
    (responseBody.includes("SuccessRS") ||
      /<(GetRoomInventoryRS|GetRoomRateRS|GetRestrictionRS|HotelDetailRS)/.test(
        responseBody,
      ));

  const [[logRow]] = await db.query(
    `
      SELECT id, processing_status, error_message, received_at
      FROM channel_manager_webhook_events
      WHERE provider_key = ?
        AND event_type = ?
      ORDER BY received_at DESC
      LIMIT 1
    `,
    [context.integration.provider_key || "stayflexi", operation.eventType],
  );

  return {
    ok: appOk,
    operation: operation.key,
    url,
    requestXml,
    responseStatus,
    responseBody,
    durationMs,
    logId: logRow?.id || null,
    logStatus: logRow?.processing_status || null,
    logError: logRow?.error_message || null,
    propertyTitle: mapping.property_title,
    hotelCode,
    roomTypeCode: room,
    ratePlanCode,
  };
};

export const listMonitoringIntegrations = async () => {
  const [rows] = await db.query(
    `
      SELECT
        i.id, i.external_hotel_id, i.status, i.provider_key,
        COALESCE(v.company_name, v.name) AS vendor_name,
        COUNT(m.id) AS mapping_count,
        SUM(CASE WHEN m.is_active = 1 THEN 1 ELSE 0 END) AS active_mapping_count,
        GROUP_CONCAT(DISTINCT p.title ORDER BY p.title SEPARATOR ', ') AS property_titles
      FROM channel_manager_integrations i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      LEFT JOIN channel_manager_property_mappings m ON m.integration_id = i.id
      LEFT JOIN properties p ON p.id = m.property_id
      WHERE i.deleted_at IS NULL
      GROUP BY i.id
      ORDER BY i.updated_at DESC
    `,
  );
  return rows;
};

export const listPropertiesForMonitoring = async () => {
  const [rows] = await db.query(
    `
      SELECT p.id, p.title, p.vendor_id,
             COALESCE(v.company_name, v.name) AS vendor_name,
             m.integration_id, m.external_room_type_id, i.external_hotel_id
      FROM properties p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN channel_manager_property_mappings m ON m.property_id = p.id
      LEFT JOIN channel_manager_integrations i ON i.id = m.integration_id AND i.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      ORDER BY p.title ASC
      LIMIT 100
    `,
  );
  return rows;
};
