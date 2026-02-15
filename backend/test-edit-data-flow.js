/**
 * Test Script: Edit Data Flow Verification
 * Tests if property data is fetched correctly for editing
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

// Test admin credentials (update these based on your test data)
const ADMIN_CREDENTIALS = {
  email: "admin@zevio.com",
  password: "admin123",
};

let authToken = null;

// Helper function to make authenticated requests
async function authenticatedRequest(url, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  const response = await axios({
    url,
    method: options.method || "GET",
    headers,
    data: options.body,
    validateStatus: () => true, // Don't throw on any status
  });

  return {
    json: async () => response.data,
    status: response.status,
  };
}

// Step 1: Login as admin
async function loginAsAdmin() {
  console.log("\n========================================");
  console.log("STEP 1: Admin Login");
  console.log("========================================\n");

  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      ADMIN_CREDENTIALS,
    );
    const data = response.data;

    if (data.success && data.data && data.data.accessToken) {
      authToken = data.data.accessToken;
      console.log("✅ Login Successful");
      console.log(`Token: ${authToken.substring(0, 20)}...`);
      console.log(`Role: ${data.data.user.role}`);
      return true;
    } else {
      console.log("❌ Login Failed:", data.message || "No token in response");
      return false;
    }
  } catch (error) {
    console.log("❌ Login Error:", error.message);
    console.log("Error details:", error.response?.data);
    return false;
  }
}

// Step 2: Get list of properties
async function getProperties() {
  console.log("\n========================================");
  console.log("STEP 2: Fetch Properties List");
  console.log("========================================\n");

  try {
    const response = await axios.get(`${BASE_URL}/admin/properties`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = response.data;

    const properties = data.data?.properties || data.data || [];

    if (data.success && properties.length > 0) {
      console.log(`✅ Found ${properties.length} properties`);
      console.log("\nFirst 3 Properties:");
      properties.slice(0, 3).forEach((prop, idx) => {
        console.log(`\n${idx + 1}. Property ID: ${prop.id}`);
        console.log(`   Title: ${prop.title}`);
        console.log(`   Type ID: ${prop.property_type_id}`);
        console.log(`   Status: ${prop.status}`);
      });
      return properties[0]; // Return first property for testing
    } else {
      console.log("❌ No properties found");
      return null;
    }
  } catch (error) {
    console.log("❌ Error fetching properties:", error.message);
    console.log("Error response:", error.response?.data);
    return null;
  }
}

// Step 3: Fetch single property for editing
async function fetchPropertyForEdit(propertyId) {
  console.log("\n========================================");
  console.log(`STEP 3: Fetch Property ${propertyId} for Editing`);
  console.log("========================================\n");

  try {
    const response = await axios.get(
      `${BASE_URL}/admin/properties/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    const data = response.data;

    if (data.success && data.data) {
      const property = data.data;

      console.log("✅ Property Data Fetched Successfully\n");

      // Check all critical fields
      console.log("📋 BASIC INFO:");
      console.log(`   ID: ${property.id}`);
      console.log(`   Title: ${property.title || "❌ MISSING"}`);
      console.log(
        `   Description: ${property.description ? "✅ Present" : "❌ MISSING"}`,
      );
      console.log(
        `   Property Type ID: ${property.property_type_id || "❌ MISSING"}`,
      );
      console.log(`   Status: ${property.status || "❌ MISSING"}`);

      console.log("\n📍 LOCATION:");
      console.log(`   City ID: ${property.city_id || "❌ MISSING"}`);
      console.log(`   City Name: ${property.city_name || "❌ MISSING"}`);
      console.log(
        `   State: ${property.city_state || property.state_name || "❌ MISSING"}`,
      );
      console.log(`   Area: ${property.area || "❌ MISSING"}`);
      console.log(`   Address: ${property.address || "❌ MISSING"}`);
      console.log(`   Pincode: ${property.pincode || "❌ MISSING"}`);

      console.log("\n💰 PRICING:");
      console.log(`   Base Price: ${property.base_price || "❌ MISSING"}`);
      console.log(
        `   Weekend Price: ${property.weekend_price || "❌ MISSING"}`,
      );
      console.log(
        `   Monthly Discount: ${property.monthly_discount_percent || "❌ MISSING"}%`,
      );

      console.log("\n🏠 CAPACITY:");
      console.log(`   Max Guests: ${property.max_guests || "❌ MISSING"}`);
      console.log(`   Bedrooms: ${property.bedrooms || "❌ MISSING"}`);
      console.log(`   Bathrooms: ${property.bathrooms || "❌ MISSING"}`);

      console.log("\n⏰ CHECK-IN/OUT:");
      console.log(`   Check-in: ${property.check_in_time || "❌ MISSING"}`);
      console.log(`   Check-out: ${property.check_out_time || "❌ MISSING"}`);

      console.log("\n📱 CONTACT:");
      console.log(`   Phone: ${property.contact_phone || "❌ MISSING"}`);
      console.log(`   Email: ${property.contact_email || "❌ MISSING"}`);

      console.log("\n🎯 FEATURES:");
      console.log(`   Featured: ${property.is_featured ? "✅ Yes" : "❌ No"}`);
      console.log(`   Priority: ${property.priority_order || "❌ MISSING"}`);
      console.log(`   WiFi: ${property.wifi_available ? "✅ Yes" : "❌ No"}`);
      console.log(
        `   Parking: ${property.parking_available ? "✅ Yes" : "❌ No"}`,
      );

      console.log("\n📦 JSON FIELDS:");
      console.log(
        `   Amenities: ${property.amenities ? (typeof property.amenities === "string" ? "String (needs parsing)" : "✅ Object") : "❌ NULL"}`,
      );
      console.log(
        `   House Rules: ${property.house_rules ? (typeof property.house_rules === "string" ? "String (needs parsing)" : "✅ Object") : "❌ NULL"}`,
      );
      console.log(
        `   Cancellation Policy: ${property.cancellation_policy ? (typeof property.cancellation_policy === "string" ? "String (needs parsing)" : "✅ Object") : "❌ NULL"}`,
      );
      console.log(
        `   Photos: ${property.photos ? (typeof property.photos === "string" ? "String (needs parsing)" : "✅ Array") : "❌ NULL"}`,
      );

      // Test JSON parsing
      console.log("\n🔍 JSON PARSING TEST:");

      try {
        const amenities =
          typeof property.amenities === "string"
            ? JSON.parse(property.amenities)
            : property.amenities;
        console.log(
          `   ✅ Amenities parsed: ${Array.isArray(amenities) ? amenities.length + " items" : "Object"}`,
        );
      } catch (e) {
        console.log(`   ❌ Amenities parse error: ${e.message}`);
      }

      try {
        const houseRules =
          typeof property.house_rules === "string"
            ? JSON.parse(property.house_rules)
            : property.house_rules;
        console.log(`   ✅ House Rules parsed: ${typeof houseRules}`);
      } catch (e) {
        console.log(`   ❌ House Rules parse error: ${e.message}`);
      }

      try {
        const cancellationPolicy =
          typeof property.cancellation_policy === "string"
            ? JSON.parse(property.cancellation_policy)
            : property.cancellation_policy;
        console.log(
          `   ✅ Cancellation Policy parsed: ${typeof cancellationPolicy}`,
        );
      } catch (e) {
        console.log(`   ❌ Cancellation Policy parse error: ${e.message}`);
      }

      try {
        const photos =
          typeof property.photos === "string"
            ? JSON.parse(property.photos)
            : property.photos;
        console.log(
          `   ✅ Photos parsed: ${Array.isArray(photos) ? photos.length + " images" : "Not an array"}`,
        );
      } catch (e) {
        console.log(`   ❌ Photos parse error: ${e.message}`);
      }

      return property;
    } else {
      console.log("❌ Failed to fetch property:", data.message);
      return null;
    }
  } catch (error) {
    console.log("❌ Error fetching property:", error.message);
    return null;
  }
}

// Step 4: Verify data mapping for AdminPropertyForm
async function verifyDataMapping(property) {
  console.log("\n========================================");
  console.log("STEP 4: Verify Data Mapping for Form");
  console.log("========================================\n");

  const requiredFields = {
    property_type_id: property.property_type_id,
    title: property.title,
    description: property.description,
    city_id: property.city_id,
    area: property.area,
    address: property.address,
    pincode: property.pincode,
    base_price: property.base_price,
    max_guests: property.max_guests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    check_in_time: property.check_in_time,
    check_out_time: property.check_out_time,
    status: property.status,
  };

  let missingCount = 0;
  let presentCount = 0;

  console.log("Required Fields Check:");
  Object.entries(requiredFields).forEach(([field, value]) => {
    if (value === null || value === undefined || value === "") {
      console.log(`   ❌ ${field}: MISSING`);
      missingCount++;
    } else {
      console.log(`   ✅ ${field}: ${value}`);
      presentCount++;
    }
  });

  console.log(
    `\n📊 Summary: ${presentCount}/${Object.keys(requiredFields).length} required fields present`,
  );

  if (missingCount > 0) {
    console.log(`⚠️  WARNING: ${missingCount} required fields are missing!`);
    return false;
  } else {
    console.log("✅ All required fields are present");
    return true;
  }
}

// Main test execution
async function runTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   Edit Data Flow Test - Zevio Property Management     ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  // Step 1: Login
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log("\n❌ TEST FAILED: Could not login");
    return;
  }

  // Step 2: Get properties list
  const firstProperty = await getProperties();
  if (!firstProperty) {
    console.log("\n❌ TEST FAILED: No properties found");
    return;
  }

  // Step 3: Fetch property for editing
  const propertyData = await fetchPropertyForEdit(firstProperty.id);
  if (!propertyData) {
    console.log("\n❌ TEST FAILED: Could not fetch property data");
    return;
  }

  // Step 4: Verify data mapping
  const mappingSuccess = await verifyDataMapping(propertyData);

  // Final Summary
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                    FINAL SUMMARY                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  if (mappingSuccess) {
    console.log("✅ ALL TESTS PASSED");
    console.log("✅ Edit flow is working correctly");
    console.log("✅ Data fetching is successful");
    console.log("✅ All required fields are present");
    console.log("✅ Form should populate correctly");
  } else {
    console.log("❌ TESTS FAILED");
    console.log("❌ Some required fields are missing");
    console.log("❌ Form may not populate correctly");
  }

  console.log("\n");
}

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ CRITICAL ERROR:", error);
  process.exit(1);
});
