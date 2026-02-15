import axios from "axios";

const API_URL = "http://localhost:5000/api";
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, details = "") {
  const result = { name, passed, details };
  testResults.tests.push(result);
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
  }
  if (details) console.log(`   ${details}`);
}

async function runHealthChecks() {
  console.log("\n🔍 COMPLETE SYSTEM HEALTH CHECK\n");
  console.log("=".repeat(80));

  try {
    // ============================================================================
    // PART 1: PUBLIC ENDPOINTS
    // ============================================================================
    console.log("\n📦 PART 1: PUBLIC ENDPOINTS (No Auth Required)");
    console.log("-".repeat(80));

    // Test 1: GET Cities
    try {
      const citiesRes = await axios.get(`${API_URL}/public/cities`);
      logTest(
        "GET /public/cities",
        citiesRes.data.success,
        `Found ${citiesRes.data.data.cities.length} cities`,
      );
    } catch (error) {
      logTest(
        "GET /public/cities",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // Test 2: GET Amenities (NEW)
    try {
      const amenitiesRes = await axios.get(`${API_URL}/public/amenities`);
      logTest(
        "GET /public/amenities",
        amenitiesRes.data.success,
        `Found ${amenitiesRes.data.data.amenities?.length || 0} amenities`,
      );
    } catch (error) {
      logTest(
        "GET /public/amenities",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // Test 3: GET Property Types (NEW)
    try {
      const typesRes = await axios.get(`${API_URL}/public/property-types`);
      logTest(
        "GET /public/property-types",
        typesRes.data.success,
        `Found ${typesRes.data.data.propertyTypes?.length || 0} types`,
      );
    } catch (error) {
      logTest(
        "GET /public/property-types",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // ============================================================================
    // PART 2: VENDOR AUTHENTICATION
    // ============================================================================
    console.log("\n\n📦 PART 2: VENDOR AUTHENTICATION");
    console.log("-".repeat(80));

    let vendorToken = "";

    // Test 4: Vendor Login
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: "vendor1@example.com",
        password: "password123",
      });
      vendorToken = loginRes.data.data.accessToken;
      logTest(
        "POST /auth/login (vendor)",
        loginRes.data.success,
        `Logged in as: ${loginRes.data.data.user.name}`,
      );
    } catch (error) {
      logTest(
        "POST /auth/login (vendor)",
        false,
        error.response?.data?.message || error.message,
      );
      console.log("\n❌ CRITICAL: Vendor login failed. Stopping tests.");
      return;
    }

    // ============================================================================
    // PART 3: VENDOR DASHBOARD ENDPOINTS
    // ============================================================================
    console.log("\n\n📦 PART 3: VENDOR DASHBOARD ENDPOINTS");
    console.log("-".repeat(80));

    // Test 5: GET Vendor Dashboard Stats
    try {
      const dashboardRes = await axios.get(`${API_URL}/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${vendorToken}` },
      });
      const stats = dashboardRes.data.data;
      logTest(
        "GET /vendor/dashboard",
        dashboardRes.data.success,
        `Total Properties: ${stats.total_properties}, Revenue: ₹${stats.total_revenue}`,
      );
    } catch (error) {
      logTest(
        "GET /vendor/dashboard",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // Test 6: GET Vendor Properties (FIXED)
    try {
      const propertiesRes = await axios.get(
        `${API_URL}/vendor/properties?limit=5`,
        {
          headers: { Authorization: `Bearer ${vendorToken}` },
        },
      );
      const properties = propertiesRes.data.data.properties;
      logTest(
        "GET /vendor/properties",
        propertiesRes.data.success,
        `Found ${properties.length} properties with pricing`,
      );
    } catch (error) {
      logTest(
        "GET /vendor/properties",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // ============================================================================
    // PART 4: VENDOR PROPERTY MANAGEMENT
    // ============================================================================
    console.log("\n\n📦 PART 4: VENDOR PROPERTY MANAGEMENT");
    console.log("-".repeat(80));

    let testPropertyId = "";

    // Test 7: POST Create Draft Property
    try {
      const createRes = await axios.post(
        `${API_URL}/vendor/properties`,
        {
          title: "Health Check Test Property",
          description: "Automated health check property",
          city_id: "49a8ed77-f31e-11f0-8f27-00410e2b5e6e",
          property_type_id: "pt-001",
          bedrooms: 3,
          bathrooms: 2,
          max_guests: 6,
          address: "Test Address",
          price_per_night: 5000,
          gst_percentage: 18,
        },
        {
          headers: { Authorization: `Bearer ${vendorToken}` },
        },
      );
      testPropertyId = createRes.data.data.id;
      logTest(
        "POST /vendor/properties",
        createRes.data.success,
        `Created property: ${testPropertyId}`,
      );
    } catch (error) {
      logTest(
        "POST /vendor/properties",
        false,
        error.response?.data?.message || error.message,
      );
    }

    // Test 8: GET Property by ID (NEW ENDPOINT)
    if (testPropertyId) {
      try {
        const propertyRes = await axios.get(
          `${API_URL}/vendor/properties/${testPropertyId}`,
          {
            headers: { Authorization: `Bearer ${vendorToken}` },
          },
        );
        const property = propertyRes.data.data.property;
        logTest(
          "GET /vendor/properties/:id",
          propertyRes.data.success,
          `Retrieved: ${property.title}, Price: ${property.price_per_night}`,
        );
      } catch (error) {
        logTest(
          "GET /vendor/properties/:id",
          false,
          error.response?.data?.message || error.message,
        );
      }
    }

    // Test 9: PATCH Update Draft Property
    if (testPropertyId) {
      try {
        const updateRes = await axios.patch(
          `${API_URL}/vendor/properties/${testPropertyId}`,
          {
            max_guests: 8,
            description: "Updated health check property",
          },
          {
            headers: { Authorization: `Bearer ${vendorToken}` },
          },
        );
        logTest(
          "PATCH /vendor/properties/:id (draft)",
          updateRes.data.success,
          "Draft updated successfully",
        );
      } catch (error) {
        logTest(
          "PATCH /vendor/properties/:id (draft)",
          false,
          error.response?.data?.message || error.message,
        );
      }
    }

    // Test 10: PATCH Submit for Approval
    if (testPropertyId) {
      try {
        const submitRes = await axios.patch(
          `${API_URL}/vendor/properties/${testPropertyId}/submit`,
          {},
          {
            headers: { Authorization: `Bearer ${vendorToken}` },
          },
        );
        logTest(
          "PATCH /vendor/properties/:id/submit",
          submitRes.data.success,
          "Submitted for approval",
        );
      } catch (error) {
        logTest(
          "PATCH /vendor/properties/:id/submit",
          false,
          error.response?.data?.message || error.message,
        );
      }
    }

    // ============================================================================
    // PART 5: ADMIN ENDPOINTS (Checking availability)
    // ============================================================================
    console.log("\n\n📦 PART 5: ADMIN ENDPOINTS (Structure Check)");
    console.log("-".repeat(80));

    // Test 11: GET Change Requests (Should require admin auth)
    try {
      const changeRequestsRes = await axios.get(
        `${API_URL}/admin/change-requests`,
        {
          headers: { Authorization: `Bearer ${vendorToken}` }, // Using vendor token (should fail)
        },
      );
      logTest(
        "GET /admin/change-requests (endpoint exists)",
        false,
        "Should reject vendor token",
      );
    } catch (error) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        logTest(
          "GET /admin/change-requests (endpoint exists)",
          true,
          "Correctly rejects non-admin access",
        );
      } else {
        logTest(
          "GET /admin/change-requests (endpoint exists)",
          false,
          error.response?.data?.message || error.message,
        );
      }
    }

    // ============================================================================
    // CLEANUP
    // ============================================================================
    console.log("\n\n📦 PART 6: CLEANUP");
    console.log("-".repeat(80));

    if (testPropertyId) {
      try {
        const mysql = await import("mysql2/promise");
        const db = await mysql.default.createConnection({
          host: "localhost",
          user: "root",
          password: "",
          database: "zevio",
        });

        await db.query("DELETE FROM property_pricing WHERE property_id = ?", [
          testPropertyId,
        ]);
        await db.query("DELETE FROM properties WHERE id = ?", [testPropertyId]);
        await db.end();

        logTest("Cleanup test data", true, "Test property deleted");
      } catch (error) {
        logTest("Cleanup test data", false, error.message);
      }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 HEALTH CHECK SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(
      `📊 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`,
    );
    console.log("=".repeat(80));

    if (testResults.failed === 0) {
      console.log(
        "\n🎉 ALL TESTS PASSED! System is healthy and ready for production.",
      );
    } else {
      console.log("\n⚠️  Some tests failed. Please review the errors above.");
      console.log("\nFailed Tests:");
      testResults.tests
        .filter((t) => !t.passed)
        .forEach((t) => {
          console.log(`  - ${t.name}: ${t.details}`);
        });
    }
    console.log("\n");
  } catch (error) {
    console.error("\n❌ CRITICAL ERROR:", error.message);
    process.exit(1);
  }
}

runHealthChecks();
