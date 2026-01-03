import Razorpay from "razorpay";
import crypto from "crypto";
import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { booking_id } = req.body;
  const userId = req.user.id;

  if (!booking_id) {
    return sendError(res, "Booking ID is required", 400);
  }

  // Get booking details
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [booking_id, userId]
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Check if booking is in correct status
  if (booking.status !== "pending_payment") {
    return sendError(res, "Booking is not pending payment", 400);
  }

  // Create Razorpay order
  const options = {
    amount: Math.round(booking.total_amount * 100), // Amount in paise
    currency: "INR",
    receipt: booking_id,
    notes: {
      booking_id: booking_id,
      user_id: userId,
    },
  };

  try {
    const order = await razorpay.orders.create(options);

    // Store payment record
    const paymentId = generateUUID();
    await db.query(
      "INSERT INTO payments (id, booking_id, gateway, gateway_payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        paymentId,
        booking_id,
        "razorpay",
        order.id,
        booking.total_amount,
        "pending",
      ]
    );

    sendSuccess(
      res,
      {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        booking_id: booking_id,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
      },
      "Payment order created successfully",
      200
    );
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    return sendError(res, "Failed to create payment order", 500);
  }
});

// Verify payment (called from frontend after payment)
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    booking_id,
  } = req.body;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !booking_id
  ) {
    return sendError(res, "Missing payment verification data", 400);
  }

  // Verify signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature !== expectedSign) {
    // Update payment as failed
    await db.query(
      'UPDATE payments SET status = "failed" WHERE gateway_payment_id = ?',
      [razorpay_order_id]
    );

    return sendError(res, "Invalid payment signature", 400);
  }

  // Update payment status
  await db.query(
    'UPDATE payments SET status = "success", gateway_payment_id = ? WHERE gateway_payment_id = ?',
    [razorpay_payment_id, razorpay_order_id]
  );

  // Update booking status
  await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [
    booking_id,
  ]);

  // Confirm employee points
  await db.query(
    'UPDATE employee_points SET status = "confirmed" WHERE booking_id = ?',
    [booking_id]
  );

  // Generate invoice
  const invoiceId = generateUUID();
  const [bookings] = await db.query("SELECT * FROM bookings WHERE id = ?", [
    booking_id,
  ]);
  const booking = bookings[0];

  await db.query(
    "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      invoiceId,
      booking_id,
      booking.user_id,
      booking.base_amount,
      booking.gst_amount,
      booking.total_amount,
      "invoice",
    ]
  );

  // Send confirmation email
  try {
    await sendBookingConfirmationEmail(booking_id);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }

  // Create notification
  await db.query(
    "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
    [
      generateUUID(),
      booking.user_id,
      "user",
      "Booking Confirmed",
      `Your booking has been confirmed. Booking ID: ${booking_id}`,
    ]
  );

  sendSuccess(
    res,
    { booking_id },
    "Payment verified and booking confirmed",
    200
  );
});

// Razorpay webhook handler
export const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (signature !== expectedSignature) {
    return sendError(res, "Invalid webhook signature", 400);
  }

  const event = req.body.event;
  const payload = req.body.payload.payment.entity;

  if (event === "payment.captured") {
    // Payment successful
    const orderId = payload.order_id;
    const paymentId = payload.id;

    // Update payment
    await db.query(
      'UPDATE payments SET status = "success", gateway_payment_id = ? WHERE gateway_payment_id = ?',
      [paymentId, orderId]
    );

    // Get booking from payment
    const [payments] = await db.query(
      "SELECT booking_id FROM payments WHERE gateway_payment_id = ?",
      [orderId]
    );

    if (payments.length > 0) {
      const bookingId = payments[0].booking_id;

      // Update booking
      await db.query('UPDATE bookings SET status = "confirmed" WHERE id = ?', [
        bookingId,
      ]);

      // Confirm employee points
      await db.query(
        'UPDATE employee_points SET status = "confirmed" WHERE booking_id = ?',
        [bookingId]
      );

      // Generate invoice if not exists
      const [existingInvoices] = await db.query(
        "SELECT id FROM invoices WHERE booking_id = ?",
        [bookingId]
      );

      if (existingInvoices.length === 0) {
        const [bookings] = await db.query(
          "SELECT * FROM bookings WHERE id = ?",
          [bookingId]
        );
        const booking = bookings[0];

        await db.query(
          "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            generateUUID(),
            bookingId,
            booking.user_id,
            booking.base_amount,
            booking.gst_amount,
            booking.total_amount,
            "invoice",
          ]
        );
      }

      // Send confirmation email
      try {
        await sendBookingConfirmationEmail(bookingId);
      } catch (error) {
        console.error("Failed to send confirmation email:", error);
      }
    }
  } else if (event === "payment.failed") {
    // Payment failed
    const orderId = payload.order_id;

    await db.query(
      'UPDATE payments SET status = "failed" WHERE gateway_payment_id = ?',
      [orderId]
    );
  }

  res.status(200).json({ status: "ok" });
});

// Get payment history (admin)
export const getPaymentHistory = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  let query = `
    SELECT 
      p.*,
      b.id as booking_id,
      b.total_amount as booking_amount,
      u.full_name as user_name,
      u.email as user_email,
      prop.title as property_title
    FROM payments p
    INNER JOIN bookings b ON p.booking_id = b.id
    INNER JOIN users u ON b.user_id = u.id
    INNER JOIN properties prop ON b.property_id = prop.id
    WHERE 1=1
  `;

  const params = [];

  if (status) {
    query += ` AND p.status = ?`;
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
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const [payments] = await db.query(query, params);

  sendSuccess(
    res,
    {
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
    "Payment history fetched successfully",
    200
  );
});
