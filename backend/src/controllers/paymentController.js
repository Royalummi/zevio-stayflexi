/**
 * Payment Controller - Cashfree Integration
 * SESSION 41: Replaced Razorpay with Cashfree Payment Gateway
 */

import db from "../config/database.js";
import { asyncHandler, sendSuccess, sendError } from "../utils/response.js";
import { generateUUID } from "../utils/helpers.js";
import { sendBookingConfirmationEmail } from "../services/emailService.js";
import cashfreeService from "../services/cashfree.service.js";

/**
 * Create payment order with Cashfree
 */
export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { booking_id } = req.body;
  const userId = req.user.id;

  if (!booking_id) {
    return sendError(res, "Booking ID is required", 400);
  }

  // Get booking details
  const [bookings] = await db.query(
    "SELECT * FROM bookings WHERE id = ? AND user_id = ? AND deleted_at IS NULL",
    [booking_id, userId],
  );

  if (bookings.length === 0) {
    return sendError(res, "Booking not found", 404);
  }

  const booking = bookings[0];

  // Check if booking is in correct status
  if (booking.status !== "pending_payment") {
    return sendError(res, "Booking is not pending payment", 400);
  }

  // Get user details for Cashfree customer info
  const [users] = await db.query("SELECT * FROM users WHERE id = ?", [userId]);
  if (users.length === 0) {
    return sendError(res, "User not found", 404);
  }
  const user = users[0];

  try {
    // Check if payment order already exists for this booking
    const [existingPayments] = await db.query(
      `SELECT * FROM payments 
       WHERE booking_id = ? 
       AND gateway = 'cashfree' 
       AND status IN ('pending', 'initiated')
       ORDER BY created_at DESC 
       LIMIT 1`,
      [booking_id],
    );

    // If a valid payment order exists, try to reuse it
    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];

      try {
        // Try to fetch the existing order from Cashfree
        const existingOrder = await cashfreeService.getOrder(
          existingPayment.gateway_payment_id,
        );

        // If order is still active, reuse it
        if (existingOrder.success && existingOrder.order) {
          const orderData = existingOrder.order;

          // Check if order is in a reusable state (ACTIVE or similar)
          if (
            orderData.order_status === "ACTIVE" &&
            orderData.payment_session_id
          ) {
            console.log(
              `Reusing existing Cashfree order: ${existingPayment.gateway_payment_id}`,
            );

            return sendSuccess(
              res,
              {
                order_id: existingPayment.gateway_payment_id,
                payment_session_id: orderData.payment_session_id,
                order_token: orderData.order_token,
                amount: booking.total_amount,
                currency: "INR",
                booking_id: booking_id,
              },
              "Payment order retrieved successfully",
              200,
            );
          }
        }
      } catch (fetchError) {
        // If fetching fails, we'll create a new order below
        console.log(
          "Could not fetch existing order, creating new one:",
          fetchError.message,
        );
      }
    }

    // Create new Cashfree order with unique order ID
    const uniqueOrderId = `${booking_id}_${Date.now()}`;

    const orderData = {
      orderId: uniqueOrderId, // Use unique order ID instead of just booking_id
      orderAmount: parseFloat(booking.total_amount).toFixed(2),
      orderCurrency: "INR",
      customerDetails: {
        customerId: userId,
        email: user.email,
        phone: user.phone || "9999999999",
        name: user.full_name || "Guest User",
      },
      orderMeta: {
        returnUrl: `${process.env.FRONTEND_URL}/booking-success?bookingId=${booking_id}`,
        notifyUrl: `${process.env.BACKEND_URL}/api/payments/webhook`,
        paymentMethods: "cc,dc,nb,upi,wallet",
      },
    };

    const cashfreeOrder = await cashfreeService.createOrder(orderData);

    // Store payment record
    const paymentId = generateUUID();
    await db.query(
      "INSERT INTO payments (id, booking_id, gateway, gateway_payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
      [
        paymentId,
        booking_id,
        "cashfree",
        cashfreeOrder.orderId,
        booking.total_amount,
        "pending",
      ],
    );

    sendSuccess(
      res,
      {
        order_id: cashfreeOrder.orderId,
        payment_session_id: cashfreeOrder.paymentSessionId,
        order_token: cashfreeOrder.orderToken,
        amount: booking.total_amount,
        currency: "INR",
        booking_id: booking_id,
      },
      "Payment order created successfully",
      200,
    );
  } catch (error) {
    console.error("Cashfree order creation failed:", error);
    return sendError(
      res,
      error.message || "Failed to create payment order",
      500,
    );
  }
});

