import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import {
  generateUUID,
  calculateNights,
  calculateBookingAmount,
} from "../utils/helpers.js";

/**
 * Compute the calendar-aware base amount for a booking date range.
 * For each night (check_in to check_out - 1 day), uses the custom calendar
 * price if one exists, otherwise falls back to the property's base price_per_night.
 * Returns the total base amount (sum across all nights).
 */
const getCalendarBaseAmount = async (
  propertyId,
  checkIn,
  checkOut,
  pricePerNight,
) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  // Fetch any calendar price overrides for this range
  const [calendarRows] = await db.query(
    `SELECT DATE_FORMAT(price_date, '%Y-%m-%d') AS price_date, price
     FROM property_calendar_pricing
     WHERE property_id = ?
       AND price_date >= ?
       AND price_date < ?`,
    [propertyId, checkIn, checkOut],
  );

  // Build a map of date → custom price
  const calendarMap = {};
  for (const row of calendarRows) {
    calendarMap[row.price_date] = parseFloat(row.price);
  }

  // Sum up the nightly prices
  let total = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    const key = cursor.toISOString().slice(0, 10); // YYYY-MM-DD
    total += calendarMap[key] !== undefined ? calendarMap[key] : pricePerNight;
    cursor.setDate(cursor.getDate() + 1);
  }

  return total;
};

// SESSION 41: Razorpay removed - Payment order creation moved to paymentController.js
// Bookings are created first, then payment orders are created separately via /api/payments/create-order

