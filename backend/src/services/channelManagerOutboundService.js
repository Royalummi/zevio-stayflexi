import { XMLBuilder } from "fast-xml-parser";
import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";

/**
 * Parse a StayFlexi provider response body to determine application-level success.
 * StayFlexi may return HTTP 200 with <ErrorRS> — so HTTP status alone is not enough.
 */
const parseProviderResponse = (responseText) => {
  if (!responseText || typeof responseText !== "string") {
    return { appOk: false, errorCode: null, errorDesc: "Empty response" };
  }
  const trimmed = responseText.trim();
  if (/<SuccessRS\s*\/?>/.test(trimmed)) {
    return { appOk: true, errorCode: null, errorDesc: null };
  }
  const codeMatch = trimmed.match(/<ErrorRS[^>]+Code=["']([^"']+)["']/i);
  const descMatch = trimmed.match(
    /<Description[^>]*>([\s\S]*?)<\/Description>/i,
  );
  if (codeMatch || descMatch) {
    return {
      appOk: false,
      errorCode: codeMatch ? codeMatch[1] : null,
      errorDesc: descMatch ? descMatch[1].trim() : "ErrorRS received",
    };
  }
  return {
    appOk: false,
    errorCode: null,
    errorDesc: "Unexpected response format",
  };
};

const builderDefaults = {
  ignoreAttributes: false,
  format: true,
  suppressBooleanAttributes: false,
};

const parseJsonSafe = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const formatDateForStayflexi = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.valueOf())) return String(dateValue);

  const istAdjusted = new Date(date.getTime() + 19800000);
  const day = String(istAdjusted.getUTCDate()).padStart(2, "0");
  const month = String(istAdjusted.getUTCMonth() + 1).padStart(2, "0");
  const year = istAdjusted.getUTCFullYear();
  return `${day}-${month}-${year}`;
};

const toProviderEnvToken = (providerKey) =>
  String(providerKey || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "_");

// PII tags to redact before persisting outbound XML logs.
// The real XML (with full data) is still sent to the provider;
// only the copy stored in channel_manager_webhook_events is masked.
const PII_XML_TAGS = [
  { tag: "GuestEmailId", mask: "***@***.***" },
  { tag: "GuestPhoneNum", mask: "**MASKED**" },
  { tag: "GuestName", mask: "**MASKED**" },
];

const maskPiiInXml = (xml) => {
  if (!xml || typeof xml !== "string") return xml;
  let masked = xml;
  for (const { tag, mask } of PII_XML_TAGS) {
    masked = masked.replace(
      new RegExp(`(<${tag}>)[^<]*(</\\s*${tag}>)`, "gi"),
      `$1${mask}$2`,
    );
  }
  return masked;
};

const calcNumNights = (checkIn, checkOut) => {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  if (Number.isNaN(a.valueOf()) || Number.isNaN(b.valueOf())) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
};

const buildPushBookingXml = ({
  booking,
  integration,
  mapping,
  bookingStatus,
  ratePlanCode = "",
}) => {
  const builder = new XMLBuilder(builderDefaults);
  const numNights = calcNumNights(booking.check_in, booking.check_out);

  const payload = {
    PushBookingRQ: {
      "@_HotelCode": String(integration.external_hotel_id),
      "@_Version": "1.0",
      BookingId: String(booking.id),
      BookingStatus: String(bookingStatus),
      HotelCode: String(integration.external_hotel_id),
      HotelName: String(booking.property_title || "Zevio Property"),
      PayAtHotel: "False",
      Currency: "INR",
      GuestEmailId: String(booking.guest_email || ""),
      GuestPhoneNum: String(booking.guest_phone || ""),
      SpecialRequests: String(booking.special_requests || ""),
      PricingDetails: {
        SellAmount: Number(booking.total_amount || 0),
        NettAmount: Number(booking.base_amount || 0),
        TotalTaxes: Number(booking.gst_amount || 0),
        PayAtHotel: "False",
      },
      RoomStay: {
        Room: {
          GuestName: String(booking.guest_name || "Guest"),
          RoomTypeName: String(booking.property_title || "Room"),
          RoomTypeCode: String(mapping.external_room_type_id || ""),
          RatePlanName: "",
          RatePlanCode: String(ratePlanCode || ""),
          NumAdults: Number(booking.guest_count || 1),
          NumChildren: Number(booking.children_count || 0),
        },
      },
      NightStay: {
        CheckinDate: formatDateForStayflexi(booking.check_in),
        NumNights: numNights,
      },
    },
  };

  return builder.build(payload);
};

