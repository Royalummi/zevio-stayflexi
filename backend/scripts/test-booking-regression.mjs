/**
 * G4 — Zevio Booking Flow Regression Test
 *
 * Verifies the core Zevio booking APIs are unaffected by the StayFlexi
 * channel-manager additions (booking_source column, blackout_source column,
 * outbound push hooks, new routes).
 *
 * All checks are READ-ONLY — no bookings are created or modified.
 *
 * Usage:
 *   npm run test:booking-regression
 *
 * Environment overrides (all optional):
 *   TEST_API_BASE_URL       default: http://localhost:5000
 *   TEST_ADMIN_EMAIL        admin login
 *   TEST_ADMIN_PASSWORD
 *   TEST_VENDOR_EMAIL       vendor login
 *   TEST_VENDOR_PASSWORD
 *   TEST_USER_EMAIL         user login
 *   TEST_USER_PASSWORD
 *   TEST_API_TIMEOUT_MS     per-request timeout  default: 7000
 *   TEST_API_PREFLIGHT_RETRIES   default: 3
 *   TEST_API_PREFLIGHT_RETRY_DELAY_MS  default: 2000
 */

import dotenv from "dotenv";

dotenv.config();

const BASE_URL = process.env.TEST_API_BASE_URL || "http://localhost:5000";
const TIMEOUT_MS = Number(process.env.TEST_API_TIMEOUT_MS || 7000);
const PREFLIGHT_RETRIES = Number(process.env.TEST_API_PREFLIGHT_RETRIES || 3);
const PREFLIGHT_RETRY_DELAY_MS = Number(
  process.env.TEST_API_PREFLIGHT_RETRY_DELAY_MS || 2000,
);

// ---------------------------------------------------------------------------
// Credential candidates — tries multiple fallbacks so the script is portable
// ---------------------------------------------------------------------------

const csvEnv = (val) =>
  String(val || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const ADMIN_EMAILS = [
  ...new Set(
    [
      process.env.TEST_ADMIN_EMAIL,
      ...csvEnv(process.env.TEST_ADMIN_EMAILS),
      "admin@zevio.com",
      "john.admin@zevio.com",
    ].filter(Boolean),
  ),
];

const ADMIN_PASSWORDS = [
  ...new Set(
    [
      process.env.TEST_ADMIN_PASSWORD,
      ...csvEnv(process.env.TEST_ADMIN_PASSWORDS),
      "Admin@123",
      "Test@1234",
    ].filter(Boolean),
  ),
];

const ADMIN_ROLES = [
  ...new Set([...csvEnv(process.env.TEST_ADMIN_ROLES), "admin", "super_admin"]),
];

const VENDOR_EMAILS = [
  ...new Set(
    [
      process.env.TEST_VENDOR_EMAIL,
      ...csvEnv(process.env.TEST_VENDOR_EMAILS),
      "harsha718gowda@gmail.com",
      "mithunmanju77@gmail.com",
      "ranjithgopafy@gmail.com",
    ].filter(Boolean),
  ),
];

const VENDOR_PASSWORDS = [
  ...new Set(
    [
      process.env.TEST_VENDOR_PASSWORD,
      ...csvEnv(process.env.TEST_VENDOR_PASSWORDS),
      "Test@1234",
      "Vendor@123",
      "Admin@123",
    ].filter(Boolean),
  ),
];

const USER_EMAILS = [
  ...new Set(
    [
      process.env.TEST_USER_EMAIL,
      ...csvEnv(process.env.TEST_USER_EMAILS),
      "testuser@zevio.com",
      "guest@zevio.com",
    ].filter(Boolean),
  ),
];

const USER_PASSWORDS = [
  ...new Set(
    [
      process.env.TEST_USER_PASSWORD,
      ...csvEnv(process.env.TEST_USER_PASSWORDS),
      "Test@1234",
      "User@123",
      "Admin@123",
    ].filter(Boolean),
  ),
];

// ---------------------------------------------------------------------------
// Test runner
// ---------------------------------------------------------------------------

const results = [];

const pass = (name, details = "") => {
  results.push({ name, ok: true, details });
  console.log(`PASS: ${name}${details ? ` -> ${details}` : ""}`);
};

const fail = (name, details = "") => {
  results.push({ name, ok: false, details });
  console.log(`FAIL: ${name}${details ? ` -> ${details}` : ""}`);
};

const buildUrl = (path, params = {}) => {
  const url = new URL(path, BASE_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
};

const fetchJson = async (url, options = {}) => {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ac.signal });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, json };
  } finally {
    clearTimeout(timer);
  }
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------