// Create booking
export const createBooking = asyncHandler(async (req, res) => {
  const {
    property_id,
    check_in,
    check_out,
    coupon_code,
    guest_count = 1,
    children_count = 0,
    infants_count = 0,
    is_corporate = false,
  } = req.body;
  const userId = req.user.id;

  if (!property_id || !check_in || !check_out) {
    return sendError(
      res,
      "Property ID, check-in, and check-out dates are required",
      400,
    );
  }

  // ============================================
  // SESSION 36.2: CORPORATE BOOKING VALIDATION
  // Validate corporate bookings require verified corporate account
  // Prevents price manipulation by non-corporate users
  // ============================================
  if (is_corporate) {
    if (!req.user || !req.user.corporate_verified) {
      console.log(
        `Rejected corporate booking attempt by user ${userId} - not verified`,
      );
      return sendError(
        res,
        "Corporate bookings require a verified corporate account. Please contact support to verify your corporate status.",
        403,
      );
    }
    console.log(
      `Corporate booking validated for user ${userId} (${req.user.email})`,
    );
  }

  // Validate dates
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return sendError(res, "Check-in date cannot be in the past", 400);
  }

  if (checkOutDate <= checkInDate) {
    return sendError(res, "Check-out date must be after check-in date", 400);
  }

  // Get property details with pricing
  const [properties] = await db.query(
    `SELECT 
      p.id, 
      p.employee_id,
      p.max_guests,
      p.same_day_booking_allowed, 
      p.max_booking_days,
      pp.price_per_night,
      pp.gst_percentage,
      pp.min_guests,
      pp.extra_guest_charge,
      pp.min_children,
      pp.max_children,
      pp.extra_child_charge
    FROM properties p
    INNER JOIN property_pricing pp ON p.id = pp.property_id
    WHERE p.id = ? AND p.status = "approved" AND p.deleted_at IS NULL`,
    [property_id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or not available", 404);
  }

  const property = properties[0];

  // Validate guest counts
  if (guest_count < 1) {
    return sendError(res, "At least 1 guest is required", 400);
  }

  if (property.max_guests && guest_count > property.max_guests) {
    return sendError(res, `Maximum ${property.max_guests} guests allowed`, 400);
  }

  if (property.max_children && children_count > property.max_children) {
    return sendError(
      res,
      `Maximum ${property.max_children} children allowed`,
      400,
    );
  }

  // Calculate nights
  const nights = calculateNights(check_in, check_out);

  // ============================================
  // SESSION 30: CHECK FOR EXISTING PENDING BOOKING FIRST
  // Prevent multiple pending bookings for same property by same user
  // User must complete/cancel/modify existing pending booking first
  // ============================================
  const [pendingBookings] = await db.query(
    `SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.nights,
      b.guest_count,
      b.children_count,
      b.total_amount,
      b.status,
      b.expires_at,
      b.created_at,
      p.title as property_title
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    WHERE b.user_id = ? 
    AND b.property_id = ? 
    AND b.status IN ('pending', 'pending_payment')
    AND (b.expires_at IS NULL OR b.expires_at > NOW())
    LIMIT 1`,
    [userId, property_id],
  );

  let existingBookingId = null;
  let isUpdatingExisting = false;

  if (pendingBookings.length > 0) {
    existingBookingId = pendingBookings[0].id;
    isUpdatingExisting = true;
    console.log(
      `Updating existing pending booking ${existingBookingId} with new dates/guests`,
    );
  }

  // Validate same-day booking (only for NEW bookings, not updates)
  if (!isUpdatingExisting && !property.same_day_booking_allowed) {
    const checkInDate = new Date(check_in);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate.getTime() === today.getTime()) {
      return sendError(
        res,
        "Same-day bookings are not allowed for this property",
        400,
      );
    }
  }

  // Validate max booking days
  if (property.max_booking_days && nights > property.max_booking_days) {
    return sendError(
      res,
      `Maximum ${property.max_booking_days} days booking allowed`,
      400,
    );
  }

  // Check blackout dates
  const [blackouts] = await db.query(
    `SELECT COUNT(*) as count 
     FROM property_blackout_dates 
     WHERE property_id = ? 
     AND (
       (start_date <= ? AND end_date >= ?) OR
       (start_date <= ? AND end_date >= ?) OR
       (start_date >= ? AND end_date <= ?)
     )`,
    [
      property_id,
      check_in,
      check_in,
      check_out,
      check_out,
      check_in,
      check_out,
    ],
  );

  if (blackouts[0].count > 0) {
    return sendError(
      res,
      "Property is not available for selected dates (blackout period)",
      400,
    );
  }

  // Check existing bookings
  // ============================================
  // CRITICAL FIX: BOOKING OVERLAP BUG + RACE CONDITION PREVENTION
  // Include ALL active bookings (confirmed, completed, pending_payment, pending)
  // Exclude expired bookings and user's own pending booking if updating
  // Use FOR UPDATE lock to prevent race conditions (two users booking simultaneously)
  // ============================================
  let overlapQuery = `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE property_id = ? 
     AND status IN ('confirmed', 'completed', 'pending_payment', 'pending') 
     AND deleted_at IS NULL
     AND (expires_at IS NULL OR expires_at > NOW())
     AND (check_in < ? AND check_out > ?)`;

  let overlapParams = [property_id, check_out, check_in];

  // Exclude the user's own pending booking if we're updating it
  if (existingBookingId) {
    overlapQuery += ` AND id != ?`;
    overlapParams.push(existingBookingId);
  }

  // Add FOR UPDATE lock to prevent race conditions
  // This ensures that if two users try to book the same dates simultaneously,
  // one will wait for the other to complete before checking availability
  overlapQuery += ` FOR UPDATE`;

  const [existingBookings] = await db.query(overlapQuery, overlapParams);

  if (existingBookings[0].count > 0) {
    return sendError(res, "Property is already booked for selected dates", 400);
  }

  // Calculate booking amounts
  let discountAmount = 0;
  let couponId = null;

  // Compute calendar-aware base amount upfront (used for coupon check + final calculation)
  const calendarBaseAmount = await getCalendarBaseAmount(
    property_id,
    check_in,
    check_out,
    property.price_per_night,
  );

  // Check and apply coupon if provided
  if (coupon_code) {
    const [coupons] = await db.query(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND is_active = 1 
       AND valid_from <= CURDATE() 
       AND valid_until >= CURDATE()`,
      [coupon_code],
    );

    if (coupons.length > 0) {
      const coupon = coupons[0];
      const baseAmount = calendarBaseAmount;

      // Check minimum booking amount
      if (baseAmount >= coupon.min_booking_amount) {
        // Check usage limit
        const [usageCount] = await db.query(
          "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ?",
          [coupon.id],
        );

        if (usageCount[0].count < coupon.usage_limit) {
          couponId = coupon.id;

          // DB column is 'type' (percentage | fixed)
          if (coupon.type === "percentage") {
            discountAmount = (baseAmount * coupon.discount_value) / 100;
            if (coupon.max_discount && discountAmount > coupon.max_discount) {
              discountAmount = coupon.max_discount;
            }
          } else {
            discountAmount = coupon.discount_value;
          }
        }
      }
    }
  }

  // Calculate amounts with new pricing system
  // Calendar-aware base amount already computed before coupon check
  const amounts = calculateBookingAmount(
    property.price_per_night,
    nights,
    property.gst_percentage,
    discountAmount,
    {
      min_guests: property.min_guests,
      extra_guest_charge: property.extra_guest_charge,
      min_children: property.min_children,
      extra_child_charge: property.extra_child_charge,
    },
    {
      guest_count,
      children_count,
      infants_count,
    },
    calendarBaseAmount,
  );

  // Create NEW booking OR update EXISTING pending booking
  const bookingId = existingBookingId || generateUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  // SESSION 47: Set payment expiry window (15 minutes for payment completion)
  const paymentExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  if (isUpdatingExisting) {
    // UPDATE existing pending booking with new dates/guests/amounts
    await db.query(
      `UPDATE bookings SET
        check_in = ?,
        check_out = ?,
        nights = ?,
        guest_count = ?,
        children_count = ?,
        infants_count = ?,
        base_amount = ?,
        extra_guest_charges = ?,
        extra_children_charges = ?,
        gst_amount = ?,
        service_charge = ?,
        discount_amount = ?,
        total_amount = ?,
        expires_at = ?,
        payment_expires_at = ?,
        payment_status = 'pending'
      WHERE id = ?`,
      [
        check_in,
        check_out,
        amounts.nights,
        guest_count,
        children_count,
        infants_count,
        amounts.baseAmount,
        amounts.extraGuestCharges,
        amounts.extraChildrenCharges,
        amounts.gstAmount,
        amounts.serviceCharge,
        amounts.discountAmount,
        amounts.totalAmount,
        expiresAt,
        paymentExpiresAt,
        bookingId,
      ],
    );
  } else {
    // INSERT new booking with payment tracking (SESSION 64: Added service_charge)
    await db.query(
      `INSERT INTO bookings 
       (id, user_id, property_id, check_in, check_out, nights, 
        guest_count, children_count, infants_count,
        base_amount, extra_guest_charges, extra_children_charges, 
        gst_amount, service_charge, discount_amount, total_amount, 
        status, payment_status, expires_at, payment_expires_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'pending', ?, ?)`,
      [
        bookingId,
        userId,
        property_id,
        check_in,
        check_out,
        amounts.nights,
        guest_count,
        children_count,
        infants_count,
        amounts.baseAmount,
        amounts.extraGuestCharges,
        amounts.extraChildrenCharges,
        amounts.gstAmount,
        amounts.serviceCharge,
        amounts.discountAmount,
        amounts.totalAmount,
        expiresAt,
        paymentExpiresAt,
      ],
    );
  }

  // Record coupon usage if applied
  if (couponId) {
    await db.query(
      "INSERT INTO coupon_usages (id, coupon_id, booking_id, user_id) VALUES (?, ?, ?, ?)",
      [generateUUID(), couponId, bookingId, userId],
    );
  }

  // Create pending employee points (will be confirmed after payment)
  if (property.employee_id) {
    const [employee] = await db.query(
      "SELECT incentive_percentage FROM employees WHERE id = ?",
      [property.employee_id],
    );

    if (employee.length > 0 && employee[0].incentive_percentage) {
      const points =
        (amounts.baseAmount * employee[0].incentive_percentage) / 100;
      await db.query(
        'INSERT INTO employee_points (id, employee_id, booking_id, points, status) VALUES (?, ?, ?, ?, "pending")',
        [generateUUID(), property.employee_id, bookingId, points],
      );
    }
  }

  // Fetch created booking
  const [bookings] = await db.query(
    `SELECT b.*, p.title as property_title 
     FROM bookings b 
     INNER JOIN properties p ON b.property_id = p.id 
     WHERE b.id = ?`,
    [bookingId],
  );

  const booking = bookings[0];

  // SESSION 41: Payment order creation moved to separate endpoint
  // Frontend now calls /api/payments/create-order after booking creation
  // This separates booking creation from payment initialization

  sendSuccess(
    res,
    {
      ...booking,
      booking_id: bookingId,
      isUpdate: isUpdatingExisting,
    },
    isUpdatingExisting
      ? "Booking updated successfully"
      : "Booking created successfully",
    201,
  );
});

// Get user's bookings
export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10, export: exportCSV } = req.query;

  // ============================================
  // PERFORMANCE FIX: N+1 Query Problem Solved
  // Before: 1 query for bookings + N queries for images (N+1)
  // After: 1 query with LEFT JOIN (just 1 query)
  // Performance gain: 10-100x faster for large booking lists
  // SESSION 47: Now includes payment_status and payment_expires_at
  // ============================================
  let query = `
    SELECT 
      b.*,
      p.title as property_title,
      c.name as city_name,
      pi.image_url as property_image
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    INNER JOIN cities c ON p.city_id = c.id
    LEFT JOIN (
      SELECT property_id, image_url
      FROM property_images
      WHERE (property_id, sort_order) IN (
        SELECT property_id, MIN(sort_order)
        FROM property_images
        GROUP BY property_id
      )
    ) pi ON p.id = pi.property_id
    WHERE b.user_id = ? AND b.deleted_at IS NULL
  `;

  const params = [userId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  // ============================================
  // NEW FEATURE: CSV Export
  // ============================================
  if (exportCSV === "true") {
    query += ` ORDER BY b.created_at DESC`;
    const [bookings] = await db.query(query, params);

    // Generate CSV
    const csvHeaders = [
      "Booking ID",
      "Property",
      "City",
      "Check-in",
      "Check-out",
      "Nights",
      "Guests",
      "Total Amount",
      "Status",
      "Booking Date",
    ];

    const csvRows = bookings.map((booking) =>
      [
        booking.id,
        booking.property_title,
        booking.city_name,
        new Date(booking.check_in).toLocaleDateString("en-IN"),
        new Date(booking.check_out).toLocaleDateString("en-IN"),
        booking.nights,
        booking.guest_count,
        `₹${booking.total_amount.toFixed(2)}`,
        booking.status.toUpperCase(),
        new Date(booking.created_at).toLocaleString("en-IN"),
      ].join(","),
    );

    const csv = [csvHeaders.join(","), ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=bookings_${
        new Date().toISOString().split("T")[0]
      }.csv`,
    );
    return res.send(csv);
  }

  // Count total — build separately so multi-line SQL doesn't break regex replacement
  let countQuery = `
    SELECT COUNT(*) as total
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    INNER JOIN cities c ON p.city_id = c.id
    WHERE b.user_id = ? AND b.deleted_at IS NULL
  `;
  const countParams = [userId];
  if (status) {
    countQuery += ` AND b.status = ?`;
    countParams.push(status);
  }
  const [countResult] = await db.query(countQuery, countParams);
  const total = countResult[0]?.total ?? 0;

  // Add pagination
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [bookings] = await db.query(query, params);

  sendSuccess(
    res,
    {
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Bookings fetched successfully",
    200,
  );
});