const persistOutboundLog = async ({
  integrationId,
  providerKey,
  externalEventId,
  eventType,
  requestXml,
  responseSummary,
  status,
  errorMessage,
}) => {
  const parsedPayload = JSON.stringify(responseSummary || {});

  await db.query(
    `
      INSERT INTO channel_manager_webhook_events
        (id, integration_id, provider_key, external_event_id, event_type, xml_payload, parsed_payload, processing_status, error_message, processed_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        integration_id = VALUES(integration_id),
        event_type = VALUES(event_type),
        xml_payload = VALUES(xml_payload),
        parsed_payload = VALUES(parsed_payload),
        processing_status = VALUES(processing_status),
        error_message = VALUES(error_message),
        processed_at = NOW()
    `,
    [
      generateUUID(),
      integrationId,
      providerKey,
      externalEventId,
      eventType,
      requestXml,
      parsedPayload,
      status,
      errorMessage,
    ],
  );
};

export const triggerPushBookingForBooking = async ({
  bookingId,
  bookingStatus,
}) => {
  const normalizedStatus = String(bookingStatus || "")
    .trim()
    .toUpperCase();
  if (!["CONFIRMED", "CANCELLED", "MODIFIED"].includes(normalizedStatus)) {
    return { ok: false, skipped: true, reason: "Unsupported booking status" };
  }

  const [bookingRows] = await db.query(
    `
      SELECT
        b.*,
        u.full_name AS guest_name,
        u.email AS guest_email,
        u.phone AS guest_phone,
        p.title AS property_title
      FROM bookings b
      INNER JOIN users u ON u.id = b.user_id
      INNER JOIN properties p ON p.id = b.property_id
      WHERE b.id = ?
        AND b.deleted_at IS NULL
      LIMIT 1
    `,
    [bookingId],
  );

  const booking = bookingRows[0];
  if (!booking) {
    return { ok: false, skipped: true, reason: "Booking not found" };
  }

  if (booking.booking_source === "channel_manager") {
    return {
      ok: false,
      skipped: true,
      reason: "Channel-manager sourced booking skipped to avoid loops",
    };
  }

  const [integrationRows] = await db.query(
    `
      SELECT
        i.id,
        i.provider_key,
        i.external_hotel_id,
        i.credentials_json,
        m.external_room_type_id,
        m.external_property_id
      FROM channel_manager_property_mappings m
      INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
      WHERE m.property_id = ?
        AND m.is_active = 1
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
      ORDER BY
        CASE i.status
          WHEN 'active' THEN 0
          WHEN 'test' THEN 1
          ELSE 2
        END,
        i.updated_at DESC,
        i.created_at DESC
      LIMIT 1
    `,
    [booking.property_id],
  );

  const mapping = integrationRows[0];
  if (!mapping) {
    return {
      ok: false,
      skipped: true,
      reason: "No active channel manager mapping for property",
    };
  }

  const integration = {
    id: mapping.id,
    provider_key: mapping.provider_key,
    external_hotel_id: mapping.external_hotel_id,
    credentials_json: mapping.credentials_json,
  };

  const providerEnvToken = toProviderEnvToken(integration.provider_key);
  const credentials = parseJsonSafe(integration.credentials_json, {});

  // Look up the most recent rate plan code for this room type around check-in.
  const [ratePlanRows] = await db.query(
    `SELECT external_rate_plan_id
     FROM channel_manager_daily_controls
     WHERE integration_id = ?
       AND external_room_type_id = ?
       AND control_date <= ?
     ORDER BY control_date DESC
     LIMIT 1`,
    [integration.id, mapping.external_room_type_id || "", booking.check_in],
  );
  const ratePlanCode = ratePlanRows[0]?.external_rate_plan_id || "";

  const endpoint =
    credentials.push_booking_url ||
    process.env[`CHANNEL_MANAGER_PROVIDER_${providerEnvToken}_ENDPOINT`] ||
    (integration.provider_key === "stayflexi"
      ? process.env.CHANNEL_MANAGER_PROVIDER_STAYFLEXI_ENDPOINT
      : "");

  const requestXml = buildPushBookingXml({
    booking,
    integration,
    mapping,
    bookingStatus: normalizedStatus,
    ratePlanCode,
  });
  // Mask PII in the copy we store; the original is sent to the provider.
  const maskedRequestXml = maskPiiInXml(requestXml);

  const externalEventId = `${booking.id}:${normalizedStatus}`;
  const eventType = `push_booking_${normalizedStatus.toLowerCase()}`;

  if (!endpoint) {
    const message = "Missing provider outbound endpoint";
    await persistOutboundLog({
      integrationId: integration.id,
      providerKey: integration.provider_key,
      externalEventId,
      eventType,
      requestXml: maskedRequestXml,
      responseSummary: { endpoint: null },
      status: "failed",
      errorMessage: message,
    });

    return { ok: false, skipped: true, reason: message };
  }

  const timeoutMs = Number(
    process.env.CHANNEL_MANAGER_DEFAULT_TIMEOUT_MS || 10000,
  );
  const abortController = new AbortController();
  const timeoutHandle = setTimeout(() => abortController.abort(), timeoutMs);

  const headers = {
    "Content-Type": "application/xml",
  };

  const username =
    credentials.username ||
    process.env[`CHANNEL_MANAGER_PROVIDER_${providerEnvToken}_USERNAME`] ||
    "";
  const password =
    credentials.password ||
    process.env[`CHANNEL_MANAGER_PROVIDER_${providerEnvToken}_PASSWORD`] ||
    "";

  if (username && password) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: requestXml,
      signal: abortController.signal,
    });

    clearTimeout(timeoutHandle);

    const responseText = await response.text();
    const { appOk, errorCode, errorDesc } = parseProviderResponse(responseText);
    const isOk = response.ok && appOk;

    let errorMessage = null;
    if (!response.ok) {
      errorMessage = `Provider responded with HTTP ${response.status}`;
    } else if (!appOk) {
      errorMessage = errorCode
        ? `StayFlexi error ${errorCode}: ${errorDesc}`
        : errorDesc || "Non-success response";
    }

    const responseSummary = {
      endpoint,
      statusCode: response.status,
      ok: isOk,
      body: responseText,
      ...(errorCode && { errorCode }),
    };

    await persistOutboundLog({
      integrationId: integration.id,
      providerKey: integration.provider_key,
      externalEventId,
      eventType,
      requestXml: maskedRequestXml,
      responseSummary,
      status: isOk ? "processed" : "failed",
      errorMessage,
    });

    return {
      ok: isOk,
      skipped: false,
      statusCode: response.status,
      ...(errorCode && { errorCode }),
    };
  } catch (error) {
    clearTimeout(timeoutHandle);

    await persistOutboundLog({
      integrationId: integration.id,
      providerKey: integration.provider_key,
      externalEventId,
      eventType,
      requestXml: maskedRequestXml,
      responseSummary: {
        endpoint,
        error: error.message,
      },
      status: "failed",
      errorMessage: error.message,
    });

    return {
      ok: false,
      skipped: false,
      error: error.message,
    };
  }
};