/**
 * Verify payment - Called after successful payment from frontend
 */
export const verifyPayment = asyncHandler(async (req, res) => {
  const { order_id, booking_id } = req.body;

  if (!order_id || !booking_id) {
    return sendError(res, "Missing payment verification data", 400);
  }

  // Fetch order details from Cashfree to verify payment status
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Get booking details
    const [bookings] = await connection.query(
      "SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL",
      [booking_id],
    );

    if (bookings.length === 0) {
      throw new Error("Booking not found");
    }

    const booking = bookings[0];

    // 2. Check if booking has expired
    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
      throw new Error(
        "Booking has expired. Please create a new booking to continue.",
      );
    }

    // 3. Fetch order from Cashfree to verify payment
    const cashfreeOrder = await cashfreeService.getOrder(order_id);

    if (!cashfreeOrder.success) {
      throw new Error("Failed to verify payment with Cashfree");
    }

    const orderDetails = cashfreeOrder.order;

    // 4. Verify order status is PAID
    if (orderDetails.order_status !== "PAID") {
      throw new Error(
        `Payment not completed. Current status: ${orderDetails.order_status}`,
      );
    }

    // 5. Verify amount matches booking
    const expectedAmount = parseFloat(booking.total_amount).toFixed(2);
    const paidAmount = parseFloat(orderDetails.order_amount).toFixed(2);

    if (paidAmount !== expectedAmount) {
      throw new Error(
        `Payment amount mismatch. Expected: ₹${expectedAmount}, Received: ₹${paidAmount}`,
      );
    }

    // 6. Get payment details
    const paymentsResponse = await cashfreeService.getPayments(order_id);
    const paymentDetails = paymentsResponse.payments[0]; // Get first payment

    // 7. Update payment status
    await connection.query(
      'UPDATE payments SET status = "success", gateway_payment_id = ? WHERE booking_id = ?',
      [paymentDetails.cf_payment_id, booking_id],
    );

    // 8. Update booking status
    await connection.query(
      'UPDATE bookings SET status = "confirmed" WHERE id = ?',
      [booking_id],
    );

    // 9. Confirm employee points
    await connection.query(
      'UPDATE employee_points SET status = "confirmed" WHERE booking_id = ?',
      [booking_id],
    );

    // 10. Generate invoice
    const invoiceId = generateUUID();
    const calculatedBaseAmount =
      (parseFloat(booking.base_amount) || 0) +
      (parseFloat(booking.extra_guest_charges) || 0) +
      (parseFloat(booking.extra_children_charges) || 0) -
      (parseFloat(booking.discount_amount) || 0);

    await connection.query(
      "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        invoiceId,
        booking_id,
        booking.user_id,
        calculatedBaseAmount,
        booking.gst_amount,
        booking.total_amount,
        "invoice",
      ],
    );

    // 11. Create user notification
    await connection.query(
      "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
      [
        generateUUID(),
        booking.user_id,
        "user",
        "Booking Confirmed",
        `Your booking has been confirmed. Booking ID: ${booking_id}`,
      ],
    );

    // 12. Create vendor notification
    const [properties] = await connection.query(
      "SELECT vendor_id FROM properties WHERE id = ?",
      [booking.property_id],
    );

    if (properties.length > 0 && properties[0].vendor_id) {
      await connection.query(
        "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
        [
          generateUUID(),
          properties[0].vendor_id,
          "vendor",
          "New Booking Received",
          `You have a new booking. Booking ID: ${booking_id}`,
        ],
      );
    }

    // COMMIT TRANSACTION - All operations successful
    await connection.commit();
    connection.release();

    // Send confirmation email (outside transaction)
    try {
      await sendBookingConfirmationEmail(booking_id);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    sendSuccess(
      res,
      {
        booking_id,
        invoice_id: invoiceId,
        payment_id: paymentDetails.cf_payment_id,
        message: "Payment verified, booking confirmed, invoice generated",
      },
      "Payment verified and booking confirmed",
      200,
    );
  } catch (error) {
    // ROLLBACK TRANSACTION - Something failed
    await connection.rollback();
    connection.release();

    console.error("Payment verification transaction failed:", error);
    return sendError(res, "Payment verification failed: " + error.message, 500);
  }
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
    "SELECT COUNT(*) as total FROM",
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
    200,
  );
});

