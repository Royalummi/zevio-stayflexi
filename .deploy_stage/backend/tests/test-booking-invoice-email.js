/**
 * COMPREHENSIVE BOOKING + INVOICE + EMAIL TEST
 * ============================================
 * Tests the complete booking lifecycle:
 *   1. Login & get auth token
 *   2. Create a booking (villa + SA)
 *   3. Simulate payment confirmation (DB-level, bypassing gateway for test)
 *   4. Verify invoice was created
 *   5. Test invoice retrieval API
 *   6. Test email sending directly
 *   7. Check all dashboard endpoints
 *   8. Test cancel flow
 *
 * Run: node tests/test-booking-invoice-email.js
 */

import db from "../src/config/database.js";
import { generateUUID } from "../src/utils/helpers.js";
import {
  sendBookingConfirmationEmail,
  verifyEmailConfig,
} from "../src/services/emailService.js";
// Node 22 has native fetch — no need for node-fetch

const BASE = "http://localhost:5000/api";
const TEST_USER = { email: "testuser@zevio.in", password: "Test@1234" };

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pass = (msg) => console.log(`  ✅ PASS: ${msg}`);
const fail = (msg, err) =>
  console.error(`  ❌ FAIL: ${msg}`, err?.message || err || "");
const info = (msg) => console.log(`  ℹ️  ${msg}`);
const section = (msg) =>
  console.log(`\n${"=".repeat(60)}\n  ${msg}\n${"=".repeat(60)}`);