export const extractRetryPayloadFromEvent = (eventRow) => {
  const externalEventId = String(eventRow?.external_event_id || "").trim();
  const eventType = String(eventRow?.event_type || "")
    .trim()
    .toLowerCase();

  // Expected format: <booking_id>:<STATUS>
  const separatorIndex = externalEventId.lastIndexOf(":");
  if (separatorIndex <= 0) return null;

  const bookingId = externalEventId.slice(0, separatorIndex).trim();
  const statusFromExternal = externalEventId.slice(separatorIndex + 1).trim();

  let bookingStatus = statusFromExternal;
  if (!bookingStatus && eventType.startsWith("push_booking_")) {
    bookingStatus = eventType.replace("push_booking_", "");
  }

  bookingStatus = String(bookingStatus || "").toUpperCase();
  if (!bookingId || !bookingStatus) return null;

  return {
    bookingId,
    bookingStatus,
  };
};

export const retryFailedChannelManagerOutboundEvents = async ({
  limit = 20,
  lookbackHours = 24,
} = {}) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const safeLookbackHours = Math.max(
    1,
    Math.min(Number(lookbackHours) || 24, 168),
  );

  const [failedRows] = await db.query(
    `
      SELECT
        id,
        provider_key,
        external_event_id,
        event_type,
        received_at
      FROM channel_manager_webhook_events
      WHERE processing_status = 'failed'
        AND event_type IN (
          'push_booking_confirmed',
          'push_booking_cancelled',
          'push_booking_modified'
        )
        AND received_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      ORDER BY received_at ASC
      LIMIT ?
    `,
    [safeLookbackHours, safeLimit],
  );

  if (failedRows.length === 0) {
    return {
      scanned: 0,
      retried: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
    };
  }

  let retried = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of failedRows) {
    const [alreadyProcessedRows] = await db.query(
      `
        SELECT id
        FROM channel_manager_webhook_events
        WHERE provider_key = ?
          AND external_event_id = ?
          AND event_type = ?
          AND processing_status = 'processed'
        LIMIT 1
      `,
      [row.provider_key, row.external_event_id, row.event_type],
    );

    if (alreadyProcessedRows.length > 0) {
      skipped++;
      continue;
    }

    const payload = extractRetryPayloadFromEvent(row);
    if (!payload) {
      skipped++;
      continue;
    }

    retried++;
    const result = await triggerPushBookingForBooking(payload);

    if (result.ok) {
      succeeded++;
    } else if (result.skipped) {
      skipped++;
    } else {
      failed++;
    }
  }

  return {
    scanned: failedRows.length,
    retried,
    succeeded,
    failed,
    skipped,
  };
};