/**
 * @route   GET /api/payments/invoice/:bookingId
 * @desc    Get invoice for a booking
 * @access  Private (User/Admin)
 */
export const getInvoice = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  const [invoices] = await db.query(
    `SELECT 
      i.*,
      b.check_in,
      b.check_out,
      b.nights,
      b.guest_count,
      u.full_name as user_name,
      u.email as user_email,
      prop.title as property_title,
      prop.location as property_location
    FROM invoices i
    INNER JOIN bookings b ON i.booking_id = b.id
    INNER JOIN users u ON i.user_id = u.id
    INNER JOIN properties prop ON b.property_id = prop.id
    WHERE i.booking_id = ?`,
    [bookingId],
  );

  if (invoices.length === 0) {
    return sendError(res, "Invoice not found", 404);
  }

  sendSuccess(
    res,
    { invoice: invoices[0] },
    "Invoice fetched successfully",
    200,
  );
});

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Cashfree webhook events
 * @access  Public (called by Cashfree servers)
 *
 * Cashfree Webhook Events:
 * - PAYMENT_SUCCESS_WEBHOOK - Payment successful
 * - PAYMENT_FAILED_WEBHOOK - Payment failed
 * - PAYMENT_USER_DROPPED_WEBHOOK - User abandoned payment
 *
 * Setup Instructions:
 * 1. Go to Cashfree Dashboard → Developers → Webhooks
 * 2. Add webhook URL: https://yourdomain.com/api/payments/webhook
 * 3. Select events: PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK
 */
export const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-cashfree-signature"];
  const timestamp = req.headers["x-cashfree-timestamp"];
  const body = req.body;

  console.log("📥 Cashfree Webhook received:", body.type);

  // Verify webhook signature
  const isValid = cashfreeService.verifyWebhookSignature(
    signature,
    timestamp,
    body,
  );

  if (!isValid && process.env.CASHFREE_ENV !== "TEST") {
    console.error("❌ Invalid webhook signature");
    return res.status(400).json({ error: "Invalid webhook signature" });
  }

  const eventType = body.type;
  const data = body.data;

  // Handle different webhook events
  try {
    switch (eventType) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        await handlePaymentSuccess(data);
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        await handlePaymentFailed(data);
        break;

      case "PAYMENT_USER_DROPPED_WEBHOOK":
        console.log("ℹ️ User abandoned payment");
        break;

      default:
        console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
    }

    // Always return 200 to Cashfree
    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("❌ Webhook processing failed:", error);
    // Still return 200 to prevent Cashfree from retrying endlessly
    res.status(200).json({ status: "error", message: error.message });
  }
});

/**
 * Handle PAYMENT_SUCCESS_WEBHOOK from Cashfree
 */
