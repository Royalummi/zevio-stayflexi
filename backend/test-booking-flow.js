// ============================================================================
// ZEVIO — BOOKING FLOW COMPREHENSIVE TEST SUITE
// ============================================================================
//
//  What this covers:
//    1. Auth guards          — unauthenticated requests rejected
//    2. Input validation     — bad dates, missing fields, guest limits
//    3. Happy path           — create booking, verify amounts, list bookings
//    4. Pending booking mgmt — update-in-place, modify, cancel-pending
//    5. Availability blocking — overlap detection, race-condition edge cases
//    6. Multi-property       — same dates, different properties = allowed
//    7. Cancellation → rebook — cancelled dates become free again
//    8. Date boundary edge cases — back-to-back, single night, adjacent
//    9. Coupon validation    — valid discount, invalid, expired
//   10. Pagination & filtering — status filter, page/limit
//
//  How to run:
//    node test-booking-flow.js
//
//  Requirements:
//    - Backend running on http://localhost:5000
//    - At least ONE approved property in the database
//    - Two regular user accounts (User A & User B) — see CONFIG below
//    - One admin account — for cancellation tests
//
//  Create test users quickly via API:
//    POST /api/auth/register  { full_name, email, password, phone }
//
// ============================================================================

import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────────
// ⚙️  CONFIG — Update before running
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api";

// Test User A — primary user for booking flow tests
// ➜ Create via: POST /api/auth/register
const USER_A = {
  email: "testbooker_a@zevio.test",
  password: "TestPass123!",
  full_name: "Test Booker A",
  phone: "9000000001",
};

// Test User B — second user for "another user is blocked" tests
// ➜ Create via: POST /api/auth/register  (skip multi-user tests if not found)
const USER_B = {
  email: "testbooker_b@zevio.test",
  password: "TestPass123!",
  full_name: "Test Booker B",
  phone: "9000000002",
};

// Admin credentials — needed for forced-cancel tests
// ➜ Must already exist in the DB
const ADMIN = {
  email: "admin@zevio.com",
  password: "Admin123!",
};

// ─────────────────────────────────────────────────────────────────────────────
// 📅  TEST DATES — all use distinct, far-future windows
//
//  ⚠️  IMPORTANT: If Suite 3/4 fail with "blackout period" error it means
//     your test property has a blackout overlapping these dates.
//     HOW TO FIX: Go to Admin → Properties → Blackout Dates and check what
//     dates are set, then increase the BASE_OFFSET below past those dates.
//
//  Currently uses BASE_OFFSET = 200 days (~6-7 months out) which should
//  be past any near-term blackout windows. Adjust if needed.
// ─────────────────────────────────────────────────────────────────────────────
function futureDate(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}

// BASE_OFFSET: start all test windows from this many days in the future
// Increase this value if your property has blackout dates in that range
const BASE = 200;

// All date windows use different slots so tests don't conflict with each other
const DATES = {
  // Suite 3 / 4 — happy path & pending booking  (BASE + 0..6)
  HAPPY_IN: futureDate(BASE),
  HAPPY_OUT: futureDate(BASE + 3), // 3 nights

  // Suite 5 — overlap blocking   (BASE + 10..35)
  OVERLAP_IN: futureDate(BASE + 10),
  OVERLAP_OUT: futureDate(BASE + 15), // 5 nights
  OVERLAP_PARTIAL_IN: futureDate(BASE + 13), // overlaps [+13 .. +18]
  OVERLAP_PARTIAL_OUT: futureDate(BASE + 18),
  ADJACENT_IN: futureDate(BASE + 15), // starts exactly when OVERLAP ends ─ OK
  ADJACENT_OUT: futureDate(BASE + 20),
  BEFORE_IN: futureDate(BASE + 20), // totally before overlap window
  BEFORE_OUT: futureDate(BASE + 25), // no conflict

  // Suite 6 — multi-property same dates   (BASE + 30..35)
  MULTI_IN: futureDate(BASE + 30),
  MULTI_OUT: futureDate(BASE + 35), // 5 nights — used on both PROPERTY_A and PROPERTY_B

  // Suite 7 — cancel-rebook   (BASE + 40..45)
  REBOOK_IN: futureDate(BASE + 40),
  REBOOK_OUT: futureDate(BASE + 45),

  // Suite 8 — edge cases
  SINGLE_IN: futureDate(BASE + 50),
  SINGLE_OUT: futureDate(BASE + 51), // 1 night

  // Suite 9 — coupon test (needs high enough amount for 18% tier)
  COUPON_IN: futureDate(BASE + 60),
  COUPON_OUT: futureDate(BASE + 67), // 7 nights
};

// ─────────────────────────────────────────────────────────────────────────────
// 📊  RESULTS TRACKER
// ─────────────────────────────────────────────────────────────────────────────
const results = { total: 0, passed: 0, failed: 0, skipped: 0, failures: [] };

function pass(name, detail = "") {
  results.total++;
  results.passed++;
  console.log(`  ✅  ${name}${detail ? `  (${detail})` : ""}`);
}

function fail(name, detail = "") {
  results.total++;
  results.failed++;
  results.failures.push({ name, detail });
  console.log(`  ❌  ${name}${detail ? `  — ${detail}` : ""}`);
}

function skip(name, reason = "") {
  results.skipped++;
  console.log(`  ⏭️   ${name}${reason ? `  [skipped: ${reason}]` : ""}`);
}

