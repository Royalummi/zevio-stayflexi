import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { sanitizeRichText } from "../utils/sanitize.js";
import { getPaginationMeta } from "../middlewares/pagination.js";

/**
 * @route   GET /api/vendor/dashboard
 * @desc    Get vendor dashboard statistics
 * @access  Private (Vendor only)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;

  // Get properties count by status
  const [propertiesCount] = await db.query(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_approval,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive
    FROM properties
    WHERE vendor_id = ? AND deleted_at IS NULL`,
    [vendorId],
  );

  // Get bookings count and revenue
  const [bookingsData] = await db.query(
    `SELECT 
      COUNT(CASE WHEN b.status IN ('confirmed', 'completed') THEN 1 END) as active_bookings,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
      SUM(CASE WHEN b.booking_source = 'channel_manager' THEN 1 ELSE 0 END) as channel_manager_bookings
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL`,
    [vendorId],
  );

  // Get average rating from reviews
  const [ratingData] = await db.query(
    `SELECT 
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(r.id) as total_reviews
    FROM reviews r
    INNER JOIN properties p ON r.property_id = p.id
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL AND r.status = 'approved'`,
    [vendorId],
  );

  // Get pending settlements
  const [settlementsData] = await db.query(
    `SELECT COALESCE(SUM(amount), 0) as pending_settlements
    FROM vendor_settlements
    WHERE vendor_id = ? AND status = 'pending'`,
    [vendorId],
  );

  const stats = {
    // Property counts by status
    total: propertiesCount[0].total,
    draft: propertiesCount[0].draft,
    pending_approval: propertiesCount[0].pending_approval,
    approved: propertiesCount[0].approved,
    inactive: propertiesCount[0].inactive,

    // Bookings & Revenue
    active_bookings: bookingsData[0].active_bookings,
    total_revenue: parseFloat(bookingsData[0].total_revenue),
    channel_manager_bookings: parseInt(
      bookingsData[0].channel_manager_bookings || 0,
    ),

    // Reviews
    avg_rating: parseFloat(ratingData[0].avg_rating).toFixed(1),
    total_reviews: ratingData[0].total_reviews,

    // Settlements
    pending_settlements: parseFloat(settlementsData[0].pending_settlements),
  };

  sendSuccess(res, stats, "Dashboard stats retrieved successfully");
});

/**
 * @route   GET /api/vendor/properties
 * @desc    Get vendor properties
 * @access  Private (Vendor only)
 */
