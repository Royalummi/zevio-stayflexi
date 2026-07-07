import db from "../config/database.js";
import { generateUUID } from "../utils/helpers.js";
import { asyncHandler } from "../utils/response.js";
import { parseXmlPayload, getXmlRootName } from "../utils/xmlParser.js";
import {
  buildChannelManagerAckXml,
  buildStayflexiErrorXml,
  buildStayflexiHotelDetailResponseXml,
  buildStayflexiInventoryResponseXml,
  buildStayflexiRateResponseXml,
  buildStayflexiRestrictionResponseXml,
  buildStayflexiSuccessXml,
} from "../utils/xmlBuilder.js";

const DATE_FORMAT_REGEX = /^\d{2}-\d{2}-\d{4}$/;

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null) return [];
  return [value];
};

const getNodeValue = (value) => {
  if (value && typeof value === "object") {
    if (value["#text"] !== undefined) return value["#text"];
    return "";
  }
  return value;
};

const getBooleanNodeValue = (value, defaultValue = false) => {
  const normalized = String(getNodeValue(value) ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return defaultValue;
  return ["1", "true", "yes"].includes(normalized);
};

const formatDateForStayflexi = (dateValue) => {
  const [year, month, day] = String(dateValue).split("-");
  if (!year || !month || !day) return String(dateValue);
  return `${day}-${month}-${year}`;
};

const normalizeDateInput = (value) => {
  const raw = String(getNodeValue(value) || "").trim();
  if (!raw) return null;

  if (DATE_FORMAT_REGEX.test(raw)) {
    const [day, month, year] = raw.split("-");
    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  return null;
};

const toDateKey = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    const istAdjusted = new Date(value.getTime() + 19800000);
    return istAdjusted.toISOString().slice(0, 10);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10);
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.valueOf())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
};

const enumerateDates = (startDate, endDate) => {
  const result = [];
  const [startYear, startMonth, startDay] = startDate
    .split("-")
    .map((value) => Number(value));
  const [endYear, endMonth, endDay] = endDate
    .split("-")
    .map((value) => Number(value));

  const start = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));

  if (
    Number.isNaN(start.valueOf()) ||
    Number.isNaN(end.valueOf()) ||
    start > end
  ) {
    return result;
  }

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const year = cursor.getUTCFullYear();
    const month = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const day = String(cursor.getUTCDate()).padStart(2, "0");
    result.push(`${year}-${month}-${day}`);
  }

  return result;
};

const DAY_NAME_TO_UTC_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Apply optional Stayflexi DaysOfWeek filter to a date range. */
const resolveDatesInRange = (startDate, endDate, nodeWithOptionalDaysOfWeek) => {
  const allDates = enumerateDates(startDate, endDate);
  if (allDates.length === 0) return allDates;

  const dayNodes = toArray(nodeWithOptionalDaysOfWeek?.DaysOfWeek);
  if (dayNodes.length === 0) return allDates;

  const allowed = new Set();
  for (const dayNode of dayNodes) {
    const name = String(getNodeValue(dayNode) || "")
      .trim()
      .toLowerCase();
    if (DAY_NAME_TO_UTC_INDEX[name] !== undefined) {
      allowed.add(DAY_NAME_TO_UTC_INDEX[name]);
    }
  }

  if (allowed.size === 0) return allDates;

  return allDates.filter((dateKey) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const dayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    return allowed.has(dayIndex);
  });
};

const getOperationFromRoot = (rootName) => {
  const map = {
    updateroominventoryrq: "update_inventory",
    getroominventoryrq: "get_inventory",
    updateroomratesrq: "update_rates",
    getroomraterq: "get_rates",
    updaterestrictionrq: "update_restriction",
    getrestrictionrq: "get_restriction",
    hoteldetailrq: "get_hotel_detail",
    gethoteldetailrq: "get_hotel_detail",
  };

  return map[String(rootName || "").toLowerCase()] || "unknown";
};

const resolveIntegration = async ({ providerKey, hotelCode }) => {
  const [rows] = await db.query(
    `
      SELECT id, vendor_id, provider_key, external_hotel_id, status
      FROM channel_manager_integrations
      WHERE provider_key = ?
        AND external_hotel_id = ?
        AND deleted_at IS NULL
        AND status IN ('active', 'test')
      ORDER BY
        CASE status
          WHEN 'active' THEN 0
          WHEN 'test' THEN 1
          ELSE 2
        END,
        updated_at DESC,
        created_at DESC
      LIMIT 1
    `,
    [providerKey, String(hotelCode)],
  );

  return rows[0] || null;
};