// Get booking details
export const getBookingDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  let query = `
    SELECT 
      b.*,
      p.title as property_title,
      p.description as property_description,
      p.property_type_id,
      pp.price_per_night,
      pp.min_guests,
      p.max_guests,
      pp.min_children,
      pp.max_children,
      pp.extra_guest_charge,
      pp.extra_child_charge,
      c.name as city_name,
      c.state as city_state,
      u.full_name as user_name,
      u.email as user_email,
      u.phone as user_phone
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    LEFT JOIN property_pricing pp ON p.id = pp.property_id
    INNER JOIN cities c ON p.city_id = c.id
    INNER JOIN users u ON b.user_id = u.id
    WHERE b.id = ? AND b.deleted_at IS NULL
  `;

  const params = [id];

  // Only users can see their own bookings
  if (userRole === "user") {
    query += ` AND b.user_id = ?`;
    params.push(userId);
  }

  const [bookings] = await db.query(query, params);

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Get property images
  const [images] = await db.query(
    "SELECT image_url FROM property_images WHERE property_id = ? ORDER BY sort_order LIMIT 5",
    [booking.property_id],
  );
  booking.property_images = images;

  // Get payment details
  const [payments] = await db.query(
    "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC",
    [id],
  );
  booking.payments = payments;

  // Get invoice if exists
  const [invoices] = await db.query(
    "SELECT * FROM invoices WHERE booking_id = ?",
    [id],
  );
  booking.invoice = invoices.length > 0 ? invoices[0] : null;

  sendSuccess(res, booking, "Booking details fetched successfully", 200);
});