const getProperties = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status, city } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.status,
      p.photos,
      p.created_at,
      c.name as city_name,
      pr.price_per_night,
      pr.gst_percentage,
      (SELECT COUNT(*) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_bookings,
      (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE property_id = p.id AND status IN ('confirmed', 'completed')) as total_revenue,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM channel_manager_property_mappings m
          INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
          WHERE m.property_id = p.id
            AND m.is_active = 1
            AND i.provider_key = 'stayflexi'
            AND i.deleted_at IS NULL
            AND i.status IN ('active', 'test')
        ) THEN 1 ELSE 0
      END as is_stayflexi_active
    FROM properties p
    LEFT JOIN cities c ON p.city_id = c.id
    LEFT JOIN property_pricing pr ON p.id = pr.property_id
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }

  if (city) {
    query += ` AND c.name = ?`;
    params.push(city);
  }

  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [properties] = await db.query(query, params);

  // Extract thumbnail from photos JSON for each property
  const propertiesWithThumbnail = properties.map((p) => {
    let thumbnail = null;
    try {
      if (p.photos) {
        const photosArray =
          typeof p.photos === "string" ? JSON.parse(p.photos) : p.photos;
        if (Array.isArray(photosArray) && photosArray.length > 0) {
          thumbnail = photosArray[0];
        }
      }
    } catch (_) {
      // ignore parse errors
    }
    const { photos, ...rest } = p;
    return { ...rest, thumbnail };
  });

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM properties p LEFT JOIN cities c ON p.city_id = c.id WHERE p.vendor_id = ? AND p.deleted_at IS NULL`;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND p.status = ?`;
    countParams.push(status);
  }

  if (city) {
    countQuery += ` AND c.name = ?`;
    countParams.push(city);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  sendSuccess(res, {
    properties: propertiesWithThumbnail,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * @route   GET /api/vendor/bookings
 * @desc    Get bookings for vendor properties
 * @access  Private (Vendor only)
 */
const getBookings = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  // booking_source filter: only allow the two valid ENUM values
  const rawSource = String(req.query.booking_source || "")
    .trim()
    .toLowerCase();
  const sourceFilter =
    rawSource === "direct" || rawSource === "channel_manager"
      ? rawSource
      : null;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.nights,
      b.total_amount,
      b.status,
      b.booking_source,
      b.source_reference_id,
      b.created_at,
      p.title as property_title,
      p.id as property_id,
      u.full_name as guest_name,
      u.email as guest_email,
      u.phone as guest_phone
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    LEFT JOIN users u ON b.user_id = u.id
    WHERE p.vendor_id = ?
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  if (sourceFilter) {
    query += ` AND b.booking_source = ?`;
    params.push(sourceFilter);
  }

  query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [bookings] = await db.query(query, params);

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ?
  `;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND b.status = ?`;
    countParams.push(status);
  }

  if (sourceFilter) {
    countQuery += ` AND b.booking_source = ?`;
    countParams.push(sourceFilter);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Aggregate stats across ALL bookings for this vendor (not just current page)
  // Stats are always computed without source filter to keep totals stable
  const statsQuery = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN b.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN b.status = 'pending_payment' THEN 1 ELSE 0 END) as pending_payment,
      SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN b.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      COALESCE(SUM(CASE WHEN b.status IN ('confirmed', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
      SUM(CASE WHEN b.booking_source = 'channel_manager' THEN 1 ELSE 0 END) as channel_manager_bookings
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ?
  `;
  const [statsResult] = await db.query(statsQuery, [vendorId]);

  sendSuccess(res, {
    bookings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: statsResult[0],
  });
});

/**
 * @route   GET /api/vendor/settlements
 * @desc    Get vendor settlements
 * @access  Private (Vendor only)
 */
const getSettlements = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      vs.id,
      vs.amount,
      vs.status,
      vs.payment_proof,
      vs.created_at,
      vs.booking_id,
      vs.booking_base_amount,
      vs.booking_gst_amount,
      vs.booking_service_charge,
      vs.booking_discount_amount,
      vs.booking_total_amount,
      vs.vendor_gross_amount,
      vs.platform_fee,
      vs.platform_fee_gst,
      vs.total_deduction,
      vs.is_vendor_gst,
      p_booking.title as property_title
    FROM vendor_settlements vs
    LEFT JOIN bookings b ON vs.booking_id = b.id
    LEFT JOIN properties p_booking ON b.property_id = p_booking.id
    WHERE vs.vendor_id = ?
  `;

  const params = [vendorId];

  if (status) {
    query += ` AND vs.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY vs.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [settlements] = await db.query(query, params);

  // Get total count
  let countQuery = `SELECT COUNT(*) as total FROM vendor_settlements WHERE vendor_id = ?`;
  const countParams = [vendorId];

  if (status) {
    countQuery += ` AND status = ?`;
    countParams.push(status);
  }

  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total || 0;

  // Aggregate stats across ALL settlements for this vendor (not just current page)
  let settlementStatsQuery = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN vs.status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN vs.status = 'paid' THEN 1 ELSE 0 END) as paid,
      COALESCE(SUM(vs.amount), 0) as total_amount,
      COALESCE(SUM(CASE WHEN vs.status = 'pending' THEN vs.amount ELSE 0 END), 0) as pending_amount,
      COALESCE(SUM(CASE WHEN vs.status = 'paid' THEN vs.amount ELSE 0 END), 0) as paid_amount
    FROM vendor_settlements vs
    WHERE vs.vendor_id = ?
  `;
  const settlementStatsParams = [vendorId];
  if (status) {
    settlementStatsQuery += ` AND vs.status = ?`;
    settlementStatsParams.push(status);
  }
  const [settlementStatsResult] = await db.query(
    settlementStatsQuery,
    settlementStatsParams,
  );

  sendSuccess(res, {
    settlements,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: settlementStatsResult[0],
  });
});

/**
 * @route   GET /api/vendor/analytics
 * @desc    Get vendor analytics
 * @access  Private (Vendor only)
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const { start_date, end_date } = req.query;

  // Revenue by property
  const [revenueByProperty] = await db.query(
    `SELECT 
      p.title,
      COUNT(b.id) as total_bookings,
      COALESCE(SUM(b.total_amount), 0) as total_revenue
    FROM properties p
    LEFT JOIN bookings b ON p.id = b.property_id 
      AND b.status IN ('confirmed', 'completed')
      ${start_date ? "AND b.created_at >= ?" : ""}
      ${end_date ? "AND b.created_at <= ?" : ""}
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL
    GROUP BY p.id, p.title
    ORDER BY total_revenue DESC`,
    [
      ...(start_date ? [start_date] : []),
      ...(end_date ? [end_date] : []),
      vendorId,
    ],
  );

  // Booking trends (monthly)
  let trendsQuery = `
    SELECT 
      DATE_FORMAT(b.created_at, '%Y-%m') as month,
      COUNT(*) as bookings,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE p.vendor_id = ? AND p.deleted_at IS NULL AND b.status IN ('confirmed', 'completed')
  `;
  const trendsParams = [vendorId];

  if (start_date) {
    trendsQuery += ` AND b.created_at >= ?`;
    trendsParams.push(start_date);
  }
  if (end_date) {
    trendsQuery += ` AND b.created_at <= ?`;
    trendsParams.push(end_date);
  }

  trendsQuery += `
    GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
    ORDER BY month DESC
    LIMIT 12
  `;

  const [bookingTrends] = await db.query(trendsQuery, trendsParams);

  sendSuccess(res, {
    revenue_by_property: revenueByProperty,
    booking_trends: bookingTrends,
  });
});

/**
 * @route   PUT /api/vendor/bank-details
 * @desc    Update vendor bank details
 * @access  Private (Vendor only)
 */
const updateBankDetails = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
  const {
    bank_name,
    account_holder_name,
    account_number,
    ifsc_code,
    branch_name,
  } = req.body;

  if (!account_number || !ifsc_code || !account_holder_name) {
    return sendError(
      res,
      "account_holder_name, account_number, and ifsc_code are required",
      400,
    );
  }

  // Sanitize: only allow known safe characters in banking fields
  const safeIfsc = String(ifsc_code)
    .replace(/[^A-Z0-9]/gi, "")
    .substring(0, 11);
  const safeAccount = String(account_number)
    .replace(/[^0-9]/g, "")
    .substring(0, 20);

  const bankDetails = {
    bank_name: bank_name ? String(bank_name).substring(0, 100) : null,
    account_holder_name: String(account_holder_name).substring(0, 150),
    account_number: safeAccount,
    ifsc_code: safeIfsc,
    branch_name: branch_name ? String(branch_name).substring(0, 100) : null,
  };

  await db.query(`UPDATE vendors SET bank_details = ? WHERE id = ?`, [
    JSON.stringify(bankDetails),
    vendorId,
  ]);

  sendSuccess(res, bankDetails, "Bank details updated successfully");
});

const ALLOWED_SYNC_STATUSES = new Set([
  "received",
  "processed",
  "failed",
  "ignored",
]);

const MAX_FILTER_DATE_RANGE_DAYS = 93;

const getChannelManagerSyncLogs = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
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

  const whereClauses = ["i.vendor_id = ?"];
  const whereParams = [vendorId];

  if (providerKey) {
    whereClauses.push("e.provider_key = ?");
    whereParams.push(providerKey);
  }

  if (processingStatus) {
    if (!ALLOWED_SYNC_STATUSES.has(processingStatus)) {
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
      "(LOWER(e.event_type) LIKE ? OR LOWER(COALESCE(e.external_event_id, '')) LIKE ? OR LOWER(COALESCE(i.external_hotel_id, '')) LIKE ? OR LOWER(COALESCE(e.error_message, '')) LIKE ?)",
    );
    whereParams.push(
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
      `%${search}%`,
    );
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

  const whereSql = `WHERE ${whereClauses.join(" AND ")}`;

  const [countRows] = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM channel_manager_webhook_events e
      INNER JOIN channel_manager_integrations i ON i.id = e.integration_id
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
      INNER JOIN channel_manager_integrations i ON i.id = e.integration_id
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
      INNER JOIN channel_manager_integrations i ON i.id = e.integration_id
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
    "Vendor channel manager sync logs fetched",
    200,
  );
});

