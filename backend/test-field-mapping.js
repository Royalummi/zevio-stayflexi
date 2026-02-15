/**
 * Test Script: Field Mapping Verification
 * Checks if API response fields match AdminPropertyForm expected fields
 */

import axios from "axios";

const BASE_URL = "http://localhost:5000/api";
const ADMIN_CREDENTIALS = {
  email: "admin@zevio.com",
  password: "admin123",
};

let authToken = null;

// Expected form fields based on AdminPropertyForm.jsx
const FORM_FIELDS = {
  // Basic fields
  basic: [
    "vendor_id",
    "city_id",
    "property_type_id",
    "title",
    "description",
    "address",
    "area",
    "city",
    "state",
    "pincode",
    "bedrooms",
    "bathrooms",
    "max_guests",
    "check_in_time",
    "check_out_time",
    "price_per_night",
    "gst_percentage",
    "status",
  ],

  // Location
  location: ["maps_location"],

  // Pricing
  pricing: [
    "min_guests",
    "extra_guest_charge",
    "min_children",
    "max_children",
    "extra_child_charge",
  ],

  // Long-term
  longTerm: [
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

  // Service Apartment
  serviceApartment: [
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

  // Villa
  villa: [
    "pool_type",
    "garden_type",
    "pets_allowed",
    "events_allowed",
    "event_capacity",
  ],

  // Features
  features: [
    "is_featured",
    "is_recommended",
    "recommended_priority",
    "wifi_available",
    "parking_available",
  ],

  // Contact
  contact: [
    "primary_incharge_name",
    "primary_incharge_phone",
    "primary_incharge_email",
    "primary_incharge_whatsapp",
    "primary_incharge_alt_contact",
    "secondary_incharge_name",
    "secondary_incharge_phone",
    "secondary_incharge_email",
    "secondary_incharge_whatsapp",
    "secondary_incharge_alt_contact",
  ],

  // Booking Rules
  bookingRules: ["same_day_booking_allowed", "max_booking_days"],

  // JSON fields
  json: ["amenities", "house_rules", "cancellation_policy", "photos"],

  // Guidelines
  guidelines: [
    "check_in_guidelines",
    "house_rules_text",
    "amenities_guide",
    "safety_information",
    "local_area_info",
    "emergency_contacts",
  ],
};

async function loginAsAdmin() {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/login`,
      ADMIN_CREDENTIALS,
    );
    if (response.data.success && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Login failed:", error.message);
    return false;
  }
}

async function getFirstProperty() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/properties`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const properties = response.data.data?.properties || [];
    return properties[0];
  } catch (error) {
    console.error("Error fetching properties:", error.message);
    return null;
  }
}

async function fetchPropertyDetail(propertyId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/admin/properties/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    return response.data.data;
  } catch (error) {
    console.error("Error fetching property detail:", error.message);
    return null;
  }
}

