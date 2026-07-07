import db from "../config/database.js";

const normalizeDateKey = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const parsed = new Date(dateInput);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

export const propertyHasActiveCmMapping = async (propertyId) => {
  const [rows] = await db.query(
    `
      SELECT m.id
      FROM channel_manager_property_mappings m
      INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
      WHERE m.property_id = ?
        AND m.is_active = 1
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
      LIMIT 1
    `,
    [propertyId],
  );

  return rows.length > 0;
};

export const getPropertyMinStayDays = async (propertyId) => {
  const [rows] = await db.query(
    `SELECT min_stay_days FROM properties WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [propertyId],
  );

  if (rows.length === 0) return 1;

  const value = Number(rows[0].min_stay_days);
  return Number.isFinite(value) && value > 0 ? value : 1;
};

export const getCmMinLosForCheckIn = async (propertyId, checkIn) => {
  const checkInKey = normalizeDateKey(checkIn);
  if (!checkInKey) return null;

  const [rows] = await db.query(
    `
      SELECT c.min_los
      FROM channel_manager_daily_controls c
      INNER JOIN channel_manager_property_mappings m
        ON m.property_id = c.property_id
       AND m.integration_id = c.integration_id
      INNER JOIN channel_manager_integrations i ON i.id = c.integration_id
      WHERE c.property_id = ?
        AND c.control_date = ?
        AND m.is_active = 1
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
        AND c.min_los IS NOT NULL
      ORDER BY c.min_los DESC
      LIMIT 1
    `,
    [propertyId, checkInKey],
  );

  if (rows.length === 0) return null;

  const value = Number(rows[0].min_los);
  return Number.isFinite(value) && value > 0 ? value : null;
};

export const getEffectiveMinStayDetails = async (propertyId, checkIn = null) => {
  const propertyMinStayDays = await getPropertyMinStayDays(propertyId);
  const hasCmMapping = await propertyHasActiveCmMapping(propertyId);

  let channelManagerMinLos = null;
  if (hasCmMapping && checkIn) {
    channelManagerMinLos = await getCmMinLosForCheckIn(propertyId, checkIn);
  }

  const effectiveMinStay =
    channelManagerMinLos !== null
      ? Math.max(propertyMinStayDays, channelManagerMinLos)
      : propertyMinStayDays;

  let source = "property";
  if (hasCmMapping && channelManagerMinLos !== null) {
    if (channelManagerMinLos > propertyMinStayDays) {
      source = "channel_manager";
    } else if (channelManagerMinLos < propertyMinStayDays) {
      source = "property";
    } else {
      source = "combined";
    }
  }

  let closedOnArrival = false;
  if (hasCmMapping && checkIn) {
    const restriction = await getCmRestrictionForDate(propertyId, checkIn);
    closedOnArrival = Boolean(restriction?.closed_on_arrival);
  }

  return {
    effective_min_stay: effectiveMinStay,
    property_min_stay_days: propertyMinStayDays,
    channel_manager_min_los: channelManagerMinLos,
    has_cm_mapping: hasCmMapping,
    source,
    check_in: normalizeDateKey(checkIn),
    closed_on_arrival: closedOnArrival,
  };
};

export const getCmRestrictionForDate = async (propertyId, dateInput) => {
  const dateKey = normalizeDateKey(dateInput);
  if (!dateKey) return null;

  const [rows] = await db.query(
    `
      SELECT
        DATE_FORMAT(c.control_date, '%Y-%m-%d') AS control_date,
        c.closed_on_arrival,
        c.closed_on_departure,
        c.min_los
      FROM channel_manager_daily_controls c
      INNER JOIN channel_manager_property_mappings m
        ON m.property_id = c.property_id
       AND m.integration_id = c.integration_id
      INNER JOIN channel_manager_integrations i ON i.id = c.integration_id
      WHERE c.property_id = ?
        AND c.control_date = ?
        AND m.is_active = 1
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
      ORDER BY c.updated_at DESC
      LIMIT 1
    `,
    [propertyId, dateKey],
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    control_date: row.control_date,
    closed_on_arrival: Boolean(row.closed_on_arrival),
    closed_on_departure: Boolean(row.closed_on_departure),
    min_los: row.min_los !== null ? Number(row.min_los) : null,
  };
};

export const getCmRestrictionsForYear = async (propertyId, year) => {
  const yearNum = Number(year);
  if (!Number.isFinite(yearNum) || yearNum < 2000 || yearNum > 2100) {
    return { has_cm_mapping: false, restrictions: [] };
  }

  const hasCmMapping = await propertyHasActiveCmMapping(propertyId);
  if (!hasCmMapping) {
    return { has_cm_mapping: false, restrictions: [] };
  }

  const fromDate = `${yearNum}-01-01`;
  const toDate = `${yearNum}-12-31`;

  const [rows] = await db.query(
    `
      SELECT
        DATE_FORMAT(c.control_date, '%Y-%m-%d') AS control_date,
        c.closed_on_arrival,
        c.closed_on_departure,
        c.min_los
      FROM channel_manager_daily_controls c
      INNER JOIN channel_manager_property_mappings m
        ON m.property_id = c.property_id
       AND m.integration_id = c.integration_id
      INNER JOIN channel_manager_integrations i ON i.id = c.integration_id
      WHERE c.property_id = ?
        AND c.control_date BETWEEN ? AND ?
        AND m.is_active = 1
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
      ORDER BY c.control_date ASC
    `,
    [propertyId, fromDate, toDate],
  );

  return {
    has_cm_mapping: true,
    restrictions: rows.map((row) => ({
      control_date: row.control_date,
      closed_on_arrival: Boolean(row.closed_on_arrival),
      closed_on_departure: Boolean(row.closed_on_departure),
      min_los: row.min_los !== null ? Number(row.min_los) : null,
    })),
  };
};

export const validateStayLength = async ({
  propertyId,
  checkIn,
  checkOut,
  nights,
}) => {
  const stayRules = await getEffectiveMinStayDetails(propertyId, checkIn);
  const effectiveMinStay = stayRules.effective_min_stay;
  const ok = Number(nights) >= effectiveMinStay;

  return {
    ok,
    effectiveMinStay,
    propertyMinStayDays: stayRules.property_min_stay_days,
    channelManagerMinLos: stayRules.channel_manager_min_los,
    hasCmMapping: stayRules.has_cm_mapping,
    source: stayRules.source,
    message: ok
      ? null
      : `Minimum stay is ${effectiveMinStay} ${
          effectiveMinStay === 1 ? "night" : "nights"
        } for the selected check-in date`,
  };
};

export const validateCoaCod = async ({ propertyId, checkIn, checkOut }) => {
  const hasCmMapping = await propertyHasActiveCmMapping(propertyId);
  if (!hasCmMapping) {
    return { ok: true };
  }

  const checkInRestriction = await getCmRestrictionForDate(propertyId, checkIn);
  if (checkInRestriction?.closed_on_arrival) {
    return {
      ok: false,
      message: "Check-in is not available on the selected date",
      field: "check_in",
    };
  }

  const checkOutRestriction = await getCmRestrictionForDate(
    propertyId,
    checkOut,
  );
  if (checkOutRestriction?.closed_on_departure) {
    return {
      ok: false,
      message: "Check-out is not available on the selected date",
      field: "check_out",
    };
  }

  return { ok: true };
};