const resolvePropertyMapping = async ({ integrationId, roomTypeCode }) => {
  const roomType = String(roomTypeCode || "").trim();

  const [roomRows] = await db.query(
    `
      SELECT id, property_id, external_property_id, external_room_type_id
      FROM channel_manager_property_mappings
      WHERE integration_id = ?
        AND is_active = 1
        AND external_room_type_id = ?
      LIMIT 1
    `,
    [integrationId, roomType],
  );
  if (roomRows.length > 0) return roomRows[0];

  const [fallbackRows] = await db.query(
    `
      SELECT id, property_id, external_property_id, external_room_type_id
      FROM channel_manager_property_mappings
      WHERE integration_id = ?
        AND is_active = 1
      LIMIT 1
    `,
    [integrationId],
  );

  return fallbackRows[0] || null;
};

const updateWebhookEventStatus = async ({
  eventId,
  status,
  errorMessage = null,
  integrationId = null,
}) => {
  await db.query(
    `
      UPDATE channel_manager_webhook_events
      SET processing_status = ?,
          error_message = ?,
          processed_at = NOW(),
          integration_id = COALESCE(?, integration_id)
      WHERE id = ?
    `,
    [status, errorMessage, integrationId, eventId],
  );
};

const processInventoryUpdate = async ({
  parsedPayload,
  providerKey,
  integration,
}) => {
  const root = parsedPayload.UpdateRoomInventoryRQ;
  const roomTypes = toArray(root?.RoomType);

  if (roomTypes.length === 0) {
    return { ok: false, code: "106", message: "RoomType is required" };
  }

  for (const roomType of roomTypes) {
    const roomTypeCode = String(
      getNodeValue(roomType?.RoomTypeCode) || "",
    ).trim();
    const startDate = normalizeDateInput(roomType?.StartDate);
    const endDate = normalizeDateInput(roomType?.EndDate);
    const count = Number(getNodeValue(roomType?.Count) ?? 0);

    if (!roomTypeCode || !startDate || !endDate) {
      return {
        ok: false,
        code: "106",
        message: "RoomTypeCode, StartDate and EndDate are required",
      };
    }

    const mapping = await resolvePropertyMapping({
      integrationId: integration.id,
      roomTypeCode,
    });
    if (!mapping) {
      return {
        ok: false,
        code: "102",
        message: `RoomTypeCode not mapped: ${roomTypeCode}`,
      };
    }

    const dates = resolveDatesInRange(startDate, endDate, roomType);
    if (dates.length === 0) {
      return { ok: false, code: "107", message: "Invalid date range" };
    }

    if (count <= 0) {
      for (const date of dates) {
        const referenceId = `${integration.external_hotel_id}:${roomTypeCode}:${date}`;
        await db.query(
          `
            INSERT INTO property_blackout_dates
              (id, property_id, start_date, end_date, reason, blackout_source, source_provider_key, source_reference_id, created_by)
            VALUES
              (?, ?, ?, ?, ?, 'channel_manager', ?, ?, 'admin')
            ON DUPLICATE KEY UPDATE
              property_id = VALUES(property_id),
              start_date = VALUES(start_date),
              end_date = VALUES(end_date),
              reason = VALUES(reason),
              blackout_source = VALUES(blackout_source),
              source_provider_key = VALUES(source_provider_key),
              created_by = VALUES(created_by)
          `,
          [
            generateUUID(),
            mapping.property_id,
            date,
            date,
            `Blocked by ${providerKey} inventory update`,
            providerKey,
            referenceId,
          ],
        );
      }
      continue;
    }

    for (const date of dates) {
      await db.query(
        `
          DELETE FROM property_blackout_dates
          WHERE property_id = ?
            AND start_date = ?
            AND end_date = ?
            AND blackout_source = 'channel_manager'
            AND source_provider_key = ?
        `,
        [mapping.property_id, date, date, providerKey],
      );
    }
  }

  return { ok: true };
};