async function analyzeFieldMapping() {
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║     Field Mapping Analysis - API vs Form              ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Login
  console.log("🔑 Logging in...");
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log("❌ Login failed");
    return;
  }
  console.log("✅ Logged in successfully\n");

  // Get a property
  console.log("📋 Fetching properties...");
  const property = await getFirstProperty();
  if (!property) {
    console.log("❌ No properties found");
    return;
  }
  console.log(`✅ Found property: ${property.title} (ID: ${property.id})\n`);

  // Fetch detailed property data
  console.log("🔍 Fetching property details...");
  const propertyDetail = await fetchPropertyDetail(property.id);
  if (!propertyDetail) {
    console.log("❌ Failed to fetch property details");
    return;
  }
  console.log("✅ Property details fetched\n");

  // Get all API response fields
  const apiFields = Object.keys(propertyDetail);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📊 API RESPONSE FIELDS (" + apiFields.length + " fields)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Group and display API fields
  apiFields.sort().forEach((field) => {
    const value = propertyDetail[field];
    const valueType = typeof value;
    const displayValue =
      value === null
        ? "null"
        : value === undefined
          ? "undefined"
          : valueType === "object"
            ? JSON.stringify(value).substring(0, 50) + "..."
            : valueType === "string" && value.length > 50
              ? value.substring(0, 50) + "..."
              : value;
    console.log(`   ${field}: ${displayValue} (${valueType})`);
  });

  // Check for field name mismatches
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("⚠️  POTENTIAL FIELD NAME MISMATCHES");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Common mismatches to check
  const potentialMismatches = [
    {
      api: "city_name",
      form: "city",
      issue: "API returns city_name, form expects city",
    },
    {
      api: "city_state",
      form: "state",
      issue: "API returns city_state, form expects state",
    },
    {
      api: "base_price",
      form: "price_per_night",
      issue: "API returns base_price, form expects price_per_night",
    },
    {
      api: "weekend_price",
      form: "weekend_price_per_night",
      issue: "Potential mismatch in weekend pricing field",
    },
  ];

  let foundMismatches = false;
  potentialMismatches.forEach(({ api, form, issue }) => {
    if (apiFields.includes(api)) {
      console.log(`   ⚠️  ${issue}`);
      console.log(`      API field: "${api}" = ${propertyDetail[api]}`);
      console.log(`      Form expects: "${form}"`);
      console.log("");
      foundMismatches = true;
    }
  });

  if (!foundMismatches) {
    console.log("   ✅ No obvious field name mismatches detected\n");
  }

  // Check which form fields are missing from API
  const allFormFields = Object.values(FORM_FIELDS).flat();
  const missingInApi = allFormFields.filter(
    (field) => !apiFields.includes(field),
  );

  if (missingInApi.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(
      `⚠️  FORM FIELDS NOT IN API RESPONSE (${missingInApi.length} fields)`,
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    missingInApi.forEach((field) => {
      console.log(`   - ${field}`);
    });
    console.log("");
  }

  // Check which API fields are not in form
  const extraInApi = apiFields.filter(
    (field) => !allFormFields.includes(field),
  );

  if (extraInApi.length > 0) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`ℹ️  API FIELDS NOT IN FORM (${extraInApi.length} fields)`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("   These fields are returned by API but not used in form:\n");
    extraInApi.forEach((field) => {
      console.log(`   - ${field}`);
    });
    console.log("");
  }

  // CRITICAL ISSUE CHECK
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("🔴 CRITICAL ISSUES FOR DATA POPULATION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let criticalIssues = 0;

  // Check if price fields match
  if (
    apiFields.includes("base_price") &&
    !apiFields.includes("price_per_night")
  ) {
    console.log("   ❌ CRITICAL: Price field mismatch");
    console.log("      API returns: base_price");
    console.log("      Form expects: price_per_night");
    console.log("      Impact: Price won't populate in edit form\n");
    criticalIssues++;
  }

  // Check if city/state fields match
  if (apiFields.includes("city_name") && !apiFields.includes("city")) {
    console.log("   ❌ CRITICAL: City field mismatch");
    console.log("      API returns: city_name");
    console.log("      Form expects: city");
    console.log("      Impact: City name won't populate (only city_id will)\n");
    criticalIssues++;
  }

  if (apiFields.includes("city_state") && !apiFields.includes("state")) {
    console.log("   ❌ CRITICAL: State field mismatch");
    console.log("      API returns: city_state");
    console.log("      Form expects: state");
    console.log("      Impact: State won't populate in edit form\n");
    criticalIssues++;
  }

  if (criticalIssues === 0) {
    console.log("   ✅ No critical field mapping issues detected\n");
  } else {
    console.log(
      `   ⚠️  Found ${criticalIssues} critical field mapping issue(s)\n`,
    );
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log("📝 SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(`   API Response Fields: ${apiFields.length}`);
  console.log(`   Form Expected Fields: ${allFormFields.length}`);
  console.log(`   Missing in API: ${missingInApi.length}`);
  console.log(`   Extra in API: ${extraInApi.length}`);
  console.log(`   Critical Issues: ${criticalIssues}`);
  console.log("");

  if (criticalIssues > 0) {
    console.log(
      "❌ DATA POPULATION WILL HAVE ISSUES - Field name mismatches need to be fixed\n",
    );
  } else {
    console.log("✅ DATA POPULATION SHOULD WORK CORRECTLY\n");
  }
}

// Run analysis
analyzeFieldMapping().catch(console.error);
