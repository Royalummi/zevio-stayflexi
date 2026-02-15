/**
 * Test script to verify getAllProperties and getPropertyDetails API completeness
 * Tests if all fields from database are being returned by the API
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Test credentials (use admin credentials)
const LOGIN_EMAIL = "admin@zevio.com";
const LOGIN_PASSWORD = "admin123";

let accessToken = null;

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  console.log("\n" + "=".repeat(80));
  log(title, colors.cyan);
  console.log("=".repeat(80) + "\n");
}

// Login to get access token
async function login() {
  try {
    log("🔐 Logging in as admin...", colors.blue);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    });

    if (response.data.success) {
      accessToken = response.data.data.accessToken;
      log("✅ Login successful!", colors.green);
      return true;
    } else {
      log("❌ Login failed!", colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Login error: ${error.message}`, colors.red);
    if (error.response) {
      console.log("Response status:", error.response.status);
      console.log(
        "Response data:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else if (error.request) {
      console.log("No response received. Is the backend running?");
      console.log("Request:", error.request);
    } else {
      console.log("Error details:", error);
    }
    return false;
  }
}

// Test getAllProperties API
async function testGetAllProperties() {
  logSection("TEST 1: getAllProperties API - Field Completeness Check");

  try {
    const response = await axios.get(`${API_BASE_URL}/admin/properties`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 5, // Get only 5 properties for testing
      },
    });

    if (!response.data.success) {
      log("❌ API request failed", colors.red);
      return;
    }

    const properties = response.data.data.properties;
    log(`✅ Fetched ${properties.length} properties`, colors.green);

    if (properties.length === 0) {
      log("⚠️  No properties found in database", colors.yellow);
      return;
    }

    // Check first property for field completeness
    const property = properties[0];

    log("\n📊 Checking field completeness for first property:", colors.blue);
    log(`   Property: ${property.title}`, colors.cyan);

    // Define expected fields (grouped by category)
    const expectedFields = {
      "Basic Info": [
        "id",
        "title",
        "description",
        "address",
        "area",
        "state",
        "pincode",
      ],
      "Property Details": [
        "bedrooms",
        "bathrooms",
        "max_guests",
        "rating",
        "reviews_count",
        "status",
      ],
      "Booking Configuration": [
        "same_day_booking_allowed",
        "max_booking_days",
        "check_in_time",
        "check_out_time",
      ],
      "Service Apartment Fields": [
        "min_stay_days",
        "max_stay_days",
        "housekeeping_frequency",
        "laundry_frequency",
        "utilities_included",
        "parking_slots",
        "floor_number",
        "wifi_speed_mbps",
        "wifi_provider",
        "furnishing_type",
      ],
      "Recommendation Fields": [
        "is_recommended",
        "recommended_priority",
        "maps_location",
      ],
      "City Info": ["city_id", "city_name", "city_state"],
      "Vendor Info": [
        "vendor_id",
        "vendor_name",
        "vendor_email",
        "vendor_phone",
      ],
      "Property Type Info": [
        "property_type_id",
        "property_type_name",
        "property_type_slug",
        "property_stay_type",
        "property_type_icon",
      ],
      "Pricing Info": [
        "price_per_night",
        "gst_percentage",
        "min_guests",
        "extra_guest_charge",
        "weekly_discount_percent",
        "monthly_discount_percent",
        "quarterly_discount_percent",
        "long_term_discount_percent",
        "allow_corporate_booking",
        "corporate_discount_percent",
        "deposit_amount",
        "maintenance_charges",
        "notice_period_days",
      ],
      "Images & Media": ["thumbnail", "image_count"],
      Amenities: ["amenities"],
    };

    let totalFields = 0;
    let presentFields = 0;
    let missingFields = [];

    // Check each category
    Object.entries(expectedFields).forEach(([category, fields]) => {
      log(`\n   ${category}:`, colors.magenta);

      fields.forEach((field) => {
        totalFields++;
        const exists = property.hasOwnProperty(field);
        const value = property[field];

        if (exists) {
          presentFields++;
          const displayValue =
            value === null || value === undefined
              ? "null"
              : typeof value === "object"
                ? `[${Array.isArray(value) ? value.length : "object"}]`
                : value;
          log(`      ✅ ${field}: ${displayValue}`, colors.green);
        } else {
          missingFields.push(field);
          log(`      ❌ ${field}: MISSING`, colors.red);
        }
      });
    });

    // Summary
    log("\n📈 Summary:", colors.cyan);
    log(`   Total expected fields: ${totalFields}`, colors.blue);
    log(`   Present fields: ${presentFields}`, colors.green);
    log(`   Missing fields: ${missingFields.length}`, colors.red);
    log(
      `   Completeness: ${((presentFields / totalFields) * 100).toFixed(1)}%`,
      presentFields === totalFields ? colors.green : colors.yellow,
    );

    if (missingFields.length > 0) {
      log("\n   Missing fields list:", colors.red);
      missingFields.forEach((field) => {
        log(`      - ${field}`, colors.red);
      });
    }

    // Check amenities array
    if (property.amenities && Array.isArray(property.amenities)) {
      log(
        `\n   ✅ Amenities: Found ${property.amenities.length} amenities`,
        colors.green,
      );
      if (property.amenities.length > 0) {
        log("      Sample amenities:", colors.cyan);
        property.amenities.slice(0, 3).forEach((amenity) => {
          log(`         - ${amenity.name} (${amenity.category})`, colors.cyan);
        });
      }
    } else {
      log("   ❌ Amenities: Not present or not an array", colors.red);
    }
  } catch (error) {
    log(`❌ Error testing getAllProperties: ${error.message}`, colors.red);
    if (error.response) {
      console.log("Response data:", error.response.data);
    }
  }
}

// Test getPropertyDetails API
async function testGetPropertyDetails() {
  logSection("TEST 2: getPropertyDetails API - Complete Data Check");

  try {
    // First get a property ID
    const listResponse = await axios.get(`${API_BASE_URL}/admin/properties`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        limit: 1,
      },
    });

    if (
      !listResponse.data.success ||
      listResponse.data.data.properties.length === 0
    ) {
      log("❌ No properties found to test", colors.red);
      return;
    }

    const propertyId = listResponse.data.data.properties[0].id;
    log(`Testing with property ID: ${propertyId}`, colors.blue);

    // Get property details
    const response = await axios.get(
      `${API_BASE_URL}/admin/properties/${propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!response.data.success) {
      log("❌ API request failed", colors.red);
      return;
    }

    const property = response.data.data;
    log(`✅ Fetched property details: ${property.title}`, colors.green);

    // Check for complete data structure
    log("\n📊 Checking data completeness:", colors.blue);

    const checks = [
      {
        name: "Images Array",
        condition: property.images && Array.isArray(property.images),
        count: property.images?.length || 0,
      },
      {
        name: "Pricing Object",
        condition: property.pricing && typeof property.pricing === "object",
        count: property.pricing ? Object.keys(property.pricing).length : 0,
      },
      {
        name: "Amenities Array",
        condition: property.amenities && Array.isArray(property.amenities),
        count: property.amenities?.length || 0,
      },
      {
        name: "Contacts Array",
        condition: property.contacts && Array.isArray(property.contacts),
        count: property.contacts?.length || 0,
      },
      {
        name: "Blackout Dates",
        condition:
          property.blackout_dates && Array.isArray(property.blackout_dates),
        count: property.blackout_dates?.length || 0,
      },
      {
        name: "Booking Stats",
        condition:
          property.booking_stats && typeof property.booking_stats === "object",
        count: property.booking_stats
          ? Object.keys(property.booking_stats).length
          : 0,
      },
      {
        name: "Property Type Info",
        condition: property.property_type_name && property.property_type_slug,
        count: property.property_type_name ? 1 : 0,
      },
      {
        name: "City Info",
        condition: property.city_name && property.city_state,
        count: property.city_name ? 1 : 0,
      },
    ];

    checks.forEach((check) => {
      const status = check.condition ? "✅" : "❌";
      const color = check.condition ? colors.green : colors.red;
      log(
        `   ${status} ${check.name}: ${check.count > 0 ? `${check.count} items` : "Present"}`,
        color,
      );
    });

    // Show sample pricing fields
    if (property.pricing) {
      log("\n   📊 Pricing Details:", colors.magenta);
      const pricingFields = [
        "price_per_night",
        "gst_percentage",
        "weekly_discount_percent",
        "monthly_discount_percent",
        "allow_corporate_booking",
        "deposit_amount",
      ];
      pricingFields.forEach((field) => {
        const value = property.pricing[field];
        if (value !== undefined && value !== null) {
          log(`      ${field}: ${value}`, colors.cyan);
        }
      });
    }

    // Show sample amenities
    if (property.amenities && property.amenities.length > 0) {
      log("\n   🎯 Sample Amenities:", colors.magenta);
      property.amenities.slice(0, 5).forEach((amenity) => {
        log(
          `      - ${amenity.name} (${amenity.category || "N/A"})`,
          colors.cyan,
        );
      });
    }

    // Show contacts
    if (property.contacts && property.contacts.length > 0) {
      log("\n   📞 Contacts:", colors.magenta);
      property.contacts.forEach((contact) => {
        log(
          `      - ${contact.name || "N/A"} (${contact.contact_type_name || "N/A"}): ${contact.phone}`,
          colors.cyan,
        );
      });
    }

    log("\n✅ getPropertyDetails test completed!", colors.green);
  } catch (error) {
    log(`❌ Error testing getPropertyDetails: ${error.message}`, colors.red);
    if (error.response) {
      console.log("Response data:", error.response.data);
    }
  }
}

// Run all tests
async function runTests() {
  logSection("🧪 PROPERTY API COMPLETENESS TEST SUITE");
  log("Testing if all database fields are returned by the API\n", colors.blue);

  const loginSuccess = await login();
  if (!loginSuccess) {
    log("Cannot proceed without authentication", colors.red);
    return;
  }

  await testGetAllProperties();
  await testGetPropertyDetails();

  logSection("🎉 ALL TESTS COMPLETED");
}

// Execute tests
runTests().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
});