const processInventoryGet = async ({ parsedPayload, integration }) => {
  const root = parsedPayload.GetRoomInventoryRQ;
  const roomTypeCode = String(getNodeValue(root?.RoomTypeCode) || "").trim();
  const startDate = normalizeDateInput(root?.StartDate);
  const endDate = normalizeDateInput(root?.EndDate);

  if (!roomTypeCode || !startDate || !endDate) {
    return {
      ok: false,
      code: "106",
      message: "RoomTypeCode, StartDate and EndDate are required",
    };
  }

  const mapping = await resolvePropertyMapping({
    integrationId: integration.id,
    roomTypeCode,
  });
  if (!mapping) {
    return {
      ok: false,
      code: "102",
      message: `RoomTypeCode not mapped: ${roomTypeCode}`,
    };
  }

  const dates = enumerateDates(startDate, endDate);
  if (dates.length === 0) {
    return { ok: false, code: "107", message: "Invalid date range" };
  }

  const availability = [];

  for (const date of dates) {
    const [blackoutRows] = await db.query(
      `
        SELECT id
        FROM property_blackout_dates
        WHERE property_id = ?
          AND start_date <= ?
          AND end_date >= ?
        LIMIT 1
      `,
      [mapping.property_id, date, date],
    );

    const [bookingRows] = await db.query(
      `
        SELECT id
        FROM bookings
        WHERE property_id = ?
          AND deleted_at IS NULL
          AND status IN ('pending_payment', 'confirmed', 'completed')
          AND check_in <= ?
          AND check_out > ?
        LIMIT 1
      `,
      [mapping.property_id, date, date],
    );

    availability.push({
      date: formatDateForStayflexi(date),
      count: blackoutRows.length > 0 || bookingRows.length > 0 ? 0 : 1,
    });
  }

  return {
    ok: true,
    responseXml: buildStayflexiInventoryResponseXml({
      hotelCode: integration.external_hotel_id,
      roomTypeCode,
      version: root?.["@_Version"] || "1.0",
      availability,
    }),
  };
};

const processRatesUpdate = async ({
  parsedPayload,
  integration,
  providerKey,
}) => {
  const root = parsedPayload.UpdateRoomRatesRQ;
  const ratePlans = toArray(root?.RatePlan);

  if (ratePlans.length === 0) {
    return { ok: false, code: "106", message: "RatePlan is required" };
  }

  for (const ratePlan of ratePlans) {
    const roomTypeCode = String(
      getNodeValue(ratePlan?.RoomTypeCode) || "",
    ).trim();
    const ratePlanCode =
      String(getNodeValue(ratePlan?.RatePlanCode) || "").trim() || "DEFAULT";
    const startDate = normalizeDateInput(ratePlan?.StartDate);
    const endDate = normalizeDateInput(ratePlan?.EndDate);

    if (!roomTypeCode || !startDate || !endDate) {
      return {
        ok: false,
        code: "106",
        message: "RoomTypeCode, StartDate and EndDate are required",
      };
    }

    const mapping = await resolvePropertyMapping({
      integrationId: integration.id,
      roomTypeCode,
    });
    if (!mapping) {
      return {
        ok: false,
        code: "102",
        message: `RoomTypeCode not mapped: ${roomTypeCode}`,
      };
    }

    const dates = resolveDatesInRange(startDate, endDate, ratePlan);
    if (dates.length === 0) {
      return { ok: false, code: "107", message: "Invalid date range" };
    }

    const singleRate = Number(getNodeValue(ratePlan?.Single) ?? 0);
    const doubleRate = Number(getNodeValue(ratePlan?.Double) ?? singleRate);
    const tripleRate = Number(getNodeValue(ratePlan?.Triple) ?? doubleRate);
    const extraAdultRate = Number(getNodeValue(ratePlan?.ExtraAdult) ?? 0);
    const extraChildRate = Number(getNodeValue(ratePlan?.ExtraChild) ?? 0);

    for (const date of dates) {
      const referenceId = `${integration.external_hotel_id}:${roomTypeCode}:rate:${ratePlanCode}:${date}`;

      await db.query(
        `
          INSERT INTO channel_manager_daily_controls
            (id, integration_id, property_id, provider_key, external_room_type_id, external_rate_plan_id, control_date, single_rate, double_rate, triple_rate, extra_adult_rate, extra_child_rate, source_reference_id)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            single_rate = VALUES(single_rate),
            double_rate = VALUES(double_rate),
            triple_rate = VALUES(triple_rate),
            extra_adult_rate = VALUES(extra_adult_rate),
            extra_child_rate = VALUES(extra_child_rate),
            source_reference_id = VALUES(source_reference_id),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          generateUUID(),
          integration.id,
          mapping.property_id,
          providerKey,
          roomTypeCode,
          ratePlanCode,
          date,
          singleRate,
          doubleRate,
          tripleRate,
          extraAdultRate,
          extraChildRate,
          referenceId,
        ],
      );

      await db.query(
        `
          INSERT INTO property_calendar_pricing
            (id, property_id, price_date, price, note, created_by, created_by_role)
          VALUES
            (?, ?, ?, ?, ?, ?, 'admin')
          ON DUPLICATE KEY UPDATE
            price = VALUES(price),
            note = VALUES(note),
            created_by = VALUES(created_by),
            created_by_role = VALUES(created_by_role),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          generateUUID(),
          mapping.property_id,
          date,
          Number.isFinite(doubleRate) && doubleRate > 0
            ? doubleRate
            : singleRate,
          `Managed by ${providerKey} (${ratePlanCode})`,
          integration.vendor_id,
        ],
      );
    }
  }

  return { ok: true };
};

