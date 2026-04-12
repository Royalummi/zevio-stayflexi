/**
 * Comprehensive Live API Test
 * Tests: Login, Refresh Token Rotation, Add Property (admin+vendor), original_price, Banners
 */
const https = require("https");
const crypto = require("crypto");

const API = "https://api.zevio.in";
const ADMIN = { email: "admin@zevio.com", password: "password123" };
const VENDOR = { email: "vendor2@example.com", password: "Test@1234" };

let results = [];
let testNum = 0;

function log(pass, name, detail = "") {
  testNum++;
  const icon = pass ? "PASS" : "FAIL";
  results.push({ num: testNum, pass, name, detail });
  console.log(`  [${icon}] ${testNum}. ${name}${detail ? " - " + detail : ""}`);
}

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["Authorization"] = `Bearer ${token}`;

    const r = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testAdminLogin() {
  console.log("\n=== 1. ADMIN LOGIN ===");
  const res = await req("POST", "/api/auth/login", ADMIN);
  const ok = res.status === 200 && res.body.success;
  log(
    ok,
    "Admin login",
    `status=${res.status}, role=${res.body.data?.user?.role || "N/A"}`,
  );
  return ok ? res.body.data : null;
}

async function testVendorLogin() {
  console.log("\n=== 2. VENDOR LOGIN ===");
  const res = await req("POST", "/api/auth/login", VENDOR);
  const ok = res.status === 200 && res.body.success;
  log(
    ok,
    "Vendor login",
    `status=${res.status}, role=${res.body.data?.user?.role || res.body.message || "N/A"}`,
  );
  return ok ? res.body.data : null;
}

async function testRefreshTokenRotation(authData) {
  console.log("\n=== 3. REFRESH TOKEN ROTATION ===");
  if (!authData) {
    log(false, "Refresh token", "No auth data");
    return null;
  }

  const rt1 = authData.refreshToken;
  log(!!rt1, "Got refresh token from login");

  // Wait 1.5s to ensure different JWT iat
  await sleep(1500);

  // Step 1: Refresh
  const res1 = await req("POST", "/api/auth/refresh", { refreshToken: rt1 });
  const ok1 = res1.status === 200 && res1.body.success;
  log(ok1, "Refresh with RT1", `status=${res1.status}`);

  if (!ok1) return authData;

  const rt2 = res1.body.data.refreshToken;
  const at2 = res1.body.data.accessToken;
  const different = rt1 !== rt2;
  log(
    different,
    "RT2 is different from RT1",
    different ? "Unique tokens" : "SAME TOKEN (broken)",
  );

  // Step 2: Try to reuse old RT1 (should fail)
  const res2 = await req("POST", "/api/auth/refresh", { refreshToken: rt1 });
  const revoked = res2.status !== 200;
  log(
    revoked,
    "Old RT1 is revoked",
    `status=${res2.status}, msg=${res2.body.message || "N/A"}`,
  );

  // Step 3: RT2 should still work
  await sleep(1500);
  const res3 = await req("POST", "/api/auth/refresh", { refreshToken: rt2 });
  const ok3 = res3.status === 200;
  log(ok3, "RT2 still works", `status=${res3.status}`);

  return {
    accessToken: res3.status === 200 ? res3.body.data.accessToken : at2,
    refreshToken: res3.status === 200 ? res3.body.data.refreshToken : rt2,
  };
}

async function testAdminBanners(token) {
  console.log("\n=== 4. ADMIN BANNERS ===");
  if (!token) {
    log(false, "Admin banners", "No token");
    return;
  }

  const res = await req("GET", "/api/admin/banners", null, token);
  log(res.status === 200, "GET /api/admin/banners", `status=${res.status}`);

  if (res.status === 200) {
    const data = res.body.data;
    const hasBanners = data && typeof data === "object" && "banners" in data;
    log(
      hasBanners,
      "Response has banners array",
      `type=${typeof data}, keys=${data ? Object.keys(data) : "N/A"}`,
    );
  } else {
    log(
      false,
      "Banners response structure",
      `msg=${res.body.message || JSON.stringify(res.body).substring(0, 100)}`,
    );
  }

  // Public banners
  const pub = await req("GET", "/api/banners/active");
  log(
    pub.status === 200,
    "GET /api/banners/active (public)",
    `status=${pub.status}`,
  );
}