const OUTBOUND_PUSH_EVENT_TYPES = new Set([
  "push_booking_confirmed",
  "push_booking_cancelled",
  "push_booking_modified",
]);

/**
 * Replay a single failed outbound push_booking_* sync log (admin ops).
 * Creates a new webhook event row via triggerPushBookingForBooking.
 */
export const replayOutboundSyncLogById = async ({
  logId,
  providerKey = "stayflexi",
}) => {
  const id = String(logId || "").trim();
  if (!id) {
    return { ok: false, skipped: true, reason: "Sync log ID is required" };
  }

  const normalizedProvider = String(providerKey || "stayflexi")
    .trim()
    .toLowerCase();

  const [rows] = await db.query(
    `
      SELECT id, provider_key, external_event_id, event_type, processing_status
      FROM channel_manager_webhook_events
      WHERE id = ?
        AND provider_key = ?
      LIMIT 1
    `,
    [id, normalizedProvider],
  );

  const eventRow = rows[0];
  if (!eventRow) {
    return { ok: false, skipped: true, reason: "Sync log not found" };
  }

  if (eventRow.processing_status !== "failed") {
    return {
      ok: false,
      skipped: true,
      reason: "Only failed outbound logs can be replayed",
    };
  }

  const eventType = String(eventRow.event_type || "").toLowerCase();
  if (!OUTBOUND_PUSH_EVENT_TYPES.has(eventType)) {
    return {
      ok: false,
      skipped: true,
      reason: "Replay is only supported for outbound push_booking events",
    };
  }

  const [alreadyProcessedRows] = await db.query(
    `
      SELECT id
      FROM channel_manager_webhook_events
      WHERE provider_key = ?
        AND external_event_id = ?
        AND event_type = ?
        AND processing_status = 'processed'
      LIMIT 1
    `,
    [
      eventRow.provider_key,
      eventRow.external_event_id,
      eventRow.event_type,
    ],
  );

  if (alreadyProcessedRows.length > 0) {
    return {
      ok: false,
      skipped: true,
      reason: "A successful push already exists for this booking event",
    };
  }

  const payload = extractRetryPayloadFromEvent(eventRow);
  if (!payload) {
    return {
      ok: false,
      skipped: true,
      reason: "Could not derive booking replay payload from log",
    };
  }

  return triggerPushBookingForBooking(payload);
};

// Exported for unit testing only — not part of the public API surface.
export { calcNumNights, buildPushBookingXml, parseProviderResponse };