const processRatesGet = async ({ parsedPayload, integration }) => {
  const root = parsedPayload.GetRoomRateRQ;
  const roomTypeCode = String(getNodeValue(root?.RoomTypeCode) || "").trim();
  const ratePlanCode =
    String(getNodeValue(root?.RatePlanCode) || "").trim() || "DEFAULT";
  const startDate = normalizeDateInput(root?.StartDate);
  const endDate = normalizeDateInput(root?.EndDate);

  if (!roomTypeCode || !startDate || !endDate) {
    return {
      ok: false,
      code: "106",
      message: "RoomTypeCode, StartDate and EndDate are required",
    };
  }

  const mapping = await resolvePropertyMapping({
    integrationId: integration.id,
    roomTypeCode,
  });
  if (!mapping) {
    return {
      ok: false,
      code: "102",
      message: `RoomTypeCode not mapped: ${roomTypeCode}`,
    };
  }

  const dates = enumerateDates(startDate, endDate);
  if (dates.length === 0) {
    return { ok: false, code: "107", message: "Invalid date range" };
  }

  const [controlRows] = await db.query(
    `
      SELECT
        control_date,
        single_rate,
        double_rate,
        triple_rate,
        extra_adult_rate,
        extra_child_rate
      FROM channel_manager_daily_controls
      WHERE integration_id = ?
        AND external_room_type_id = ?
        AND external_rate_plan_id = ?
        AND control_date BETWEEN ? AND ?
    `,
    [integration.id, roomTypeCode, ratePlanCode, startDate, endDate],
  );

  const [calendarRows] = await db.query(
    `
      SELECT price_date, price
      FROM property_calendar_pricing
      WHERE property_id = ?
        AND price_date BETWEEN ? AND ?
    `,
    [mapping.property_id, startDate, endDate],
  );

  const [basePricingRows] = await db.query(
    `
      SELECT price_per_night, extra_guest_charge, extra_child_charge
      FROM property_pricing
      WHERE property_id = ?
      LIMIT 1
    `,
    [mapping.property_id],
  );

  const controlByDate = new Map(
    controlRows
      .map((row) => [toDateKey(row.control_date), row])
      .filter(([date]) => Boolean(date)),
  );
  const calendarByDate = new Map(
    calendarRows
      .map((row) => [toDateKey(row.price_date), Number(row.price)])
      .filter(([date]) => Boolean(date)),
  );

  const basePricing = basePricingRows[0] || {
    price_per_night: 0,
    extra_guest_charge: 0,
    extra_child_charge: 0,
  };

  const rates = dates.map((date) => {
    const control = controlByDate.get(date);
    const fallbackDouble =
      calendarByDate.get(date) ?? Number(basePricing.price_per_night || 0);

    const doubleRate = Number(control?.double_rate ?? fallbackDouble);
    const singleRate = Number(control?.single_rate ?? doubleRate);
    const tripleRate = Number(control?.triple_rate ?? doubleRate);
    const extraAdultRate = Number(
      control?.extra_adult_rate ?? basePricing.extra_guest_charge ?? 0,
    );
    const extraChildRate = Number(
      control?.extra_child_rate ?? basePricing.extra_child_charge ?? 0,
    );

    return {
      date: formatDateForStayflexi(date),
      single: singleRate,
      double: doubleRate,
      triple: tripleRate,
      extraAdult: extraAdultRate,
      extraChild: extraChildRate,
    };
  });

  return {
    ok: true,
    responseXml: buildStayflexiRateResponseXml({
      hotelCode: integration.external_hotel_id,
      roomTypeCode,
      ratePlanCode,
      currency: root?.["@_Currency"] || "INR",
      version: root?.["@_Version"] || "1.0",
      rates,
    }),
  };
};