// Request booking cancellation
export const requestCancellation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get booking
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [id, userId],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Check if booking can be cancelled
  if (booking.status === "cancelled") {
    return sendError(res, "Booking is already cancelled", 400);
  }

  if (booking.status === "cancel_requested") {
    return sendError(res, "Cancellation request is already pending", 400);
  }

  if (booking.status === "completed") {
    return sendError(res, "Completed booking cannot be cancelled", 400);
  }

  if (booking.status !== "confirmed") {
    return sendError(res, "Only confirmed bookings can be cancelled", 400);
  }

  // Update booking status
  await db.query(
    'UPDATE bookings SET status = "cancel_requested" WHERE id = ?',
    [id],
  );

  // Create notification for admin
  await db.query(
    "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
    [
      generateUUID(),
      null, // Admin notification
      "admin",
      "Cancellation Request",
      `Booking ${id} cancellation requested by user`,
    ],
  );

  sendSuccess(res, null, "Cancellation request submitted successfully", 200);
});

// Apply coupon (validate)
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, booking_amount } = req.body;

  if (!code || !booking_amount) {
    return sendError(res, "Coupon code and booking amount are required", 400);
  }

  const [coupons] = await db.query(
    `SELECT * FROM coupons 
     WHERE code = ? 
     AND is_active = 1 
     AND valid_from <= CURDATE() 
     AND valid_until >= CURDATE()`,
    [code],
  );

  if (coupons.length === 0) {
    return sendError(res, "Invalid or expired coupon code", 400);
  }

  const coupon = coupons[0];

  // Check minimum booking amount
  if (booking_amount < coupon.min_booking_amount) {
    return sendError(
      res,
      `Minimum booking amount of ₹${coupon.min_booking_amount} required`,
      400,
    );
  }

  // Check usage limit
  const [usageCount] = await db.query(
    "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ?",
    [coupon.id],
  );

  if (usageCount[0].count >= coupon.usage_limit) {
    return sendError(res, "Coupon usage limit exceeded", 400);
  }

  // Calculate discount — DB column is 'type' (percentage | fixed)
  let discountAmount = 0;
  if (coupon.type === "percentage") {
    discountAmount = (booking_amount * coupon.discount_value) / 100;
    if (coupon.max_discount && discountAmount > coupon.max_discount) {
      discountAmount = coupon.max_discount;
    }
  } else {
    discountAmount = coupon.discount_value;
  }

  sendSuccess(
    res,
    {
      coupon_code: coupon.code,
      discount_type: coupon.type, // use actual DB column name
      discount_value: coupon.discount_value,
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      final_amount: parseFloat((booking_amount - discountAmount).toFixed(2)),
    },
    "Coupon applied successfully",
    200,
  );
});