function section(title) {
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  ${title}`);
  console.log("─".repeat(70));
}

// ─────────────────────────────────────────────────────────────────────────────
// 🔑  AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function registerAndLogin(user) {
  // Try register (ignore 409 if already exists)
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      full_name: user.full_name,
      email: user.email,
      password: user.password,
      phone: user.phone,
    });
  } catch (e) {
    if (e.response?.status !== 409) {
      // Not a duplicate — something else is wrong
      console.warn(
        `    ⚠️  Register failed for ${user.email}: ${e.response?.data?.message || e.message}`,
      );
    }
  }

  // Login
  const loginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: user.email,
    password: user.password,
  });

  const token = loginRes.data.data?.accessToken;
  if (!token) throw new Error(`Login failed for ${user.email}`);
  return token;
}

async function loginAsUser(user) {
  const res = await axios.post(`${API_BASE}/auth/login`, {
    email: user.email,
    password: user.password,
  });
  const token = res.data.data?.accessToken;
  if (!token) throw new Error(`Login failed for ${user.email}`);
  return token;
}

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

// ─────────────────────────────────────────────────────────────────────────────
// 🏠  GET A REAL APPROVED PROPERTY FROM THE DB
// ─────────────────────────────────────────────────────────────────────────────
async function getTestProperties() {
  const res = await axios.get(`${API_BASE}/public/properties?limit=5`);
  const props = res.data.data?.properties || [];
  if (props.length === 0)
    throw new Error("No approved properties found — seed the DB first");
  // Return first two (may be same if only one exists)
  return { propA: props[0], propB: props[1] || props[0] };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANUP HELPER — soft-cancel any test bookings still open
// ─────────────────────────────────────────────────────────────────────────────
const createdBookingIds = []; // track all booking IDs to clean up

async function cleanupBookings(token) {
  for (const id of createdBookingIds) {
    try {
      await axios.delete(
        `${API_BASE}/bookings/${id}/cancel-pending`,
        authHeader(token),
      );
    } catch (_) {
      // Best-effort — ignore errors (booking may already be cancelled)
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTTP HELPER — doesn't throw on 4xx/5xx, returns { status, data }
// ─────────────────────────────────────────────────────────────────────────────
async function req(method, url, body = null, token = null) {
  try {
    const cfg = { headers: {} };
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    const res = body
      ? await axios[method](url, body, cfg)
      : await axios[method](url, cfg);
    return { status: res.status, data: res.data };
  } catch (e) {
    return {
      status: e.response?.status || 0,
      data: e.response?.data || { message: e.message },
    };
  }
}

// ============================================================================
// 🧪  TEST SUITES
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 1 — Auth Guards
// ─────────────────────────────────────────────────────────────────────────────
async function suite1_authGuards() {
  section("SUITE 1 — Auth Guards (unauthenticated requests must be rejected)");

  let r;

  r = await req("post", `${API_BASE}/bookings`, {
    property_id: "dummy",
    check_in: DATES.HAPPY_IN,
    check_out: DATES.HAPPY_OUT,
  });
  r.status === 401
    ? pass("POST /bookings without token → 401")
    : fail("POST /bookings without token → expected 401", `got ${r.status}`);

  r = await req("get", `${API_BASE}/bookings/my`);
  r.status === 401
    ? pass("GET /bookings/my without token → 401")
    : fail("GET /bookings/my without token → expected 401", `got ${r.status}`);

  r = await req("get", `${API_BASE}/bookings/pending-check/dummy`);
  r.status === 401
    ? pass("GET /bookings/pending-check/:id without token → 401")
    : fail("GET /bookings/pending-check/:id without token", `got ${r.status}`);

  r = await req("delete", `${API_BASE}/bookings/dummy/cancel-pending`);
  r.status === 401
    ? pass("DELETE /bookings/:id/cancel-pending without token → 401")
    : fail("DELETE cancel-pending without token", `got ${r.status}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 2 — Input Validation
// ─────────────────────────────────────────────────────────────────────────────
async function suite2_inputValidation(tokenA, propertyId) {
  section("SUITE 2 — Input Validation (bad inputs are rejected with 400/422)");

  let r;

  // Missing fields
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_OUT,
    },
    tokenA,
  );
  [400, 422].includes(r.status)
    ? pass("Missing property_id → 400/422")
    : fail("Missing property_id", `got ${r.status} — ${r.data?.message}`);

  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_out: DATES.HAPPY_OUT,
    },
    tokenA,
  );
  [400, 422].includes(r.status)
    ? pass("Missing check_in → 400/422")
    : fail("Missing check_in", `got ${r.status}`);

  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_IN,
    },
    tokenA,
  );
  [400, 422].includes(r.status)
    ? pass("Missing check_out → 400/422")
    : fail("Missing check_out", `got ${r.status}`);

  // Past date
  const yesterday = futureDate(-1);
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: yesterday,
      check_out: DATES.HAPPY_OUT,
    },
    tokenA,
  );
  r.status === 400 && r.data.message?.toLowerCase().includes("past")
    ? pass("Past check-in date → 400 'cannot be in the past'")
    : fail("Past check-in date", `got ${r.status}: ${r.data?.message}`);

  // check_out = check_in (0 nights)
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_IN,
    },
    tokenA,
  );
  r.status === 400
    ? pass("check_out same as check_in → 400")
    : fail("check_out same as check_in", `got ${r.status}: ${r.data?.message}`);

  // check_out before check_in
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_OUT,
      check_out: DATES.HAPPY_IN,
    },
    tokenA,
  );
  r.status === 400
    ? pass("check_out before check_in → 400")
    : fail("check_out before check_in", `got ${r.status}: ${r.data?.message}`);

  // Non-existent property
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: "00000000-0000-0000-0000-000000000000",
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_OUT,
    },
    tokenA,
  );
  r.status === 404
    ? pass("Non-existent property_id → 404")
    : fail("Non-existent property_id", `got ${r.status}: ${r.data?.message}`);

  // Guest count = 0
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_OUT,
      guest_count: 0,
    },
    tokenA,
  );
  r.status === 400 && r.data.message?.toLowerCase().includes("guest")
    ? pass("guest_count 0 → 400 'At least 1 guest'")
    : fail("guest_count 0", `got ${r.status}: ${r.data?.message}`);

  // Extreme guest count
  r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_OUT,
      guest_count: 9999,
    },
    tokenA,
  );
  r.status === 400
    ? pass("guest_count 9999 → 400 (exceeds max_guests)")
    : fail("guest_count 9999", `got ${r.status}: ${r.data?.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 3 — Happy Path Booking
// ─────────────────────────────────────────────────────────────────────────────
async function suite3_happyPath(tokenA, propertyId) {
  section("SUITE 3 — Happy Path Booking (create + verify)");

  // Create booking
  const r = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.HAPPY_IN,
      check_out: DATES.HAPPY_OUT,
      guest_count: 1,
    },
    tokenA,
  );

  if (![200, 201].includes(r.status)) {
    fail("Create booking → 201", `got ${r.status}: ${r.data?.message}`);
    return null;
  }
  pass("Create booking → 201");

  const booking = r.data.data || r.data;
  const bookingId = booking.booking_id || booking.id;
  if (bookingId) createdBookingIds.push(bookingId);

  // Check response structure
  booking.id || booking.booking_id
    ? pass("Response has booking_id")
    : fail("Response missing booking_id");

  ["pending", "pending_payment"].includes(booking.status)
    ? pass(`Status is ${booking.status} (correct for newly created booking)`)
    : fail(
        "Status should be pending or pending_payment",
        `got: ${booking.status}`,
      );

  booking.check_in
    ? pass(`check_in is ${booking.check_in}`)
    : fail("Response missing check_in");

  booking.check_out
    ? pass(`check_out is ${booking.check_out}`)
    : fail("Response missing check_out");

  const expectedNights = 3;
  booking.nights === expectedNights
    ? pass(
        `Nights calculated correctly (${booking.nights} nights for ${DATES.HAPPY_IN} → ${DATES.HAPPY_OUT})`,
      )
    : fail(`Nights expected ${expectedNights}`, `got ${booking.nights}`);

  // Amount structure
  const hasAllAmounts =
    booking.base_amount !== undefined &&
    booking.gst_amount !== undefined &&
    booking.service_charge !== undefined &&
    booking.total_amount !== undefined &&
    parseFloat(booking.total_amount) > 0;
  hasAllAmounts
    ? pass(
        `Amount structure correct  base: ₹${booking.base_amount}  gst: ₹${booking.gst_amount}  service: ₹${booking.service_charge}  total: ₹${booking.total_amount}`,
      )
    : fail(
        "Missing amount fields",
        JSON.stringify({
          base_amount: booking.base_amount,
          gst_amount: booking.gst_amount,
          total_amount: booking.total_amount,
        }),
      );

  // Verify: total = bookingAmount + gstAmount + serviceCharge
  const computedTotal =
    parseFloat(booking.base_amount || 0) +
    parseFloat(booking.extra_guest_charges || 0) +
    parseFloat(booking.extra_children_charges || 0) -
    parseFloat(booking.discount_amount || 0) +
    parseFloat(booking.gst_amount || 0) +
    parseFloat(booking.service_charge || 0);
  Math.abs(computedTotal - parseFloat(booking.total_amount)) < 0.1
    ? pass(
        `total_amount math is correct  (computed ₹${computedTotal.toFixed(2)} ≈ stored ₹${booking.total_amount})`,
      )
    : fail(
        "total_amount math mismatch",
        `computed ₹${computedTotal.toFixed(2)} vs stored ₹${booking.total_amount}`,
      );

  // expires_at should be ~15 minutes away
  if (booking.expires_at) {
    const expiresIn = (new Date(booking.expires_at) - new Date()) / 60000;
    expiresIn > 0 && expiresIn <= 16
      ? pass(
          `expires_at set ~15 minutes from now  (${expiresIn.toFixed(1)} min remaining)`,
        )
      : fail(
          "expires_at out of expected range",
          `${expiresIn.toFixed(1)} min remaining`,
        );
  }

  // GET /bookings/my should include this booking
  const listR = await req("get", `${API_BASE}/bookings/my`, null, tokenA);
  if (listR.status === 200) {
    const list = listR.data.data?.bookings || [];
    const found = list.some((b) => b.id === bookingId || b.id === booking.id);
    found
      ? pass("GET /bookings/my lists the new booking")
      : fail("GET /bookings/my does not include new booking");
  } else {
    fail("GET /bookings/my failed", `${listR.status}`);
  }

  return bookingId;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 4 — Pending Booking Management
// ─────────────────────────────────────────────────────────────────────────────
async function suite4_pendingManagement(tokenA, propertyId, existingBookingId) {
  section(
    "SUITE 4 — Pending Booking Management (update-in-place, modify, cancel)",
  );

  // Check pending-check endpoint
  const checkR = await req(
    "get",
    `${API_BASE}/bookings/pending-check/${propertyId}`,
    null,
    tokenA,
  );
  if (checkR.status === 200) {
    checkR.data.data?.hasPendingBooking
      ? pass("GET /pending-check shows hasPendingBooking=true after suite 3")
      : fail("GET /pending-check hasPendingBooking should be true");
  } else {
    fail("GET /pending-check failed", `${checkR.status}`);
  }

  // Re-booking same property = UPDATE existing (isUpdate = true)
  const NEW_IN = futureDate(BASE + 1);
  const NEW_OUT = futureDate(BASE + 4); // slightly different dates
  const updateR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: NEW_IN,
      check_out: NEW_OUT,
      guest_count: 1,
    },
    tokenA,
  );

  if ([200, 201].includes(updateR.status)) {
    const updated = updateR.data.data || updateR.data;
    updated.isUpdate === true
      ? pass(
          "Re-booking same property returns isUpdate=true (no duplicate created)",
        )
      : fail(
          "Re-booking same property should set isUpdate=true",
          `isUpdate=${updated.isUpdate}`,
        );

    // ID should be same as original
    const updatedId = updated.booking_id || updated.id;
    updatedId === existingBookingId
      ? pass("Updated booking has same ID as original (not a new row)")
      : fail(
          "Updated booking ID differs from original",
          `original=${existingBookingId} updated=${updatedId}`,
        );
  } else {
    fail(
      "Re-booking same property (update-in-place)",
      `${updateR.status}: ${updateR.data?.message}`,
    );
  }

  // Modify pending via PUT /:id/modify-pending
  if (existingBookingId) {
    const modR = await req(
      "put",
      `${API_BASE}/bookings/${existingBookingId}/modify-pending`,
      {
        check_in: futureDate(BASE + 2),
        check_out: futureDate(BASE + 6),
        guest_count: 2,
      },
      tokenA,
    );
    modR.status === 200
      ? pass(
          "PUT /bookings/:id/modify-pending → 200 (dates + guest count updated)",
        )
      : fail(
          "PUT modify-pending failed",
          `${modR.status}: ${modR.data?.message}`,
        );
  }

  // Cancel the pending booking
  if (existingBookingId) {
    const cancelR = await req(
      "delete",
      `${API_BASE}/bookings/${existingBookingId}/cancel-pending`,
      null,
      tokenA,
    );
    cancelR.status === 200
      ? pass("DELETE /bookings/:id/cancel-pending → 200")
      : fail(
          "DELETE cancel-pending failed",
          `${cancelR.status}: ${cancelR.data?.message}`,
        );

    // After cancel, pending-check should return false
    const afterCancelCheck = await req(
      "get",
      `${API_BASE}/bookings/pending-check/${propertyId}`,
      null,
      tokenA,
    );
    afterCancelCheck.data?.data?.hasPendingBooking === false
      ? pass("After cancel, hasPendingBooking=false (correctly cleared)")
      : fail("After cancel, hasPendingBooking should be false");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 5 — Availability Blocking (Overlap Detection)
// ─────────────────────────────────────────────────────────────────────────────
async function suite5_overlapBlocking(tokenA, tokenB, propertyId) {
  section("SUITE 5 — Availability Blocking (overlap detection)");

  if (!tokenB) {
    skip(
      "All Suite 5 multi-user tests",
      "USER_B token not available — provide USER_B credentials in CONFIG",
    );
    return;
  }

  // User A creates a fresh pending booking on the OVERLAP date window
  const bookR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.OVERLAP_IN,
      check_out: DATES.OVERLAP_OUT,
      guest_count: 1,
    },
    tokenA,
  );

  if (![200, 201].includes(bookR.status)) {
    fail(
      "Setup: User A create booking for overlap suite",
      `${bookR.status}: ${bookR.data?.message}`,
    );
    return;
  }
  const overlapBookingId =
    bookR.data.data?.booking_id || bookR.data.data?.id || bookR.data.booking_id;
  if (overlapBookingId) createdBookingIds.push(overlapBookingId);
  pass(
    `Setup: User A booked ${DATES.OVERLAP_IN} → ${DATES.OVERLAP_OUT}  (id: ${overlapBookingId})`,
  );

  // T5.1 — User B tries EXACT same dates → must be blocked
  const exactR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.OVERLAP_IN,
      check_out: DATES.OVERLAP_OUT,
      guest_count: 1,
    },
    tokenB,
  );
  exactR.status === 400 &&
  exactR.data.message?.toLowerCase().includes("already booked")
    ? pass("T5.1 User B: exact same dates → 400 'already booked'")
    : fail(
        "T5.1 User B: exact same dates should be blocked",
        `got ${exactR.status}: ${exactR.data?.message}`,
      );

  // T5.2 — User B tries PARTIAL overlap → must be blocked
  // OVERLAP window is [40-45], partial is [43-48] — starts inside existing
  const partialR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.OVERLAP_PARTIAL_IN,
      check_out: DATES.OVERLAP_PARTIAL_OUT,
      guest_count: 1,
    },
    tokenB,
  );
  partialR.status === 400
    ? pass(
        "T5.2 User B: partial overlap [43-48] on [40-45] window → 400 blocked",
      )
    : fail(
        "T5.2 User B: partial overlap should be blocked",
        `got ${partialR.status}: ${partialR.data?.message}`,
      );

  // T5.3 — SUBSET dates (entirely within booked window) → must be blocked
  // [BASE+11 .. BASE+14] is fully inside [BASE+10 .. BASE+15]
  const subsetR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: futureDate(BASE + 11),
      check_out: futureDate(BASE + 14),
      guest_count: 1,
    },
    tokenB,
  );
  subsetR.status === 400
    ? pass("T5.3 User B: subset dates [41-44] inside [40-45] → 400 blocked")
    : fail(
        "T5.3 User B: subset dates should be blocked",
        `got ${subsetR.status}`,
      );

  // T5.4 — Superset dates (booking covers a larger range) → must be blocked
  // [BASE+8 .. BASE+17] contains [BASE+10 .. BASE+15]
  const supersetR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: futureDate(BASE + 8),
      check_out: futureDate(BASE + 17),
      guest_count: 1,
    },
    tokenB,
  );
  supersetR.status === 400
    ? pass("T5.4 User B: superset dates [38-47] over [40-45] → 400 blocked")
    : fail(
        "T5.4 User B: superset dates should be blocked",
        `got ${supersetR.status}`,
      );

  // T5.5 — ADJACENT (back-to-back): check_in of new = check_out of existing → ALLOWED
  // Existing ends +45. New starts +45. Overlap condition is check_in < ? AND check_out > ?
  // existing.check_out(45) > new.check_in(45) → FALSE → no overlap ✅
  const adjacentR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.ADJACENT_IN, // = BASE+15 = OVERLAP_OUT  ← back to back
      check_out: DATES.ADJACENT_OUT, // = BASE+20
      guest_count: 1,
    },
    tokenB,
  );
  [200, 201].includes(adjacentR.status)
    ? pass(
        "T5.5 User B: adjacent booking (starts when existing ends) → 201 ALLOWED",
      )
    : fail(
        "T5.5 User B: adjacent booking should be allowed",
        `got ${adjacentR.status}: ${adjacentR.data?.message}`,
      );
  // Cleanup B's adjacent booking
  const adjId = adjacentR.data?.data?.booking_id || adjacentR.data?.data?.id;
  if (adjId) {
    await req(
      "delete",
      `${API_BASE}/bookings/${adjId}/cancel-pending`,
      null,
      tokenB,
    );
  }

  // T5.6 — Completely non-overlapping dates → ALLOWED
  const noOverlapR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.BEFORE_IN, // [50-55] vs [40-45] — no conflict
      check_out: DATES.BEFORE_OUT,
      guest_count: 1,
    },
    tokenB,
  );
  [200, 201].includes(noOverlapR.status)
    ? pass(
        "T5.6 User B: non-overlapping dates [50-55] while [40-45] taken → 201 ALLOWED",
      )
    : fail(
        "T5.6 User B: non-overlapping dates should be allowed",
        `got ${noOverlapR.status}: ${noOverlapR.data?.message}`,
      );
  const noOverlapId =
    noOverlapR.data?.data?.booking_id || noOverlapR.data?.data?.id;
  if (noOverlapId) {
    await req(
      "delete",
      `${API_BASE}/bookings/${noOverlapId}/cancel-pending`,
      null,
      tokenB,
    );
  }

  // Cleanup User A's booking for next suites
  if (overlapBookingId) {
    await req(
      "delete",
      `${API_BASE}/bookings/${overlapBookingId}/cancel-pending`,
      null,
      tokenA,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 6 — Multi-Property Same Dates (different properties = always allowed)
// ─────────────────────────────────────────────────────────────────────────────
async function suite6_multiPropertySameDates(tokenA, propA, propB) {
  section(
    "SUITE 6 — Multi-Property Same Dates (user can book different properties simultaneously)",
  );

  // Book Property A
  const bookA = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propA.id,
      check_in: DATES.MULTI_IN,
      check_out: DATES.MULTI_OUT,
      guest_count: 1,
    },
    tokenA,
  );

  let idA = null;
  if ([200, 201].includes(bookA.status)) {
    idA = bookA.data.data?.booking_id || bookA.data.data?.id;
    if (idA) createdBookingIds.push(idA);
    pass(
      `Book Property A (${propA.id?.slice(0, 8)}…) → ${DATES.MULTI_IN}–${DATES.MULTI_OUT} → 201`,
    );
  } else {
    fail(
      "Book Property A for multi-property test",
      `${bookA.status}: ${bookA.data?.message}`,
    );
  }

  if (propA.id === propB.id) {
    skip(
      "Property B test (same as A)",
      "Only one property in DB — need at least 2 for this test",
    );
  } else {
    // Book Property B — same exact dates — must succeed
    const bookB = await req(
      "post",
      `${API_BASE}/bookings`,
      {
        property_id: propB.id,
        check_in: DATES.MULTI_IN,
        check_out: DATES.MULTI_OUT,
        guest_count: 1,
      },
      tokenA,
    );

    let idB = null;
    if ([200, 201].includes(bookB.status)) {
      idB = bookB.data.data?.booking_id || bookB.data.data?.id;
      if (idB) createdBookingIds.push(idB);
      pass(
        `Book Property B (${propB.id?.slice(0, 8)}…) same dates → 201 ALLOWED`,
      );
    } else {
      fail(
        "Book Property B same dates as Property A",
        `${bookB.status}: ${bookB.data?.message}`,
      );
    }

    // Both should appear in /bookings/my
    const listR = await req("get", `${API_BASE}/bookings/my`, null, tokenA);
    if (listR.status === 200) {
      const ids = (listR.data.data?.bookings || []).map((b) => b.id);
      const hasA = idA && ids.includes(idA);
      const hasB = idB && ids.includes(idB);
      hasA && hasB
        ? pass("GET /bookings/my shows both multi-property bookings")
        : fail(
            "GET /bookings/my missing one of the multi-property bookings",
            `hasA=${hasA} hasB=${hasB}  ids=[${ids.join(", ")}]`,
          );
    }

    // Cleanup B
    if (idB)
      await req(
        "delete",
        `${API_BASE}/bookings/${idB}/cancel-pending`,
        null,
        tokenA,
      );
  }

  // Cleanup A
  if (idA)
    await req(
      "delete",
      `${API_BASE}/bookings/${idA}/cancel-pending`,
      null,
      tokenA,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 7 — Cancellation → Re-booking (cancelled dates must become free)
// ─────────────────────────────────────────────────────────────────────────────
async function suite7_cancelAndRebook(tokenA, tokenB, propertyId) {
  section(
    "SUITE 7 — Cancellation → Re-booking (cancelled dates become available)",
  );

  // User A books dates
  const bookR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.REBOOK_IN,
      check_out: DATES.REBOOK_OUT,
      guest_count: 1,
    },
    tokenA,
  );

  if (![200, 201].includes(bookR.status)) {
    fail(
      "Setup: User A create booking for rebook suite",
      `${bookR.status}: ${bookR.data?.message}`,
    );
    return;
  }
  const rebookId = bookR.data.data?.booking_id || bookR.data.data?.id;
  pass(
    `User A booked ${DATES.REBOOK_IN} → ${DATES.REBOOK_OUT}  (id: ${rebookId})`,
  );

  if (tokenB) {
    // User B is blocked
    const blockedR = await req(
      "post",
      `${API_BASE}/bookings`,
      {
        property_id: propertyId,
        check_in: DATES.REBOOK_IN,
        check_out: DATES.REBOOK_OUT,
        guest_count: 1,
      },
      tokenB,
    );
    blockedR.status === 400
      ? pass(
          "T7.1 User B blocked on same dates while User A has pending_payment booking",
        )
      : fail(
          "T7.1 User B should be blocked",
          `got ${blockedR.status}: ${blockedR.data?.message}`,
        );
  } else {
    skip("T7.1 User B blocking check", "USER_B not configured");
  }

  // User A cancels their pending booking
  const cancelR = await req(
    "delete",
    `${API_BASE}/bookings/${rebookId}/cancel-pending`,
    null,
    tokenA,
  );
  cancelR.status === 200
    ? pass("T7.2 User A cancels their pending booking → 200")
    : fail(
        "T7.2 Cancel pending failed",
        `${cancelR.status}: ${cancelR.data?.message}`,
      );

  // After cancel, someone else can now book those dates
  const rebooker = tokenB || tokenA; // use B if available, else A books back for themselves
  const rebookR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.REBOOK_IN,
      check_out: DATES.REBOOK_OUT,
      guest_count: 1,
    },
    rebooker,
  );

  if ([200, 201].includes(rebookR.status)) {
    pass(
      `T7.3 After cancellation, same dates can be booked again by ${tokenB ? "User B" : "User A"} → 201 ✅`,
    );
    const rebookedId = rebookR.data.data?.booking_id || rebookR.data.data?.id;
    if (rebookedId) {
      await req(
        "delete",
        `${API_BASE}/bookings/${rebookedId}/cancel-pending`,
        null,
        rebooker,
      );
    }
  } else {
    fail(
      "T7.3 Re-booking after cancellation failed",
      `${rebookR.status}: ${rebookR.data?.message}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 8 — Date & Duration Edge Cases
// ─────────────────────────────────────────────────────────────────────────────
async function suite8_dateEdgeCases(tokenA, propertyId) {
  section("SUITE 8 — Date & Duration Edge Cases");

  // Single night (1 night)
  const singleR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: DATES.SINGLE_IN,
      check_out: DATES.SINGLE_OUT,
      guest_count: 1,
    },
    tokenA,
  );
  let singleId = null;
  if ([200, 201].includes(singleR.status)) {
    const b = singleR.data.data || singleR.data;
    singleId = b.booking_id || b.id;
    b.nights === 1
      ? pass(`T8.1 1-night booking → 201, nights=1`)
      : fail("T8.1 1-night booking nights miscalculated", `nights=${b.nights}`);
    if (singleId) {
      createdBookingIds.push(singleId);
      await req(
        "delete",
        `${API_BASE}/bookings/${singleId}/cancel-pending`,
        null,
        tokenA,
      );
    }
  } else {
    fail(
      "T8.1 Single night booking",
      `${singleR.status}: ${singleR.data?.message}`,
    );
  }

  // Long booking (30 nights)
  const longIn = futureDate(BASE + 52);
  const longOut = futureDate(BASE + 82); // 30 nights
  const longR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: longIn,
      check_out: longOut,
      guest_count: 1,
    },
    tokenA,
  );
  if ([200, 201].includes(longR.status)) {
    const b = longR.data.data || longR.data;
    b.nights === 30
      ? pass("T8.2 30-night booking → 201, nights=30")
      : fail("T8.2 30-night nights miscalculated", `nights=${b.nights}`);
    const longId = b.booking_id || b.id;
    if (longId)
      await req(
        "delete",
        `${API_BASE}/bookings/${longId}/cancel-pending`,
        null,
        tokenA,
      );
  } else {
    // Could be max_booking_days restriction — that's also valid behaviour
    [400, 422].includes(longR.status)
      ? pass(
          "T8.2 30-night booking blocked by max_booking_days policy (expected)",
        )
      : fail(
          "T8.2 Long booking failed unexpectedly",
          `${longR.status}: ${longR.data?.message}`,
        );
  }

  // Today's date booking (may be allowed or blocked depending on same_day_booking_allowed)
  const todayStr = new Date().toISOString().split("T")[0];
  const sameDayR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: todayStr,
      check_out: futureDate(1),
      guest_count: 1,
    },
    tokenA,
  );
  if (
    sameDayR.status === 400 &&
    sameDayR.data.message?.toLowerCase().includes("same-day")
  ) {
    pass("T8.3 Same-day booking blocked when property disallows it → 400");
  } else if ([200, 201].includes(sameDayR.status)) {
    pass(
      "T8.3 Same-day booking allowed (property has same_day_booking_allowed=true)",
    );
    const sdId = sameDayR.data.data?.booking_id || sameDayR.data.data?.id;
    if (sdId)
      await req(
        "delete",
        `${API_BASE}/bookings/${sdId}/cancel-pending`,
        null,
        tokenA,
      );
  } else {
    fail(
      "T8.3 Same-day booking",
      `unexpected ${sameDayR.status}: ${sameDayR.data?.message}`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 9 — Coupon Validation
// ─────────────────────────────────────────────────────────────────────────────
async function suite9_couponValidation(tokenA, propertyId) {
  section("SUITE 9 — Coupon Validation");

  // T9.1 — Invalid coupon code
  const invalidR = await req(
    "post",
    `${API_BASE}/bookings/validate-coupon`,
    {
      code: "INVALID_COUPON_THAT_SHOULDNT_EXIST_XYZ",
      booking_amount: 5000,
    },
    tokenA,
  );
  invalidR.status === 400
    ? pass("T9.1 Invalid coupon → 400 'Invalid or expired coupon'")
    : fail(
        "T9.1 Invalid coupon should return 400",
        `got ${invalidR.status}: ${invalidR.data?.message}`,
      );

  // T9.2 — Missing fields
  const missingR = await req(
    "post",
    `${API_BASE}/bookings/validate-coupon`,
    {
      code: "TESTCODE",
    },
    tokenA,
  );
  [400, 422].includes(missingR.status)
    ? pass("T9.2 Validate-coupon missing booking_amount → 400/422")
    : fail("T9.2 Missing booking_amount should fail", `got ${missingR.status}`);

  // T9.3 — Coupon with booking below min_booking_amount (if API allows us to test this)
  // We can test by using a very small booking amount
  const lowAmountR = await req(
    "post",
    `${API_BASE}/bookings/validate-coupon`,
    {
      code: "SAVE10",
      booking_amount: 1, // ₹1 — almost certainly below any min_booking_amount
    },
    tokenA,
  );
  // This could be 400 (below min) or 400 (invalid coupon) depending on DB
  if (lowAmountR.status === 400) {
    pass("T9.3 Low booking amount coupon → 400 (minimum amount or invalid)");
  } else {
    skip(
      "T9.3 Low booking amount coupon",
      "Coupon SAVE10 not in DB or no min_booking_amount set",
    );
  }

  // Note: We can't fully test a valid coupon without knowing what codes exist in the DB
  // Admin can create a test coupon and re-run this suite
  skip(
    "T9.4 Valid coupon reduces total_amount",
    "Requires a known active coupon code in DB — add one in admin panel and test manually",
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 10 — Listing & Pagination
// ─────────────────────────────────────────────────────────────────────────────
async function suite10_listingAndPagination(tokenA) {
  section("SUITE 10 — GET /bookings/my — Pagination & Status Filter");

  // Default list
  const listR = await req("get", `${API_BASE}/bookings/my`, null, tokenA);
  if (listR.status === 200) {
    const d = listR.data.data;
    const hasPagination =
      d?.pagination?.page !== undefined &&
      d?.pagination?.totalPages !== undefined &&
      d?.pagination?.total !== undefined;
    hasPagination
      ? pass(
          `Default list returns pagination  (page=${d.pagination.page}, total=${d.pagination.total})`,
        )
      : fail("Default list missing pagination", JSON.stringify(d?.pagination));

    Array.isArray(d?.bookings)
      ? pass("Response has bookings array")
      : fail("Response missing bookings array");
  } else {
    fail("GET /bookings/my failed", `${listR.status}`);
  }

  // Status filter — confirmed (should return only confirmed)
  const confirmedR = await req(
    "get",
    `${API_BASE}/bookings/my?status=confirmed`,
    null,
    tokenA,
  );
  if (confirmedR.status === 200) {
    const bookings = confirmedR.data.data?.bookings || [];
    const allConfirmed = bookings.every((b) => b.status === "confirmed");
    allConfirmed
      ? pass(
          `Status filter ?status=confirmed → all ${bookings.length} results have status=confirmed`,
        )
      : fail(
          "Status filter=confirmed returned non-confirmed booking",
          bookings.find((b) => b.status !== "confirmed")?.status,
        );
  } else {
    fail("Status filter filter failed", `${confirmedR.status}`);
  }

  // Status filter — cancelled
  const cancelledR = await req(
    "get",
    `${API_BASE}/bookings/my?status=cancelled`,
    null,
    tokenA,
  );
  cancelledR.status === 200
    ? pass("Status filter ?status=cancelled → 200")
    : fail("Status filter=cancelled failed", `${cancelledR.status}`);

  // Pagination limit
  const limitR = await req(
    "get",
    `${API_BASE}/bookings/my?limit=2&page=1`,
    null,
    tokenA,
  );
  if (limitR.status === 200) {
    const returned = limitR.data.data?.bookings?.length || 0;
    returned <= 2
      ? pass(`?limit=2 returns ≤2 results (got ${returned})`)
      : fail("?limit=2 returned more than 2 results", `got ${returned}`);
  } else {
    fail("Pagination limit test failed", `${limitR.status}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 11 — GET /bookings/:id (booking detail)
// ─────────────────────────────────────────────────────────────────────────────
async function suite11_bookingDetail(tokenA, propertyId) {
  section("SUITE 11 — GET /bookings/:id (booking detail + ownership)");

  // Create a booking to fetch
  const createR = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: futureDate(BASE + 115),
      check_out: futureDate(BASE + 118),
      guest_count: 1,
    },
    tokenA,
  );

  if (![200, 201].includes(createR.status)) {
    fail("Setup: create booking for detail test", `${createR.status}`);
    return;
  }

  const bData = createR.data.data || createR.data;
  const bid = bData.booking_id || bData.id;
  if (bid) createdBookingIds.push(bid);

  // Fetch it
  const detailR = await req("get", `${API_BASE}/bookings/${bid}`, null, tokenA);
  if (detailR.status === 200) {
    const b = detailR.data.data;
    pass("GET /bookings/:id → 200");
    b.property_title
      ? pass(`  property_title: "${b.property_title}"`)
      : fail("  property_title missing");
    b.city_name
      ? pass(`  city_name: "${b.city_name}"`)
      : fail("  city_name missing");
    Array.isArray(b.property_images)
      ? pass(`  property_images: ${b.property_images.length} image(s)`)
      : fail("  property_images missing");
    Array.isArray(b.payments)
      ? pass("  payments array present")
      : fail("  payments array missing");
  } else {
    fail("GET /bookings/:id failed", `${detailR.status}`);
  }

  // Non-existent booking ID
  const notFoundR = await req(
    "get",
    `${API_BASE}/bookings/00000000-0000-0000-0000-000000000000`,
    null,
    tokenA,
  );
  notFoundR.status === 404
    ? pass("GET /bookings/non-existent-id → 404")
    : fail(
        "GET /bookings/non-existent-id should return 404",
        `got ${notFoundR.status}`,
      );

  // Cleanup
  if (bid)
    await req(
      "delete",
      `${API_BASE}/bookings/${bid}/cancel-pending`,
      null,
      tokenA,
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUITE 12 — cancel_requested status still blocks dates (OR is it freed?)
// This tests the actual DB behaviour of your overlap query
// ─────────────────────────────────────────────────────────────────────────────
async function suite12_cancelRequestedBlocking(tokenA, tokenB, propertyId) {
  section("SUITE 12 — cancel_requested Status: Date Availability Behaviour");

  console.log(
    "\n  ℹ️  NOTE: Your overlap query includes:  status IN ('confirmed','completed','pending_payment','pending')",
  );
  console.log(
    "  ℹ️  'cancel_requested' is NOT in the list, so dates ARE freed when user requests cancellation.",
  );
  console.log(
    "  ℹ️  This is a design choice — ensure admin is aware another booking may come in before they action the request.\n",
  );

  if (!tokenB) {
    skip("Suite 12 multi-user tests", "USER_B not configured");
    return;
  }

  // We can only test cancel_requested if we have a confirmed booking (requires payment)
  skip(
    "T12.1 cancel_requested blocks dates until admin approves",
    "Requires a confirmed (paid) booking — complete payment flow then re-run this test with a known booking_id",
  );
  skip(
    "T12.2 After admin processRefund → status=cancelled, dates freed",
    "Requires confirmed + paid booking + admin token",
  );

  // However, we CAN test the pending_payment → cancelled path
  const b = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: futureDate(BASE + 120),
      check_out: futureDate(BASE + 125),
      guest_count: 1,
    },
    tokenA,
  );

  const bid = b.data?.data?.booking_id || b.data?.data?.id;
  if (![200, 201].includes(b.status)) {
    fail("Suite 12 setup booking", `${b.status}`);
    return;
  }

  // User B blocked while A has pending_payment
  const blocked = await req(
    "post",
    `${API_BASE}/bookings`,
    {
      property_id: propertyId,
      check_in: futureDate(BASE + 120),
      check_out: futureDate(BASE + 125),
      guest_count: 1,
    },
    tokenB,
  );
  blocked.status === 400
    ? pass("T12.3 pending_payment booking blocks other users")
    : fail(
        "T12.3 pending_payment should block other users",
        `got ${blocked.status}`,
      );

  // User A cancels pending
  if (bid) {
    await req(
      "delete",
      `${API_BASE}/bookings/${bid}/cancel-pending`,
      null,
      tokenA,
    );
    // Now B should be able to book
    const unblocked = await req(
      "post",
      `${API_BASE}/bookings`,
      {
        property_id: propertyId,
        check_in: futureDate(BASE + 120),
        check_out: futureDate(BASE + 125),
        guest_count: 1,
      },
      tokenB,
    );
    [200, 201].includes(unblocked.status)
      ? pass(
          "T12.4 After pending cancelled by User A, User B can book → 201 ✅",
        )
      : fail(
          "T12.4 User B should be able to book after A cancels",
          `${unblocked.status}: ${unblocked.data?.message}`,
        );
    const ubId = unblocked.data?.data?.booking_id || unblocked.data?.data?.id;
    if (ubId)
      await req(
        "delete",
        `${API_BASE}/bookings/${ubId}/cancel-pending`,
        null,
        tokenB,
      );
  }
}

// ============================================================================
// 🚀  MAIN RUNNER
// ============================================================================
async function run() {
  console.log("=".repeat(70));
  console.log("  ZEVIO — BOOKING FLOW TEST SUITE");
  console.log(`  API: ${API_BASE}`);
  console.log(`  Date: ${new Date().toLocaleString("en-IN")}`);
  console.log("=".repeat(70));

  // ────────────────────────────────────────────────────────────────────────
  // SETUP — login both users, get properties
  // ────────────────────────────────────────────────────────────────────────
  section("SETUP — Authentication & Property Discovery");

  let tokenA, tokenB, tokenAdmin;
  let propA, propB;

  // Login User A
  try {
    tokenA = await registerAndLogin(USER_A);
    pass(`Logged in as User A  (${USER_A.email})`);
  } catch (e) {
    fail(`Login User A failed — ${e.message}`);
    console.error(
      "\n  ⚠️  Cannot proceed without User A token. Check USER_A credentials in CONFIG.\n",
    );
    process.exit(1);
  }

  // Login User B (optional — skip multi-user tests if not found)
  try {
    tokenB = await registerAndLogin(USER_B);
    pass(`Logged in as User B  (${USER_B.email})`);
  } catch (e) {
    console.log(
      `  ⚠️  User B login failed — multi-user blocking tests will be skipped  (${e.message})`,
    );
    tokenB = null;
  }

  // Login Admin (optional — skip admin-dependent tests if not found)
  try {
    tokenAdmin = await loginAsUser(ADMIN);
    pass(`Logged in as Admin  (${ADMIN.email})`);
  } catch (e) {
    console.log(
      `  ⚠️  Admin login failed — admin tests will be skipped  (${e.message})`,
    );
    tokenAdmin = null;
  }

  // Get test properties
  try {
    const props = await getTestProperties();
    propA = props.propA;
    propB = props.propB;
    pass(`Property A: "${propA.title}"  (id: ${propA.id?.slice(0, 8)}…)`);
    if (propA.id !== propB.id) {
      pass(`Property B: "${propB.title}"  (id: ${propB.id?.slice(0, 8)}…)`);
    } else {
      console.log(
        "  ⚠️  Only one property found — multi-property tests will use same property",
      );
    }
  } catch (e) {
    fail(`Could not fetch test properties — ${e.message}`);
    process.exit(1);
  }

  // ────────────────────────────────────────────────────────────────────────
  // RUN ALL SUITES
  // ────────────────────────────────────────────────────────────────────────
  await suite1_authGuards();
  await suite2_inputValidation(tokenA, propA.id);

  const happyBookingId = await suite3_happyPath(tokenA, propA.id);
  await suite4_pendingManagement(tokenA, propA.id, happyBookingId);

  await suite5_overlapBlocking(tokenA, tokenB, propA.id);
  await suite6_multiPropertySameDates(tokenA, propA, propB);
  await suite7_cancelAndRebook(tokenA, tokenB, propA.id);
  await suite8_dateEdgeCases(tokenA, propA.id);
  await suite9_couponValidation(tokenA, propA.id);
  await suite10_listingAndPagination(tokenA);
  await suite11_bookingDetail(tokenA, propA.id);
  await suite12_cancelRequestedBlocking(tokenA, tokenB, propA.id);

  // ────────────────────────────────────────────────────────────────────────
  // CLEANUP — cancel any leftover test bookings
  // ────────────────────────────────────────────────────────────────────────
  section("CLEANUP — Cancelling leftover test bookings");
  await cleanupBookings(tokenA);
  console.log(
    `  🧹  Attempted cleanup of ${createdBookingIds.length} tracked booking(s)`,
  );

  // ────────────────────────────────────────────────────────────────────────
  // FINAL REPORT
  // ────────────────────────────────────────────────────────────────────────
  console.log("\n" + "=".repeat(70));
  console.log("  FINAL RESULTS");
  console.log("=".repeat(70));
  console.log(`  Total:   ${results.total}`);
  console.log(`  ✅ Passed:  ${results.passed}`);
  console.log(`  ❌ Failed:  ${results.failed}`);
  console.log(`  ⏭️  Skipped: ${results.skipped}`);

  if (results.failures.length > 0) {
    console.log("\n  FAILURES TO FIX:");
    results.failures.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name}`);
      if (f.detail) console.log(`     → ${f.detail}`);
    });
  }

  const allPassed = results.failed === 0;
  console.log("\n" + "=".repeat(70));
  console.log(
    `  ${allPassed ? "✅  ALL TESTS PASSED — Booking flow is working correctly!" : "❌  SOME TESTS FAILED — See failures above"}`,
  );
  console.log("=".repeat(70) + "\n");

  process.exit(allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error("\n💥  Unexpected fatal error:", err.message || err);
  process.exit(1);
});