const processRestrictionUpdate = async ({
  parsedPayload,
  integration,
  providerKey,
}) => {
  const root = parsedPayload.UpdateRestrictionRQ;
  const restrictions = toArray(root?.Restriction);

  if (restrictions.length === 0) {
    return { ok: false, code: "106", message: "Restriction is required" };
  }

  for (const restriction of restrictions) {
    const roomTypeCode = String(
      getNodeValue(restriction?.RoomTypeCode) || "",
    ).trim();
    const ratePlanCodeRaw = String(
      getNodeValue(restriction?.RatePlanCode) || "",
    ).trim();
    // OTA doc: room-type StopSell may omit RatePlanCode; rate-plan StopSell requires both.
    const ratePlanCode =
      ratePlanCodeRaw ||
      (restriction?.StopSell !== undefined ? "__ROOM__" : "DEFAULT");
    const startDate = normalizeDateInput(restriction?.StartDate);
    const endDate = normalizeDateInput(restriction?.EndDate);

    if (!roomTypeCode || !startDate || !endDate) {
      return {
        ok: false,
        code: "106",
        message: "RoomTypeCode, StartDate and EndDate are required",
      };
    }

    const mapping = await resolvePropertyMapping({
      integrationId: integration.id,
      roomTypeCode,
    });
    if (!mapping) {
      return {
        ok: false,
        code: "102",
        message: `RoomTypeCode not mapped: ${roomTypeCode}`,
      };
    }

    const dates = resolveDatesInRange(startDate, endDate, restriction);
    if (dates.length === 0) {
      return { ok: false, code: "107", message: "Invalid date range" };
    }

    // Stayflexi often sends one restriction field per request (MinLOS, COA, COD, etc.).
    // Only update fields present in the payload; preserve existing values for omitted fields.
    const hasStopSell = restriction?.StopSell !== undefined;
    const hasClosedOnArrival = restriction?.ClosedOnArrival !== undefined;
    const hasClosedOnDeparture = restriction?.ClosedOnDeparture !== undefined;
    const hasMinLos = restriction?.MinLOS !== undefined;
    const hasMaxLos = restriction?.MaxLOS !== undefined;

    const stopSell = hasStopSell
      ? getBooleanNodeValue(restriction?.StopSell, false)
      : false;
    const closedOnArrival = hasClosedOnArrival
      ? getBooleanNodeValue(restriction?.ClosedOnArrival, false)
      : false;
    const closedOnDeparture = hasClosedOnDeparture
      ? getBooleanNodeValue(restriction?.ClosedOnDeparture, false)
      : false;
    const minLos = hasMinLos ? Number(getNodeValue(restriction?.MinLOS)) : null;
    const maxLos = hasMaxLos ? Number(getNodeValue(restriction?.MaxLOS)) : null;

    for (const date of dates) {
      const referenceId = `${integration.external_hotel_id}:${roomTypeCode}:restriction:${ratePlanCode}:${date}`;

      const [existingRows] = await db.query(
        `
          SELECT stop_sell, closed_on_arrival, closed_on_departure, min_los, max_los
          FROM channel_manager_daily_controls
          WHERE integration_id = ?
            AND external_room_type_id = ?
            AND external_rate_plan_id = ?
            AND control_date = ?
          LIMIT 1
        `,
        [integration.id, roomTypeCode, ratePlanCode, date],
      );

      const existing = existingRows[0];
      const mergedStopSell = hasStopSell
        ? stopSell
          ? 1
          : 0
        : Number(existing?.stop_sell ?? 0);
      const mergedClosedOnArrival = hasClosedOnArrival
        ? closedOnArrival
          ? 1
          : 0
        : Number(existing?.closed_on_arrival ?? 0);
      const mergedClosedOnDeparture = hasClosedOnDeparture
        ? closedOnDeparture
          ? 1
          : 0
        : Number(existing?.closed_on_departure ?? 0);
      const mergedMinLos = hasMinLos
        ? Number.isFinite(minLos) && minLos > 0
          ? minLos
          : 1
        : Number(existing?.min_los ?? 1);
      const mergedMaxLos = hasMaxLos
        ? Number.isFinite(maxLos) && maxLos > 0
          ? maxLos
          : 31
        : Number(existing?.max_los ?? 31);

      await db.query(
        `
          INSERT INTO channel_manager_daily_controls
            (id, integration_id, property_id, provider_key, external_room_type_id, external_rate_plan_id, control_date, stop_sell, closed_on_arrival, closed_on_departure, min_los, max_los, source_reference_id)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            stop_sell = VALUES(stop_sell),
            closed_on_arrival = VALUES(closed_on_arrival),
            closed_on_departure = VALUES(closed_on_departure),
            min_los = VALUES(min_los),
            max_los = VALUES(max_los),
            source_reference_id = VALUES(source_reference_id),
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          generateUUID(),
          integration.id,
          mapping.property_id,
          providerKey,
          roomTypeCode,
          ratePlanCode,
          date,
          mergedStopSell,
          mergedClosedOnArrival,
          mergedClosedOnDeparture,
          mergedMinLos,
          mergedMaxLos,
          referenceId,
        ],
      );

      if (hasStopSell && stopSell) {
        await db.query(
          `
            INSERT INTO property_blackout_dates
              (id, property_id, start_date, end_date, reason, blackout_source, source_provider_key, source_reference_id, created_by)
            VALUES
              (?, ?, ?, ?, ?, 'channel_manager', ?, ?, 'admin')
            ON DUPLICATE KEY UPDATE
              reason = VALUES(reason),
              source_provider_key = VALUES(source_provider_key),
              created_by = VALUES(created_by)
          `,
          [
            generateUUID(),
            mapping.property_id,
            date,
            date,
            `Blocked by ${providerKey} restriction update`,
            providerKey,
            referenceId,
          ],
        );
      } else if (hasStopSell) {
        await db.query(
          `
            DELETE FROM property_blackout_dates
            WHERE property_id = ?
              AND start_date = ?
              AND end_date = ?
              AND blackout_source = 'channel_manager'
              AND source_provider_key = ?
              AND source_reference_id = ?
          `,
          [mapping.property_id, date, date, providerKey, referenceId],
        );
      }
    }
  }

  return { ok: true };
};

const processRestrictionGet = async ({ parsedPayload, integration }) => {
  const root = parsedPayload.GetRestrictionRQ;
  const roomTypeCode = String(getNodeValue(root?.RoomTypeCode) || "").trim();
  const ratePlanCode =
    String(getNodeValue(root?.RatePlanCode) || "").trim() || "DEFAULT";
  const startDate = normalizeDateInput(root?.StartDate);
  const endDate = normalizeDateInput(root?.EndDate);

  if (!roomTypeCode || !startDate || !endDate) {
    return {
      ok: false,
      code: "106",
      message: "RoomTypeCode, StartDate and EndDate are required",
    };
  }

  const mapping = await resolvePropertyMapping({
    integrationId: integration.id,
    roomTypeCode,
  });
  if (!mapping) {
    return {
      ok: false,
      code: "102",
      message: `RoomTypeCode not mapped: ${roomTypeCode}`,
    };
  }

  const dates = enumerateDates(startDate, endDate);
  if (dates.length === 0) {
    return { ok: false, code: "107", message: "Invalid date range" };
  }

  const [controlRows] = await db.query(
    `
      SELECT
        control_date,
        stop_sell,
        closed_on_arrival,
        closed_on_departure,
        min_los,
        max_los
      FROM channel_manager_daily_controls
      WHERE integration_id = ?
        AND external_room_type_id = ?
        AND external_rate_plan_id = ?
        AND control_date BETWEEN ? AND ?
    `,
    [integration.id, roomTypeCode, ratePlanCode, startDate, endDate],
  );

  const controlByDate = new Map(
    controlRows
      .map((row) => [toDateKey(row.control_date), row])
      .filter(([date]) => Boolean(date)),
  );

  const restrictions = dates.map((date) => {
    const row = controlByDate.get(date);
    return {
      date: formatDateForStayflexi(date),
      stopSell: Boolean(row?.stop_sell),
      closedOnArrival: Boolean(row?.closed_on_arrival),
      closedOnDeparture: Boolean(row?.closed_on_departure),
      minLos: Number(row?.min_los ?? 1),
      maxLos: Number(row?.max_los ?? 31),
    };
  });

  return {
    ok: true,
    responseXml: buildStayflexiRestrictionResponseXml({
      hotelCode: integration.external_hotel_id,
      roomTypeCode,
      ratePlanCode,
      version: root?.["@_Version"] || "1.0",
      restrictions,
    }),
  };
};

const processHotelDetailGet = async ({ parsedPayload, integration }) => {
  const root =
    parsedPayload.HotelDetailRQ || parsedPayload.GetHotelDetailRQ || {};

  const [mappingRows] = await db.query(
    `
      SELECT
        m.property_id,
        m.external_room_type_id,
        p.title AS property_title
      FROM channel_manager_property_mappings m
      INNER JOIN properties p ON p.id = m.property_id
      WHERE m.integration_id = ?
        AND m.is_active = 1
        AND p.deleted_at IS NULL
      ORDER BY m.external_room_type_id ASC, p.title ASC
    `,
    [integration.id],
  );

  if (mappingRows.length === 0) {
    return {
      ok: false,
      code: "102",
      message: `No property mappings found for hotel code ${integration.external_hotel_id}`,
    };
  }

  const roomMap = new Map();
  for (const row of mappingRows) {
    const roomTypeCode = String(row.external_room_type_id || "").trim();
    if (!roomTypeCode) continue;

    if (!roomMap.has(roomTypeCode)) {
      roomMap.set(roomTypeCode, {
        roomTypeCode,
        roomTypeName: String(row.property_title || roomTypeCode),
        isActive: true,
      });
    }
  }

  const roomCodes = Array.from(roomMap.keys());
  if (roomCodes.length === 0) {
    return {
      ok: false,
      code: "102",
      message: `No active room mappings found for hotel code ${integration.external_hotel_id}`,
    };
  }

  const [ratePlanRows] = await db.query(
    `
      SELECT DISTINCT external_room_type_id, external_rate_plan_id
      FROM channel_manager_daily_controls
      WHERE integration_id = ?
        AND external_room_type_id IN (?)
    `,
    [integration.id, roomCodes],
  );

  const planMap = new Map();
  for (const row of ratePlanRows) {
    const roomTypeCode = String(row.external_room_type_id || "").trim();
    const ratePlanCode =
      String(row.external_rate_plan_id || "").trim() || "DEFAULT";
    if (!roomTypeCode) continue;
    planMap.set(`${roomTypeCode}::${ratePlanCode}`, {
      roomTypeCode,
      ratePlanCode,
    });
  }

  // Guarantee at least one plan per mapped room for first-time onboarding flows.
  for (const roomTypeCode of roomCodes) {
    const key = `${roomTypeCode}::DEFAULT`;
    if (!planMap.has(key)) {
      planMap.set(key, {
        roomTypeCode,
        ratePlanCode: "DEFAULT",
      });
    }
  }

  const ratePlans = Array.from(planMap.values())
    .sort((a, b) => {
      if (a.roomTypeCode === b.roomTypeCode) {
        return a.ratePlanCode.localeCompare(b.ratePlanCode);
      }
      return a.roomTypeCode.localeCompare(b.roomTypeCode);
    })
    .map((plan) => ({
      roomTypeCode: plan.roomTypeCode,
      roomTypeName:
        roomMap.get(plan.roomTypeCode)?.roomTypeName || plan.roomTypeCode,
      ratePlanCode: plan.ratePlanCode,
      ratePlanName:
        plan.ratePlanCode === "DEFAULT" ? "Standard" : plan.ratePlanCode,
      isActive: true,
    }));

  return {
    ok: true,
    responseXml: buildStayflexiHotelDetailResponseXml({
      hotelCode: integration.external_hotel_id,
      version: root?.["@_Version"] || "1.0",
      rooms: Array.from(roomMap.values()),
      ratePlans,
    }),
  };
};

const resolveExternalEventId = (parsedPayload) => {
  if (!parsedPayload || typeof parsedPayload !== "object") return null;

  const rootName = getXmlRootName(parsedPayload);
  const rootNode = rootName ? parsedPayload[rootName] : null;

  return (
    rootNode?.event_id ||
    rootNode?.eventId ||
    rootNode?.booking_id ||
    rootNode?.bookingId ||
    null
  );
};

export const receiveProviderWebhook = asyncHandler(async (req, res) => {
  const providerKey = req.channelManager?.providerKey || "unknown";
  const rawXmlPayload = typeof req.body === "string" ? req.body : "";

  if (!rawXmlPayload.trim()) {
    const xml = buildChannelManagerAckXml({
      providerKey,
      status: "error",
      message: "Empty XML payload",
    });

    return res.status(400).type("application/xml").send(xml);
  }

  let parsedPayload;
  try {
    parsedPayload = parseXmlPayload(rawXmlPayload);
  } catch (error) {
    const xml = buildChannelManagerAckXml({
      providerKey,
      status: "error",
      message: `Invalid XML: ${error.message}`,
    });

    return res.status(400).type("application/xml").send(xml);
  }

  const eventType = getXmlRootName(parsedPayload);
  const operationType = getOperationFromRoot(eventType);

  if (
    req.cmExpectedOperation &&
    operationType !== req.cmExpectedOperation
  ) {
    return res
      .status(400)
      .type("application/xml")
      .send(
        buildStayflexiErrorXml({
          code: "405",
          description: `Invalid operation for this endpoint: expected ${req.cmExpectedOperation}, received ${eventType || "unknown"}`,
        }),
      );
  }

  const externalEventId = resolveExternalEventId(parsedPayload);
  const webhookEventId = generateUUID();

  try {
    await db.query(
      `
        INSERT INTO channel_manager_webhook_events
          (id, integration_id, provider_key, external_event_id, event_type, xml_payload, parsed_payload, processing_status)
        VALUES
          (?, NULL, ?, ?, ?, ?, ?, 'received')
      `,
      [
        webhookEventId,
        providerKey,
        externalEventId,
        operationType === "unknown" ? eventType : operationType,
        rawXmlPayload,
        JSON.stringify(parsedPayload),
      ],
    );
  } catch (error) {
    const xml = buildChannelManagerAckXml({
      providerKey,
      status: "error",
      message:
        error.code === "ER_NO_SUCH_TABLE"
          ? "Channel manager tables not migrated"
          : "Failed to persist webhook event",
    });

    return res.status(500).type("application/xml").send(xml);
  }

  const rootNode = parsedPayload[eventType] || {};
  const hotelCode =
    rootNode?.["@_HotelCode"] || rootNode?.HotelCode || req.query?.hotelCode;

  if (!hotelCode) {
    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "failed",
      errorMessage: "HotelCode is required",
    });
    return res
      .status(400)
      .type("application/xml")
      .send(
        buildStayflexiErrorXml({
          code: "101",
          description: "HotelCode not found",
        }),
      );
  }

  const integration = await resolveIntegration({ providerKey, hotelCode });
  if (!integration) {
    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "failed",
      errorMessage: `No integration found for hotel code ${hotelCode}`,
    });
    return res
      .status(404)
      .type("application/xml")
      .send(
        buildStayflexiErrorXml({
          code: "101",
          description: `HotelCode not mapped: ${hotelCode}`,
        }),
      );
  }

  await db.query(
    `UPDATE channel_manager_webhook_events SET integration_id = ? WHERE id = ?`,
    [integration.id, webhookEventId],
  );

  if (operationType === "update_inventory") {
    const result = await processInventoryUpdate({
      parsedPayload,
      providerKey,
      integration,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res
      .status(200)
      .type("application/xml")
      .send(buildStayflexiSuccessXml());
  }

  if (operationType === "get_inventory") {
    const result = await processInventoryGet({
      parsedPayload,
      integration,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res.status(200).type("application/xml").send(result.responseXml);
  }

  if (operationType === "update_rates") {
    const result = await processRatesUpdate({
      parsedPayload,
      integration,
      providerKey,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res
      .status(200)
      .type("application/xml")
      .send(buildStayflexiSuccessXml());
  }

  if (operationType === "get_rates") {
    const result = await processRatesGet({
      parsedPayload,
      integration,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res.status(200).type("application/xml").send(result.responseXml);
  }

  if (operationType === "update_restriction") {
    const result = await processRestrictionUpdate({
      parsedPayload,
      integration,
      providerKey,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res
      .status(200)
      .type("application/xml")
      .send(buildStayflexiSuccessXml());
  }

  if (operationType === "get_restriction") {
    const result = await processRestrictionGet({
      parsedPayload,
      integration,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res.status(200).type("application/xml").send(result.responseXml);
  }

  if (operationType === "get_hotel_detail") {
    const result = await processHotelDetailGet({
      parsedPayload,
      integration,
    });

    if (!result.ok) {
      await updateWebhookEventStatus({
        eventId: webhookEventId,
        status: "failed",
        errorMessage: result.message,
      });
      return res
        .status(400)
        .type("application/xml")
        .send(
          buildStayflexiErrorXml({
            code: result.code,
            description: result.message,
          }),
        );
    }

    await updateWebhookEventStatus({
      eventId: webhookEventId,
      status: "processed",
    });
    return res.status(200).type("application/xml").send(result.responseXml);
  }

  await updateWebhookEventStatus({
    eventId: webhookEventId,
    status: "ignored",
    errorMessage: `Unsupported operation root: ${eventType}`,
  });

  return res
    .status(400)
    .type("application/xml")
    .send(
      buildStayflexiErrorXml({
        code: "405",
        description: `Unsupported operation: ${eventType}`,
      }),
    );
});