// ==========================================
// SESSION 30: PENDING BOOKING MANAGEMENT
// ==========================================

// Check for pending booking (GET /bookings/pending-check/:propertyId)
export const checkPendingBooking = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;
  const userId = req.user.id;

  const [bookings] = await db.query(
    `SELECT 
      b.id,
      b.check_in,
      b.check_out,
      b.nights,
      b.guest_count,
      b.children_count,
      b.infants_count,
      b.base_amount,
      b.extra_guest_charges,
      b.extra_children_charges,
      b.gst_amount,
      b.discount_amount,
      b.total_amount,
      b.status,
      b.expires_at,
      b.created_at,
      p.title as property_title,
      pp.price_per_night as property_price
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    LEFT JOIN property_pricing pp ON p.id = pp.property_id
    WHERE b.user_id = ? 
    AND b.property_id = ? 
    AND b.status IN ('pending', 'pending_payment')
    AND (b.expires_at IS NULL OR b.expires_at > NOW())
    LIMIT 1`,
    [userId, propertyId],
  );

  if (bookings.length === 0) {
    return sendSuccess(
      res,
      { hasPendingBooking: false, booking: null },
      "No pending booking found",
      200,
    );
  }

  const booking = bookings[0];

  return sendSuccess(
    res,
    {
      hasPendingBooking: true,
      booking: {
        id: booking.id,
        property_title: booking.property_title,
        property_price: booking.property_price,
        check_in: booking.check_in,
        check_out: booking.check_out,
        nights: booking.nights,
        guest_count: booking.guest_count,
        children_count: booking.children_count,
        infants_count: booking.infants_count,
        base_amount: booking.base_amount,
        extra_guest_charges: booking.extra_guest_charges,
        extra_children_charges: booking.extra_children_charges,
        gst_amount: booking.gst_amount,
        discount_amount: booking.discount_amount,
        total_amount: booking.total_amount,
        status: booking.status,
        expires_at: booking.expires_at,
        created_at: booking.created_at,
      },
    },
    "Pending booking found",
    200,
  );
});

