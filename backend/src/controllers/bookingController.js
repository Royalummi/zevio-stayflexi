import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import {
  generateUUID,
  calculateNights,
  calculateBookingAmount,
} from "../utils/helpers.js";

// Create booking
export const createBooking = asyncHandler(async (req, res) => {
  const { property_id, check_in, check_out, coupon_code } = req.body;
  const userId = req.user.id;

  if (!property_id || !check_in || !check_out) {
    return sendError(
      res,
      "Property ID, check-in, and check-out dates are required",
      400
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

  // Get property details
  const [properties] = await db.query(
    'SELECT id, price_per_night, gst_percentage, employee_id FROM properties WHERE id = ? AND status = "approved" AND deleted_at IS NULL',
    [property_id]
  );

  if (properties.length === 0) {
    return sendError(res, "Property not found or not available", 404);
  }

  const property = properties[0];

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
    [property_id, check_in, check_in, check_out, check_out, check_in, check_out]
  );

  if (blackouts[0].count > 0) {
    return sendError(
      res,
      "Property is not available for selected dates (blackout period)",
      400
    );
  }

  // Check existing bookings
  const [existingBookings] = await db.query(
    `SELECT COUNT(*) as count 
     FROM bookings 
     WHERE property_id = ? 
     AND status IN ('confirmed', 'completed') 
     AND (check_in < ? AND check_out > ?)`,
    [property_id, check_out, check_in]
  );

  if (existingBookings[0].count > 0) {
    return sendError(res, "Property is already booked for selected dates", 400);
  }

  // Calculate booking amounts
  const nights = calculateNights(check_in, check_out);
  let discountAmount = 0;
  let couponId = null;

  // Check and apply coupon if provided
  if (coupon_code) {
    const [coupons] = await db.query(
      `SELECT * FROM coupons 
       WHERE code = ? 
       AND status = 'active' 
       AND start_date <= CURDATE() 
       AND end_date >= CURDATE()`,
      [coupon_code]
    );

    if (coupons.length > 0) {
      const coupon = coupons[0];
      const baseAmount = property.price_per_night * nights;

      // Check minimum booking amount
      if (baseAmount >= coupon.min_booking_amount) {
        // Check usage limit
        const [usageCount] = await db.query(
          "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ?",
          [coupon.id]
        );

        if (usageCount[0].count < coupon.usage_limit) {
          couponId = coupon.id;

          if (coupon.discount_type === "percentage") {
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

  const amounts = calculateBookingAmount(
    property.price_per_night,
    nights,
    property.gst_percentage,
    discountAmount
  );

  // Create booking
  const bookingId = generateUUID();
  await db.query(
    `INSERT INTO bookings 
     (id, user_id, property_id, check_in, check_out, nights, base_amount, gst_amount, discount_amount, total_amount, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment')`,
    [
      bookingId,
      userId,
      property_id,
      check_in,
      check_out,
      amounts.nights,
      amounts.baseAmount,
      amounts.gstAmount,
      amounts.discountAmount,
      amounts.totalAmount,
    ]
  );

  // Record coupon usage if applied
  if (couponId) {
    await db.query(
      "INSERT INTO coupon_usages (id, coupon_id, booking_id, user_id) VALUES (?, ?, ?, ?)",
      [generateUUID(), couponId, bookingId, userId]
    );
  }

  // Create pending employee points (will be confirmed after payment)
  if (property.employee_id) {
    const [employee] = await db.query(
      "SELECT incentive_percentage FROM employees WHERE id = ?",
      [property.employee_id]
    );

    if (employee.length > 0 && employee[0].incentive_percentage) {
      const points =
        (amounts.baseAmount * employee[0].incentive_percentage) / 100;
      await db.query(
        'INSERT INTO employee_points (id, employee_id, booking_id, points, status) VALUES (?, ?, ?, ?, "pending")',
        [generateUUID(), property.employee_id, bookingId, points]
      );
    }
  }

  // Fetch created booking
  const [bookings] = await db.query(
    `SELECT b.*, p.title as property_title 
     FROM bookings b 
     INNER JOIN properties p ON b.property_id = p.id 
     WHERE b.id = ?`,
    [bookingId]
  );

  sendSuccess(res, bookings[0], "Booking created successfully", 201);
});

// Get user's bookings
export const getMyBookings = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 10 } = req.query;

  let query = `
    SELECT 
      b.*,
      p.title as property_title,
      c.name as city_name,
      (SELECT image_url FROM property_images WHERE property_id = p.id ORDER BY sort_order LIMIT 1) as property_image
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
    INNER JOIN cities c ON p.city_id = c.id
    WHERE b.user_id = ? AND b.deleted_at IS NULL
  `;

  const params = [userId];

  if (status) {
    query += ` AND b.status = ?`;
    params.push(status);
  }

  // Count total
  const countQuery = query.replace(
    /SELECT.*FROM/,
    "SELECT COUNT(*) as total FROM"
  );
  const [countResult] = await db.query(countQuery, params);
  const total = countResult[0].total;

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
    200
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
      p.price_per_night,
      c.name as city_name,
      c.state as city_state,
      u.full_name as user_name,
      u.email as user_email,
      u.phone as user_phone
    FROM bookings b
    INNER JOIN properties p ON b.property_id = p.id
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
    [booking.property_id]
  );
  booking.property_images = images;

  // Get payment details
  const [payments] = await db.query(
    "SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC",
    [id]
  );
  booking.payments = payments;

  // Get invoice if exists
  const [invoices] = await db.query(
    "SELECT * FROM invoices WHERE booking_id = ?",
    [id]
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
    [id, userId]
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
    [id]
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
    ]
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
     AND status = 'active' 
     AND start_date <= CURDATE() 
     AND end_date >= CURDATE()`,
    [code]
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
      400
    );
  }

  // Check usage limit
  const [usageCount] = await db.query(
    "SELECT COUNT(*) as count FROM coupon_usages WHERE coupon_id = ?",
    [coupon.id]
  );

  if (usageCount[0].count >= coupon.usage_limit) {
    return sendError(res, "Coupon usage limit exceeded", 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "percentage") {
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
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: parseFloat(discountAmount.toFixed(2)),
      final_amount: parseFloat((booking_amount - discountAmount).toFixed(2)),
    },
    "Coupon applied successfully",
    200
  );
});