const preflight = async () => {
  for (let attempt = 1; attempt <= PREFLIGHT_RETRIES; attempt++) {
    try {
      const res = await fetch(buildUrl("/"), {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      pass(
        "API reachability preflight",
        `status=${res.status}, attempt=${attempt}`,
      );
      return;
    } catch (err) {
      const reason =
        err?.name === "AbortError" ? "timeout" : err?.message || "network";
      if (attempt < PREFLIGHT_RETRIES) {
        console.log(
          `Preflight attempt ${attempt}/${PREFLIGHT_RETRIES} failed: ${reason}. Retrying in ${PREFLIGHT_RETRY_DELAY_MS}ms...`,
        );
        await sleep(PREFLIGHT_RETRY_DELAY_MS);
        continue;
      }
      fail("API reachability preflight", reason);
      throw new Error(
        `Cannot reach API at ${BASE_URL}. Start backend first (npm run dev in backend) or set TEST_API_BASE_URL.`,
      );
    }
  }
};

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

const login = async (email, password, role) => {
  const { status, json } = await fetchJson(buildUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const token = json?.data?.accessToken;
  if (status !== 200 || !token) {
    throw new Error(`HTTP ${status} — ${json?.message || "no token"}`);
  }
  return token;
};

const loginWithCandidates = async (label, emails, passwords, roles) => {
  let lastErr;
  for (const email of emails) {
    for (const password of passwords) {
      for (const role of roles) {
        try {
          const token = await login(email, password, role);
          pass(`${label} login`, `${email} (${role})`);
          return { token, email, role };
        } catch (e) {
          lastErr = e;
        }
      }
    }
  }
  fail(`${label} login`, lastErr?.message || "all candidates failed");
  return null;
};

const authedGet = async (token, path, params = {}) => {
  return fetchJson(buildUrl(path, params), {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

const testPublicApis = async () => {
  console.log("\n--- Public API checks ---");

  // Property listing
  {
    const { status, json } = await fetchJson(
      buildUrl("/api/properties", { limit: 5, page: 1 }),
    );
    const hasData =
      status === 200 &&
      (Array.isArray(json?.data?.properties) ||
        Array.isArray(json?.properties) ||
        Array.isArray(json?.data));
    pass_or_fail(
      "Public property listing returns 200",
      status === 200,
      `status=${status}`,
    );
    pass_or_fail(
      "Public property listing has data array",
      hasData,
      `status=${status}`,
    );
  }

  // Cities
  {
    const { status } = await fetchJson(buildUrl("/api/cities"));
    pass_or_fail(
      "Public cities endpoint returns 200",
      status === 200,
      `status=${status}`,
    );
  }
};

const pass_or_fail = (name, cond, details = "") =>
  cond ? pass(name, details) : fail(name, details);

const testAdminBookingApis = async (token) => {
  console.log("\n--- Admin booking API checks ---");

  // Booking list — basic shape
  {
    const { status, json } = await authedGet(token, "/api/admin/bookings", {
      page: 1,
      limit: 10,
    });
    const hasShape =
      status === 200 &&
      Array.isArray(json?.data?.bookings) &&
      json?.data?.pagination;
    pass_or_fail(
      "Admin booking list returns 200",
      status === 200,
      `status=${status}`,
    );
    pass_or_fail(
      "Admin booking list has pagination",
      hasShape,
      `status=${status}`,
    );

    // Verify booking_source column is present on rows that exist
    const rows = json?.data?.bookings || [];
    if (rows.length > 0) {
      const allHaveSource = rows.every((b) => b.booking_source !== undefined);
      pass_or_fail(
        "Admin booking rows include booking_source column",
        allHaveSource,
        `rows=${rows.length}`,
      );

      // All existing native bookings should be 'zevio'
      const allNative = rows.every(
        (b) =>
          b.booking_source === "zevio" ||
          b.booking_source === "channel_manager",
      );
      pass_or_fail(
        "Admin booking rows booking_source is valid enum",
        allNative,
        `rows=${rows.length}`,
      );
    } else {
      pass(
        "Admin booking rows include booking_source column",
        "no rows to check — skipped",
      );
      pass(
        "Admin booking rows booking_source is valid enum",
        "no rows — skipped",
      );
    }
  }

  // Booking stats — basic shape
  {
    const { status, json } = await authedGet(
      token,
      "/api/admin/bookings/stats",
    );
    const hasShape =
      status === 200 &&
      typeof json?.data?.total_bookings === "number" &&
      typeof json?.data?.confirmed_bookings === "number";
    pass_or_fail(
      "Admin booking stats returns 200",
      status === 200,
      `status=${status}`,
    );
    pass_or_fail(
      "Admin booking stats has expected shape",
      hasShape,
      `status=${status}`,
    );
  }

  // Booking status filter — confirmed
  {
    const { status, json } = await authedGet(token, "/api/admin/bookings", {
      status: "confirmed",
      limit: 5,
    });
    const ok = status === 200 && Array.isArray(json?.data?.bookings);
    pass_or_fail(
      "Admin booking filter by status=confirmed",
      ok,
      `status=${status}`,
    );
  }

  // Booking filter by date range
  {
    const { status } = await authedGet(token, "/api/admin/bookings", {
      from_date: "2026-01-01",
      to_date: "2026-12-31",
      limit: 5,
    });
    pass_or_fail(
      "Admin booking filter by date range returns 200",
      status === 200,
      `status=${status}`,
    );
  }
};

const testVendorBookingApis = async (token) => {
  console.log("\n--- Vendor booking API checks ---");

  // Vendor properties list (used in channel manager mapping UI)
  {
    const { status, json } = await authedGet(token, "/api/vendor/properties", {
      limit: 5,
      page: 1,
    });
    const ok =
      status === 200 &&
      (Array.isArray(json?.data?.properties) ||
        Array.isArray(json?.properties) ||
        Array.isArray(json?.data));
    pass_or_fail(
      "Vendor properties list returns 200",
      status === 200,
      `status=${status}`,
    );
    pass_or_fail("Vendor properties list has data", ok, `status=${status}`);
  }

  // Vendor bookings
  {
    const { status, json } = await authedGet(token, "/api/vendor/bookings", {
      page: 1,
      limit: 10,
    });
    pass_or_fail(
      "Vendor bookings list returns 200",
      status === 200,
      `status=${status}`,
    );
    const rows = json?.data?.bookings || json?.bookings || json?.data || [];
    if (Array.isArray(rows) && rows.length > 0) {
      const allHaveSource = rows.every((b) => b.booking_source !== undefined);
      pass_or_fail(
        "Vendor booking rows include booking_source column",
        allHaveSource,
        `rows=${rows.length}`,
      );
    } else {
      pass(
        "Vendor booking rows include booking_source column",
        "no rows — skipped",
      );
    }
  }

  // Vendor channel-manager sync logs (added in previous sessions — must still work)
  {
    const { status } = await authedGet(
      token,
      "/api/vendor/channel-manager/sync-logs",
      { provider_key: "stayflexi", page: 1, limit: 5 },
    );
    pass_or_fail(
      "Vendor channel-manager sync-logs endpoint works",
      status === 200,
      `status=${status}`,
    );
  }

  // Vendor stayflexi-status endpoint smoke (just check it doesn't 500 on first property)
  {
    const { status: propStatus, json: propJson } = await authedGet(
      token,
      "/api/vendor/properties",
      { limit: 1, page: 1 },
    );

    const properties =
      propJson?.data?.properties ||
      propJson?.properties ||
      (Array.isArray(propJson?.data) ? propJson.data : null);

    const firstProperty = Array.isArray(properties) ? properties[0] : null;

    if (firstProperty?.id) {
      const { status } = await authedGet(
        token,
        `/api/vendor/properties/${firstProperty.id}/stayflexi-status`,
      );
      pass_or_fail(
        "Vendor stayflexi-status endpoint returns non-500",
        status !== 500,
        `propertyId=${firstProperty.id}, status=${status}`,
      );
    } else {
      pass(
        "Vendor stayflexi-status endpoint returns non-500",
        "no properties — skipped",
      );
    }
  }
};

const testAdminChannelManagerApis = async (token) => {
  console.log("\n--- Admin channel-manager API checks ---");

  // Integration list
  {
    const { status, json } = await authedGet(
      token,
      "/api/admin/channel-manager/integrations",
      { page: 1, limit: 10 },
    );
    const ok =
      status === 200 && Array.isArray(json?.data?.integrations ?? json?.data);
    pass_or_fail(
      "Admin CM integrations list returns 200",
      status === 200,
      `status=${status}`,
    );
    pass_or_fail(
      "Admin CM integrations list has data array",
      ok,
      `status=${status}`,
    );
  }

  // Sync logs
  {
    const { status } = await authedGet(
      token,
      "/api/admin/channel-manager/sync-logs",
      { provider_key: "stayflexi", page: 1, limit: 5 },
    );
    pass_or_fail(
      "Admin CM sync-logs endpoint works",
      status === 200,
      `status=${status}`,
    );
  }
};

const testUserBookingApis = async (token) => {
  console.log("\n--- User (guest) booking API checks ---");

  // My bookings
  {
    const { status } = await authedGet(token, "/api/bookings/my", {
      page: 1,
      limit: 5,
    });
    pass_or_fail(
      "User my-bookings endpoint returns 200",
      status === 200,
      `status=${status}`,
    );
  }
};

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const main = async () => {
  console.log(`Zevio Booking Flow Regression Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(
    `Purpose: Verify core booking APIs are unaffected by StayFlexi channel-manager additions\n`,
  );

  await preflight();

  // Public APIs (no auth needed)
  await testPublicApis();

  // Admin
  const adminSession = await loginWithCandidates(
    "Admin",
    ADMIN_EMAILS,
    ADMIN_PASSWORDS,
    ADMIN_ROLES,
  );
  if (adminSession) {
    await testAdminBookingApis(adminSession.token);
    await testAdminChannelManagerApis(adminSession.token);
  } else {
    console.log("SKIP: Admin-gated tests skipped (login failed)");
  }

  // Vendor
  const vendorSession = await loginWithCandidates(
    "Vendor",
    VENDOR_EMAILS,
    VENDOR_PASSWORDS,
    ["vendor"],
  );
  if (vendorSession) {
    await testVendorBookingApis(vendorSession.token);
  } else {
    console.log("SKIP: Vendor-gated tests skipped (login failed)");
  }

  // User/guest
  const userSession = await loginWithCandidates(
    "User",
    USER_EMAILS,
    USER_PASSWORDS,
    ["user"],
  );
  if (userSession) {
    await testUserBookingApis(userSession.token);
  } else {
    console.log("SKIP: User-gated tests skipped (login failed)");
  }

  // Summary
  const failed = results.filter((r) => !r.ok);
  console.log("\n=== Summary ===");
  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${results.filter((r) => r.ok).length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.log("\nFailed checks:");
    for (const r of failed) {
      console.log(`  FAIL: ${r.name}${r.details ? ` (${r.details})` : ""}`);
    }
    process.exit(1);
  } else {
    console.log("\nAll regression checks passed.");
    process.exit(0);
  }
};

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