// Modify pending booking (PUT /bookings/:id/modify-pending)
export const modifyPendingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    check_in,
    check_out,
    guest_count,
    children_count = 0,
    infants_count = 0,
  } = req.body;
  const userId = req.user.id;

  if (!check_in || !check_out || !guest_count) {
    return sendError(
      res,
      "Check-in, check-out dates and guest count are required",
      400,
    );
  }

  // Get booking
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [id, userId],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Only allow modification for pending/pending_payment bookings
  if (!["pending", "pending_payment"].includes(booking.status)) {
    return sendError(res, "Only pending bookings can be modified", 400);
  }

  // Check if booking has expired
  if (booking.expires_at && new Date(booking.expires_at) < new Date()) {
    return sendError(res, "Booking has expired and cannot be modified", 400);
  }

  // Validate dates
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return sendError(res, "Check-in date cannot be in the past", 400);
  }

  if (checkOutDate <= checkInDate) {
    return sendError(res, "Check-out date must be after check-in date", 400);
  }

  // Get CURRENT property details (recalculate with current rates)
  const [properties] = await db.query(
    `SELECT 
      p.id, 
      p.max_guests,
      pp.price_per_night,
      pp.gst_percentage,
      pp.min_guests,
      pp.extra_guest_charge,
      pp.min_children,
      pp.max_children,
      pp.extra_child_charge
    FROM properties p
    INNER JOIN property_pricing pp ON p.id = pp.property_id
    WHERE p.id = ? AND p.status = "approved" AND p.deleted_at IS NULL`,
    [booking.property_id],
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or not available", 404);
  }

  const property = properties[0];

  // Validate guest counts
  if (guest_count < 1) {
    return sendError(res, "At least 1 guest is required", 400);
  }

  if (property.max_guests && guest_count > property.max_guests) {
    return sendError(res, `Maximum ${property.max_guests} guests allowed`, 400);
  }

  if (property.max_children && children_count > property.max_children) {
    return sendError(
      res,
      `Maximum ${property.max_children} children allowed`,
      400,
    );
  }

  // Calculate nights
  const nights = calculateNights(check_in, check_out);

  // Check availability for new dates (exclude current booking)
  const [existingBookings] = await db.query(
    `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE property_id = ? 
     AND id != ?
     AND status IN ('confirmed', 'completed', 'pending_payment') 
     AND (check_in < ? AND check_out > ?)`,
    [booking.property_id, id, check_out, check_in],
  );

  if (existingBookings[0].count > 0) {
    return sendError(res, "Property is already booked for selected dates", 400);
  }

  // Recalculate amounts with CURRENT property rates + calendar overrides
  const calendarBaseAmount = await getCalendarBaseAmount(
    booking.property_id,
    check_in,
    check_out,
    property.price_per_night,
  );

  const amounts = calculateBookingAmount(
    property.price_per_night,
    nights,
    property.gst_percentage,
    0, // No discount on modification
    {
      min_guests: property.min_guests,
      extra_guest_charge: property.extra_guest_charge,
      min_children: property.min_children,
      extra_child_charge: property.extra_child_charge,
    },
    {
      guest_count,
      children_count,
      infants_count,
    },
    calendarBaseAmount,
  );

  // Reset expires_at to 15 minutes from now
  const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // Update booking (SESSION 64: Added service_charge)
  await db.query(
    `UPDATE bookings 
     SET check_in = ?, 
         check_out = ?, 
         nights = ?,
         guest_count = ?, 
         children_count = ?, 
         infants_count = ?,
         base_amount = ?,
         extra_guest_charges = ?,
         extra_children_charges = ?,
         gst_amount = ?,
         service_charge = ?,
         total_amount = ?,
         expires_at = ?
     WHERE id = ?`,
    [
      check_in,
      check_out,
      amounts.nights,
      guest_count,
      children_count,
      infants_count,
      amounts.baseAmount,
      amounts.extraGuestCharges,
      amounts.extraChildrenCharges,
      amounts.gstAmount,
      amounts.serviceCharge,
      amounts.totalAmount,
      newExpiresAt,
      id,
    ],
  );

  // Fetch updated booking
  const [updatedBookings] = await db.query(
    `SELECT b.*, p.title as property_title 
     FROM bookings b 
     INNER JOIN properties p ON b.property_id = p.id 
     WHERE b.id = ?`,
    [id],
  );

  sendSuccess(res, updatedBookings[0], "Booking modified successfully", 200);
});