async function apiCall(method, url, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const resp = await fetch(`${BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await resp.json().catch(() => ({}));
  return { status: resp.status, ok: resp.ok, data: json };
}

// ─── STEP 1: Login ─────────────────────────────────────────────────────────────
section("STEP 1: LOGIN AS TEST USER");
let TOKEN;
try {
  const r = await apiCall("POST", "/auth/login", TEST_USER);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  TOKEN = r.data.data.accessToken;
  pass(`Login successful — user: ${r.data.data.user.email}`);
} catch (e) {
  fail("Login failed", e);
  process.exit(1);
}

// ─── STEP 2: Get properties to book ───────────────────────────────────────────
section("STEP 2: FETCH PROPERTIES");
let VILLA_ID, SA_ID;
try {
  const vr = await apiCall("GET", "/public/properties?limit=1");
  VILLA_ID = vr.data?.data?.properties?.[0]?.id;
  if (!VILLA_ID) throw new Error("No villa found");
  pass(`Villa: ${vr.data.data.properties[0].title} (${VILLA_ID})`);
} catch (e) {
  fail("Fetch villa failed", e);
}

try {
  const sr = await apiCall("GET", "/service-apartments?limit=1");
  SA_ID = sr.data?.data?.properties?.[0]?.id;
  if (!SA_ID) throw new Error("No SA found");
  pass(`SA: ${sr.data.data.properties[0].title} (${SA_ID})`);
} catch (e) {
  fail("Fetch SA failed", e);
}

// ─── STEP 3: Create Villa Booking ─────────────────────────────────────────────
section("STEP 3: CREATE VILLA BOOKING");
let BOOKING_ID;
try {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 10);
  const checkout = new Date(tomorrow);
  checkout.setDate(checkout.getDate() + 3);
  const fmt = (d) => d.toISOString().split("T")[0];

  const r = await apiCall(
    "POST",
    "/bookings",
    {
      property_id: VILLA_ID,
      check_in: fmt(tomorrow),
      check_out: fmt(checkout),
      guest_count: 2,
      children_count: 0,
    },
    TOKEN,
  );

  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  BOOKING_ID = r.data.data.booking_id;
  info(`Created booking_id: ${BOOKING_ID}`);
  info(`isUpdate: ${r.data.data.isUpdate}`);
  pass(`Villa booking created successfully`);
} catch (e) {
  fail("Villa booking creation failed", e);
}

// ─── STEP 4: Verify booking details ─────────────────────────────────────────
section("STEP 4: CHECK BOOKING DETAILS");
let bookingDetails;
try {
  const r = await apiCall("GET", `/bookings/${BOOKING_ID}`, null, TOKEN);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  bookingDetails = r.data.data;
  info(`Status: ${bookingDetails.status}`);
  info(`Amount: ₹${bookingDetails.total_amount}`);
  info(`Nights: ${bookingDetails.nights}`);
  info(`expires_at: ${bookingDetails.expires_at}`);
  pass(`Booking details fetched correctly`);

  if (bookingDetails.status !== "pending_payment") {
    throw new Error(`Expected pending_payment, got ${bookingDetails.status}`);
  }
  pass(`Status is pending_payment as expected`);
} catch (e) {
  fail("Get booking details failed", e);
}

// ─── STEP 5: Create Payment Order ────────────────────────────────────────────
section("STEP 5: CREATE CASHFREE PAYMENT ORDER");
let CASHFREE_ORDER_ID;
try {
  const r = await apiCall(
    "POST",
    "/payments/create-order",
    { booking_id: BOOKING_ID },
    TOKEN,
  );
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  CASHFREE_ORDER_ID = r.data.data.order_id;
  info(`Cashfree order_id: ${CASHFREE_ORDER_ID}`);
  info(
    `Payment session_id: ${r.data.data.payment_session_id?.substring(0, 30)}...`,
  );
  pass(`Payment order created via Cashfree sandbox`);
} catch (e) {
  fail("Payment order creation failed", e);
  info(`Will simulate confirmation directly via DB for invoice/email tests`);
}

// ─── STEP 6: SIMULATE PAYMENT CONFIRMED (DB-level for testing) ───────────────
section("STEP 6: SIMULATE PAYMENT CONFIRMATION (DB DIRECT — TEST MODE)");
let INVOICE_ID;
try {
  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // 6a. Update payment record
    await conn.query(
      "UPDATE payments SET status = 'success' WHERE booking_id = ?",
      [BOOKING_ID],
    );

    // If no payment record exists, create one
    const [payments] = await conn.query(
      "SELECT id FROM payments WHERE booking_id = ?",
      [BOOKING_ID],
    );
    if (payments.length === 0) {
      info("No payment record found — creating one");
      await conn.query(
        "INSERT INTO payments (id, booking_id, gateway, gateway_payment_id, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          generateUUID(),
          BOOKING_ID,
          "cashfree",
          `TEST_PAY_${Date.now()}`,
          bookingDetails.total_amount,
          "success",
        ],
      );
    }

    // 6b. Update booking to confirmed
    await conn.query("UPDATE bookings SET status = 'confirmed' WHERE id = ?", [
      BOOKING_ID,
    ]);

    // 6c. Generate invoice
    INVOICE_ID = generateUUID();
    const calculatedBaseAmount =
      (parseFloat(bookingDetails.base_amount) || 0) +
      (parseFloat(bookingDetails.extra_guest_charges) || 0) +
      (parseFloat(bookingDetails.extra_children_charges) || 0) -
      (parseFloat(bookingDetails.discount_amount) || 0);

    await conn.query(
      "INSERT INTO invoices (id, booking_id, user_id, base_amount, gst_amount, total_amount, invoice_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        INVOICE_ID,
        BOOKING_ID,
        bookingDetails.user_id,
        calculatedBaseAmount,
        bookingDetails.gst_amount,
        bookingDetails.total_amount,
        "invoice",
      ],
    );

    // 6d. Create notification
    await conn.query(
      "INSERT INTO notifications (id, recipient_id, recipient_role, title, message) VALUES (?, ?, ?, ?, ?)",
      [
        generateUUID(),
        bookingDetails.user_id,
        "user",
        "Booking Confirmed",
        `Your booking has been confirmed. Booking ID: ${BOOKING_ID}`,
      ],
    );

    await conn.commit();
    conn.release();

    pass(`Booking status updated to confirmed`);
    pass(`Invoice created: ${INVOICE_ID}`);
    info(`Invoice base_amount: ₹${calculatedBaseAmount}`);
    info(`Invoice total_amount: ₹${bookingDetails.total_amount}`);
  } catch (e) {
    await conn.rollback();
    conn.release();
    throw e;
  }
} catch (e) {
  fail("Simulate payment confirmation failed", e);
}

// ─── STEP 7: Verify booking is confirmed ─────────────────────────────────────
section("STEP 7: VERIFY BOOKING IS CONFIRMED");
try {
  const r = await apiCall("GET", `/bookings/${BOOKING_ID}`, null, TOKEN);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  const bd = r.data.data;
  info(`Status: ${bd.status}`);
  info(`Payment status: ${bd.payment_status}`);
  if (bd.status !== "confirmed")
    throw new Error(`Expected confirmed, got: ${bd.status}`);
  pass(`Booking is confirmed`);
} catch (e) {
  fail("Booking confirmation check failed", e);
}

// ─── STEP 8: Test Invoice Retrieval API ──────────────────────────────────────
section(
  "STEP 8: TEST INVOICE RETRIEVAL API (GET /payments/invoice/:bookingId)",
);
try {
  const r = await apiCall(
    "GET",
    `/payments/invoice/${BOOKING_ID}`,
    null,
    TOKEN,
  );
  info(`Invoice API status: ${r.status}`);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  const invoice = r.data.data?.invoice;
  info(`Invoice ID: ${invoice?.id}`);
  info(`Invoice total: ₹${invoice?.total_amount}`);
  info(`Invoice type: ${invoice?.invoice_type}`);
  info(`Invoice base_amount: ₹${invoice?.base_amount}`);
  info(`Invoice gst_amount: ₹${invoice?.gst_amount}`);
  pass(`Invoice retrieved via API successfully`);

  // Validate invoice fields
  if (!invoice?.id) throw new Error("Invoice has no ID");
  if (!invoice?.total_amount) throw new Error("Invoice has no total_amount");
  pass(`Invoice fields validated`);
} catch (e) {
  fail("Invoice retrieval failed", e);
}

// ─── STEP 9: Test My Bookings API ────────────────────────────────────────────
section("STEP 9: TEST MY BOOKINGS (GET /bookings/my)");
try {
  const r = await apiCall("GET", "/bookings/my", null, TOKEN);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  const bookings = r.data.data?.bookings || r.data.data || [];
  info(
    `Total bookings returned: ${Array.isArray(bookings) ? bookings.length : "N/A"}`,
  );
  const confirmed = Array.isArray(bookings)
    ? bookings.filter((b) => b.status === "confirmed")
    : [];
  info(`Confirmed bookings: ${confirmed.length}`);
  pass(`My Bookings API works`);
} catch (e) {
  fail("My Bookings API failed", e);
}

// ─── STEP 10: Test Email Sending ──────────────────────────────────────────────
section("STEP 10: TEST EMAIL SENDING");
try {
  const emailConfigured = await verifyEmailConfig();
  if (!emailConfigured) {
    info(`Email not configured — skipping email send test`);
    info(`EMAIL_USER: ${process.env.EMAIL_USER || "(not set)"}`);
  } else {
    info(`Email service configured — attempting to send confirmation email...`);
    try {
      await sendBookingConfirmationEmail(BOOKING_ID);
      pass(`Booking confirmation email sent to ${TEST_USER.email}`);
    } catch (emailErr) {
      fail(`Email sending failed`, emailErr);
      info(`Check EMAIL_USER/EMAIL_PASSWORD env vars`);
    }
  }
} catch (e) {
  fail("Email config check failed", e);
}

// ─── STEP 11: Test SA Booking ─────────────────────────────────────────────────
section("STEP 11: CREATE SERVICE APARTMENT BOOKING");
let SA_BOOKING_ID;
if (SA_ID) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 15);
    const checkout = new Date(tomorrow);
    checkout.setDate(checkout.getDate() + 5); // 5 nights (above min 3)
    const fmt = (d) => d.toISOString().split("T")[0];

    // First get SA price details
    const priceR = await apiCall(
      "POST",
      "/service-apartments/calculate-price",
      {
        property_id: SA_ID,
        check_in: fmt(tomorrow),
        check_out: fmt(checkout),
        adults: 2,
        children: 0,
      },
      TOKEN,
    );
    info(`SA price calc status: ${priceR.status}`);
    if (priceR.ok) {
      info(`SA total amount: ₹${priceR.data.data?.pricing?.total}`);
      pass(`SA price calculation works`);
    } else {
      info(`SA price calc response: ${JSON.stringify(priceR.data)}`);
    }
  } catch (e) {
    fail("SA price calculation failed", e);
  }
}

// ─── STEP 12: Test Cancel Request Flow ───────────────────────────────────────
section("STEP 12: TEST CANCEL REQUEST (confirmed → cancel_requested)");
try {
  const r = await apiCall(
    "POST",
    `/bookings/${BOOKING_ID}/cancel-request`,
    {},
    TOKEN,
  );
  info(`Cancel request status: ${r.status}`);
  if (!r.ok) throw new Error(`${r.status}: ${JSON.stringify(r.data)}`);
  pass(`Cancel request submitted successfully`);

  // Verify status changed
  const verifyR = await apiCall("GET", `/bookings/${BOOKING_ID}`, null, TOKEN);
  if (verifyR.ok) {
    info(`Booking status after cancel: ${verifyR.data.data?.status}`);
    if (verifyR.data.data?.status === "cancel_requested") {
      pass(`Status correctly changed to cancel_requested`);
    }
  }
} catch (e) {
  fail("Cancel request failed", e);
}

// ─── STEP 13: Test Coupon Validation API ─────────────────────────────────────
section("STEP 13: TEST COUPON VALIDATION API");
try {
  // Test with an invalid coupon
  const r = await apiCall(
    "POST",
    "/coupons/validate",
    {
      code: "INVALIDCOUPON999",
      booking_amount: 10000,
      property_id: VILLA_ID,
    },
    TOKEN,
  );
  info(`Invalid coupon status: ${r.status}`);
  info(`Response: ${JSON.stringify(r.data).substring(0, 100)}`);
  // 404 or 400 expected for invalid coupon
  if (
    r.status === 404 ||
    r.status === 400 ||
    (!r.ok && r.data?.success === false)
  ) {
    pass(`Invalid coupon correctly rejected`);
  } else {
    info(`Unexpected response for invalid coupon`);
  }
} catch (e) {
  fail("Coupon validation test failed", e);
}

// ─── STEP 14: Test Notifications ─────────────────────────────────────────────
section("STEP 14: TEST NOTIFICATIONS");
try {
  const r = await apiCall("GET", "/notifications", null, TOKEN);
  info(`Notifications status: ${r.status}`);
  if (r.ok) {
    const notifs = r.data.data?.notifications || r.data.data || [];
    info(
      `Notifications count: ${Array.isArray(notifs) ? notifs.length : "N/A"}`,
    );
    pass(`Notifications API works`);
  } else {
    info(`Could not check notifications: ${r.status}`);
  }
} catch (e) {
  info(`Notifications test skipped: ${e.message}`);
}

// ─── STEP 15: Check FRONTEND_URL env var ─────────────────────────────────────
section("STEP 15: ENVIRONMENT CONFIGURATION CHECK");
const checks = [
  {
    key: "FRONTEND_URL",
    val: process.env.FRONTEND_URL,
    expected: "http://localhost:8000",
  },
  { key: "EMAIL_USER", val: process.env.EMAIL_USER, notEmpty: true },
  { key: "CASHFREE_APP_ID", val: process.env.CASHFREE_APP_ID, notEmpty: true },
  { key: "CASHFREE_ENV", val: process.env.CASHFREE_ENV },
];

let envIssues = [];
for (const check of checks) {
  info(`${check.key}: ${check.val || "(not set)"}`);
  if (check.expected && check.val !== check.expected) {
    fail(`${check.key} mismatch: expected ${check.expected}, got ${check.val}`);
    envIssues.push(check.key);
  } else if (check.notEmpty && !check.val) {
    fail(`${check.key} is not set`);
    envIssues.push(check.key);
  } else {
    pass(`${check.key} is configured`);
  }
}

if (envIssues.length > 0) {
  console.log(`\n  ⚠️  ENV ISSUES FOUND: ${envIssues.join(", ")}`);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
section("TEST SUMMARY");
console.log(`
  Booking ID tested:    ${BOOKING_ID}
  Invoice ID created:   ${INVOICE_ID}
  Cashfree Order ID:    ${CASHFREE_ORDER_ID}
  
  Key findings:
  - FRONTEND_URL in .env is ${process.env.FRONTEND_URL} (Next.js runs on 8000)
  - Email configured: ${process.env.EMAIL_USER ? "YES (" + process.env.EMAIL_USER + ")" : "NO"}
  - Cashfree env: ${process.env.CASHFREE_ENV}
`);

// Close DB connection
await db.end().catch(() => {});
console.log("Done. DB connection closed.\n");