async function testAdminCreateProperty(token) {
  console.log("\n=== 5. ADMIN CREATE PROPERTY (with original_price) ===");
  if (!token) {
    log(false, "Admin create property", "No token");
    return null;
  }

  const property = {
    title: "TEST Admin Villa " + Date.now(),
    description: "Comprehensive test property with original_price",
    property_type_id: "pt-001",
    city_id: "0d28b18d-960f-46a9-a12d-25bff6ad9f71",
    vendor_id: "bb6097e5-e418-11f0-9f30-00410e2b5e6e",
    address: "999 Test Boulevard",
    area: "Test Area",
    state: "Karnataka",
    pincode: "560001",
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    price_per_night: 15000,
    original_price: 20000,
    gst_percentage: 18,
    extra_guest_charge: 500,
  };

  const res = await req("POST", "/api/admin/properties", property, token);
  const ok = res.status === 201 || res.status === 200;
  log(ok, "Create property", `status=${res.status}`);

  if (!ok) {
    log(
      false,
      "Property creation response",
      `msg=${res.body.message || JSON.stringify(res.body).substring(0, 200)}`,
    );
    return null;
  }

  const propId = res.body.data?.id || res.body.data?.property?.id;
  log(!!propId, "Got property ID", propId || "N/A");

  // Verify original_price was saved
  if (propId) {
    const det = await req(
      "GET",
      `/api/admin/properties/${propId}`,
      null,
      token,
    );
    if (det.status === 200) {
      const prop = det.body.data;
      const origPrice = prop?.pricing?.original_price || prop?.original_price;
      log(
        origPrice == 20000,
        "original_price saved correctly",
        `got=${origPrice}, expected=20000`,
      );
    } else {
      log(false, "Get property details", `status=${det.status}`);
    }
  }

  // Check it appears in list with original_price
  const list = await req(
    "GET",
    "/api/admin/properties?page=1&limit=5",
    null,
    token,
  );
  if (list.status === 200) {
    const props = list.body.data?.properties || list.body.data || [];
    const found = props.find((p) => p.id === propId);
    if (found) {
      log(
        "original_price" in found,
        "original_price in list response",
        `value=${found.original_price}`,
      );
    } else {
      log(false, "Property in list", "Not found in first page");
    }
  }

  return propId;
}

async function testVendorCreateProperty(token) {
  console.log("\n=== 6. VENDOR CREATE PROPERTY (with original_price) ===");
  if (!token) {
    log(false, "Vendor create property", "No token");
    return null;
  }

  const property = {
    title: "TEST Vendor Villa " + Date.now(),
    description: "Vendor test property with original_price",
    property_type_id: "pt-001",
    city_id: "0d28b18d-960f-46a9-a12d-25bff6ad9f71",
    address: "888 Vendor Street",
    area: "Vendor Area",
    state: "Maharashtra",
    pincode: "400001",
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    price_per_night: 8000,
    original_price: 12000,
    gst_percentage: 12,
  };

  const res = await req("POST", "/api/vendor/properties", property, token);
  const ok = res.status === 201 || res.status === 200;
  log(ok, "Vendor create property", `status=${res.status}`);

  if (!ok) {
    log(
      false,
      "Vendor property response",
      `msg=${res.body.message || JSON.stringify(res.body).substring(0, 200)}`,
    );
    return null;
  }

  const propId = res.body.data?.id || res.body.data?.property?.id;
  log(!!propId, "Got vendor property ID", propId || "N/A");

  // Verify original_price
  if (propId) {
    const det = await req(
      "GET",
      `/api/vendor/properties/${propId}`,
      null,
      token,
    );
    if (det.status === 200) {
      const prop = det.body.data?.property || det.body.data;
      const origPrice = prop?.original_price;
      log(
        origPrice == 12000,
        "Vendor original_price saved correctly",
        `got=${origPrice}, expected=12000`,
      );
    } else {
      log(false, "Vendor get property", `status=${det.status}`);
    }
  }

  return propId;
}

async function testCleanup(adminToken, adminPropId, vendorPropId) {
  console.log("\n=== 7. CLEANUP ===");
  if (adminPropId && adminToken) {
    const r = await req(
      "DELETE",
      `/api/admin/properties/${adminPropId}`,
      null,
      adminToken,
    );
    log(
      r.status === 200 || r.status === 204,
      "Delete admin test property",
      `status=${r.status}`,
    );
  }
  if (vendorPropId && adminToken) {
    const r = await req(
      "DELETE",
      `/api/admin/properties/${vendorPropId}`,
      null,
      adminToken,
    );
    log(
      r.status === 200 || r.status === 204,
      "Delete vendor test property",
      `status=${r.status}`,
    );
  }
}

async function main() {
  console.log("============================================");
  console.log("  COMPREHENSIVE LIVE API TEST");
  console.log("  " + new Date().toISOString());
  console.log("============================================");

  // 1. Admin login
  const adminAuth = await testAdminLogin();

  // 2. Vendor login
  const vendorAuth = await testVendorLogin();

  // 3. Refresh token rotation (using admin)
  const newAdminAuth = await testRefreshTokenRotation(adminAuth);
  const adminToken = newAdminAuth?.accessToken || adminAuth?.accessToken;

  // 4. Banners
  await testAdminBanners(adminToken);

  // 5. Admin create property with original_price
  const adminPropId = await testAdminCreateProperty(adminToken);

  // 6. Vendor create property with original_price
  const vendorToken = vendorAuth?.accessToken;
  const vendorPropId = await testVendorCreateProperty(vendorToken);

  // 7. Cleanup
  await testCleanup(adminToken, adminPropId, vendorPropId);

  // Summary
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log("\n============================================");
  console.log(
    `  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`,
  );
  console.log("============================================");
  if (failed > 0) {
    console.log("\n  FAILURES:");
    results
      .filter((r) => !r.pass)
      .forEach((r) => {
        console.log(`    ${r.num}. ${r.name} - ${r.detail}`);
      });
  }
}

main().catch((e) => console.error("Fatal:", e));