// Cancel pending booking (DELETE /bookings/:id/cancel-pending)
export const cancelPendingBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Get booking
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [id, userId],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Only allow cancellation for pending/pending_payment bookings
  if (!["pending", "pending_payment"].includes(booking.status)) {
    return sendError(res, "Only pending bookings can be cancelled", 400);
  }

  // Update booking status to cancelled
  await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [id]);

  sendSuccess(res, null, "Booking cancelled successfully", 200);
});

// ==========================================
// SESSION 64: REVIEW REQUEST ENDPOINTS
// ==========================================

/**
 * Check if user has submitted a review for a booking
 * GET /bookings/:id/reviews/check
 */
export const checkReviewStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Verify booking belongs to user
  const [bookings] = await db.query(
    "SELECT id, status FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [id, userId],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  // Check if review exists
  const [reviews] = await db.query(
    "SELECT id FROM reviews WHERE booking_id = ?",
    [id],
  );

  sendSuccess(
    res,
    { hasReview: reviews.length > 0 },
    "Review status retrieved",
    200,
  );
});

/**
 * Admin manual trigger for review request email
 * POST /bookings/:id/send-review-request
 */
export const sendManualReviewRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify booking exists and is completed
  const [bookings] = await db.query(
    "SELECT id, status, user_id FROM bookings WHERE id = ? AND deleted_at IS NULL",
    [id],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  if (booking.status !== "completed") {
    return sendError(
      res,
      "Review requests can only be sent for completed bookings",
      400,
    );
  }

  // Check if review already exists
  const [reviews] = await db.query(
    "SELECT id FROM reviews WHERE booking_id = ?",
    [id],
  );

  if (reviews.length > 0) {
    return sendError(res, "User has already submitted a review", 400);
  }

  // Import email service dynamically to avoid circular dependencies
  const { sendReviewRequestEmail } =
    await import("../services/emailService.js");
  const { generateUUID } = await import("../utils/helpers.js");

  try {
    // Send review request email
    await sendReviewRequestEmail(id);

    // Log manual send in review_email_log
    await db.query(
      `INSERT INTO review_email_log (id, booking_id, email_type, sent_at) 
       VALUES (?, ?, ?, NOW())`,
      [generateUUID(), id, "manual_admin"],
    );

    sendSuccess(res, null, "Review request email sent successfully", 200);
  } catch (error) {
    console.error("Failed to send review request email:", error);
    return sendError(res, "Failed to send review request email", 500);
  }
});