const getChannelManagerSyncLogById = asyncHandler(async (req, res) => {
  const vendorId = req.user.id;
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
      INNER JOIN channel_manager_integrations i ON i.id = e.integration_id
      WHERE e.id = ?
        AND e.provider_key = ?
        AND i.vendor_id = ?
      LIMIT 1
    `,
    [id, providerKey, vendorId],
  );

  if (rows.length === 0) {
    return sendError(res, "Sync log not found", 404);
  }

  return sendSuccess(
    res,
    rows[0],
    "Vendor channel manager sync log fetched",
    200,
  );
});

const getPropertyStayflexiStatus = asyncHandler(async (req, res) => {
  const propertyId = String(req.params.propertyId || "").trim();
  if (!propertyId) return sendError(res, "Property ID is required", 400);

  const vendorId = req.user?.vendor_id || req.user?.id;
  if (!vendorId) return sendError(res, "Vendor context missing", 401);

  // Verify the vendor owns this property
  const [[property]] = await db.query(
    `SELECT id FROM properties WHERE id = ? AND vendor_id = ? LIMIT 1`,
    [propertyId, vendorId],
  );
  if (!property) return sendError(res, "Property not found", 404);

  const [[mappingRow]] = await db.query(
    `
      SELECT m.is_active, i.provider_key, i.external_hotel_id, i.status AS integration_status
      FROM channel_manager_property_mappings m
      INNER JOIN channel_manager_integrations i ON i.id = m.integration_id
      WHERE m.property_id = ?
        AND m.is_active = 1
        AND i.provider_key = 'stayflexi'
        AND i.deleted_at IS NULL
        AND i.status IN ('active', 'test')
      ORDER BY
        CASE i.status WHEN 'active' THEN 0 WHEN 'test' THEN 1 ELSE 2 END,
        i.updated_at DESC
      LIMIT 1
    `,
    [propertyId],
  );

  return sendSuccess(
    res,
    {
      property_id: propertyId,
      is_stayflexi_active: Boolean(mappingRow),
      provider_key: mappingRow?.provider_key || null,
      external_hotel_id: mappingRow?.external_hotel_id || null,
      integration_status: mappingRow?.integration_status || null,
    },
    "Stayflexi status fetched",
    200,
  );
});

export default {
  getDashboardStats,
  getProperties,
  getBookings,
  getSettlements,
  getAnalytics,
  updateBankDetails,
  getChannelManagerSyncLogs,
  getChannelManagerSyncLogById,
  getPropertyStayflexiStatus,
};