async function handlePaymentSuccess(data) {
  const order = data.order;
  const payment = data.payment;
  const orderId = order.order_id;
  const paymentId = payment.cf_payment_id;
  const amount = parseFloat(order.order_amount);

  console.log(`💰 Payment success: ${paymentId} for order ${orderId}`);

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Find booking by order ID (order_id = booking_id in our system)
    const [bookings] = await connection.query(
      "SELECT * FROM bookings WHERE id = ? AND deleted_at IS NULL",
      [orderId],
    );

    if (bookings.length === 0) {
      console.error(`❌ Booking not found for order: ${orderId}`);
      await connection.rollback();
      connection.release();
      return;
    }

    const booking = bookings[0];

    // Verify amount matches
    const expectedAmount = parseFloat(booking.total_amount).toFixed(2);
    const receivedAmount = amount.toFixed(2);

    if (receivedAmount !== expectedAmount) {
      console.error(
        `❌ Amount mismatch: Expected ₹${expectedAmount}, got ₹${receivedAmount}`,
      );
      await connection.rollback();
      connection.release();
      return;
    }

    // Check if booking already confirmed (prevent duplicate processing)
    if (booking.status === "confirmed") {
      console.log(`ℹ️ Booking ${orderId} already confirmed, skipping`);
      await connection.commit();
      connection.release();
      return;
    }

    // Update payment status
    await connection.query(
      'UPDATE payments SET status = "success", gateway_payment_id = ? WHERE booking_id = ?',
      [paymentId, orderId],
    );

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = "confirmed" WHERE id = ?',
      [orderId],
    );

    // Confirm employee points
    await connection.query(
      'UPDATE employee_points SET status = "confirmed" WHERE booking_id = ?',
      [orderId],
    );

    // Generate invoice if not exists
    const [existingInvoices] = await connection.query(
      "SELECT id FROM invoices WHERE booking_id = ?",
      [orderId],
    );

    if (existingInvoices.length === 0) {
      const invoiceId = generateUUID();
      const calculatedBaseAmount =
        (parseFloat(booking.base_amount) || 0) +
        (parseFloat(booking.extra_guest_charges) || 0) +
        (parseFloat(booking.extra_children_charges) || 0) -
        (parseFloat(booking.discount_amount) || 0);

      await connection.query(
        "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          invoiceId,
          orderId,
          booking.user_id,
          calculatedBaseAmount,
          booking.gst_amount,
          booking.total_amount,
          "invoice",
        ],
      );
    }

    // Create notification
    await connection.query(
      "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
      [
        generateUUID(),
        booking.user_id,
        "user",
        "Booking Confirmed via Webhook",
        `Your booking has been confirmed. Booking ID: ${orderId}`,
      ],
    );

    // Create vendor notification
    const [properties] = await connection.query(
      "SELECT vendor_id FROM properties WHERE id = ?",
      [booking.property_id],
    );

    if (properties.length > 0 && properties[0].vendor_id) {
      await connection.query(
        "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
        [
          generateUUID(),
          properties[0].vendor_id,
          "vendor",
          "New Booking Received",
          `You have a new booking. Booking ID: ${orderId}`,
        ],
      );
    }

    await connection.commit();
    console.log(`✅ Booking ${orderId} confirmed via webhook`);

    // Send email asynchronously
    sendBookingConfirmationEmail(orderId).catch((err) =>
      console.error("Email sending failed:", err),
    );
  } catch (error) {
    await connection.rollback();
    console.error("Webhook transaction failed:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Handle PAYMENT_FAILED_WEBHOOK from Cashfree
 */
async function handlePaymentFailed(data) {
  const order = data.order;
  const orderId = order.order_id;

  console.log(`❌ Payment failed for order ${orderId}`);

  try {
    // Update payment status to failed
    await db.query(
      'UPDATE payments SET status = "failed" WHERE booking_id = ?',
      [orderId],
    );

    console.log(`✅ Payment status updated to failed`);
  } catch (error) {
    console.error("Failed to update payment status:", error);
  }
}
