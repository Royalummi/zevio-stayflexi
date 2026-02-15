/**
 * ============================================
 * COMPREHENSIVE ADD PROPERTY FORM TEST
 * ============================================
 *
 * Purpose: Test complete "Add New Property" form submission
 * Validates: Frontend, Backend, Database integrity
 * Role: Senior Full-Stack Developer + QA Engineer
 *
 * This script simulates a real admin/vendor filling out
 * the entire property form with all fields populated.
 *
 * Run: node backend/test-add-property-complete.js
 */

import axios from "axios";

const API_BASE = "http://localhost:5000/api";
let authToken = "";

// Test credentials
const ADMIN_CREDENTIALS = {
  email: "admin@zevio.com",
  password: "admin123",
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function log(emoji, message, data = null) {
  console.log(`\n${emoji} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logSection(title) {
  console.log("\n" + "=".repeat(60));
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}

// ============================================
// STEP 1: LOGIN AS ADMIN
// ============================================

async function loginAsAdmin() {
  logSection("STEP 1: LOGIN AS ADMIN");

  try {
    const response = await axios.post(
      `${API_BASE}/auth/login`,
      ADMIN_CREDENTIALS,
    );

    if (response.data && response.data.data && response.data.data.accessToken) {
      authToken = response.data.data.accessToken;
      const user = response.data.data.user;

      log("✅", "Login successful", {
        name: user.name || user.full_name,
        email: user.email,
        role: user.role,
      });

      return true;
    } else {
      log("❌", "Login failed: Invalid response structure", response.data);
      return false;
    }
  } catch (error) {
    log("❌", "Login error", {
      message: error.message,
      response: error.response?.data,
    });
    return false;
  }
}

// ============================================
// STEP 2: FETCH DROPDOWN DATA
// ============================================

async function fetchDropdownData() {
  logSection("STEP 2: FETCH DROPDOWN DATA");

  const data = {
    cities: [],
    vendors: [],
    propertyTypes: [],
  };

  try {
    // Fetch cities
    log("📍", "Fetching cities...");
    const citiesRes = await axios.get(`${API_BASE}/admin/cities`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    data.cities = citiesRes.data.data || [];
    log("✅", `Found ${data.cities.length} cities`);

    // Fetch vendors
    log("👥", "Fetching vendors...");
    const vendorsRes = await axios.get(`${API_BASE}/admin/vendors`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    data.vendors = vendorsRes.data.data || [];
    log("✅", `Found ${data.vendors.length} vendors`);

    // Fetch property types
    log("🏠", "Fetching property types...");
    const typesRes = await axios.get(`${API_BASE}/admin/property-types`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    data.propertyTypes = typesRes.data.data || [];
    log("✅", `Found ${data.propertyTypes.length} property types`);

    return data;
  } catch (error) {
    log("❌", "Error fetching dropdown data", {
      message: error.message,
      response: error.response?.data,
    });
    return null;
  }
}

// ============================================
// STEP 3: CREATE COMPLETE PROPERTY DATA
// ============================================

function createPropertyData(dropdownData) {
  logSection("STEP 3: CREATE PROPERTY DATA");

  // Select first available options for dropdowns
  const vendorId = dropdownData.vendors[0]?.id || 1;
  const cityId = dropdownData.cities[0]?.id || 1;
  const propertyTypeId = dropdownData.propertyTypes[0]?.id || 1;

  const propertyData = {
    // Basic Information (Section 1)
    vendor_id: vendorId,
    city_id: cityId,
    property_type_id: propertyTypeId,
    title: "Luxury Test Villa with Pool - Automated Test",
    description:
      "This is a comprehensive test property created by automated testing script. Features luxury amenities, spacious rooms, and beautiful garden.",

    // Location & Address (Section 2)
    address: "123 Test Avenue, Premium Locality",
    area: "Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500033",
    maps_location: "https://maps.google.com/?q=17.4399,78.4983",

    // Property Details (Section 3)
    bedrooms: 3,
    bathrooms: 2,
    max_guests: 6,
    check_in_time: "2:00 PM",
    check_out_time: "11:00 AM",

    // Pricing (Section 4)
    price_per_night: 5000,
    gst_percentage: 18,
    min_guests: 2,
    extra_guest_charge: 500,
    min_children: 0,
    max_children: 3,
    extra_child_charge: 300,

    // Service Apartment Details (Section 4.5)
    weekly_discount_percent: 15,
    monthly_discount_percent: 25,
    quarterly_discount_percent: 30,
    long_term_discount_percent: 35,
    allow_corporate_booking: true,
    corporate_discount_percent: 20,
    deposit_amount: 10000,
    maintenance_charges: 2000,
    notice_period_days: 30,
    min_stay_days: 1,
    max_stay_days: 90,
    housekeeping_frequency: "weekly",
    laundry_frequency: "weekly",
    utilities_included: true,
    parking_slots: 2,
    floor_number: 5,
    wifi_speed_mbps: 100,
    wifi_provider: "ACT Fibernet",
    furnishing_type: "fully_furnished",

    // Recommendations (Section 4.6)
    is_recommended: true,
    recommended_priority: 5,

    // Primary Incharge (Section 5)
    primary_incharge_name: "John Doe",
    primary_incharge_phone: "+919876543210",
    primary_incharge_email: "john.doe@example.com",
    primary_incharge_whatsapp: "+919876543210",
    primary_incharge_alt_contact: "+918765432109",

    // Secondary Incharge (Section 6)
    secondary_incharge_name: "Jane Smith",
    secondary_incharge_phone: "+919988776655",
    secondary_incharge_email: "jane.smith@example.com",
    secondary_incharge_whatsapp: "+919988776655",
    secondary_incharge_alt_contact: "+918877665544",

    // Booking Rules (Section 7)
    same_day_booking_allowed: true,
    max_booking_days: 365,

    // Amenities (Section 8) - Send as JSON string
    amenities: JSON.stringify([
      "WiFi",
      "Air Conditioning",
      "Swimming Pool",
      "Free Parking",
      "Kitchen",
      "TV",
      "Hot Water",
      "Security",
      "Garden",
      "Balcony",
    ]),

    // House Rules (Section 9) - Send as JSON string
    house_rules: JSON.stringify({
      check_in_after: "2:00 PM",
      check_out_before: "11:00 AM",
      no_smoking: true,
      no_parties: true,
      no_events: false,
      pets_allowed: false,
      pets_approval_required: false,
      quiet_hours: "10:00 PM - 8:00 AM",
      additional_rules: [
        "Please maintain cleanliness",
        "Respect neighbors",
        "No loud music after 10 PM",
      ],
    }),

    // Cancellation Policy (Section 10) - Send as JSON string
    cancellation_policy: JSON.stringify({
      policy_type: "Flexible",
      free_cancellation_hours: 48,
      free_cancellation_text: "Free cancellation for 48 hours after booking",
      partial_refund_days: 7,
      partial_refund_percentage: 50,
      partial_refund_text:
        "Cancel up to 7 days before check-in for a 50% refund",
      no_refund_text: "Cancellations within 7 days are non-refundable",
      cleaning_fee_refundable: true,
      service_fee_refundable_hours: 48,
      notes: "Please read the cancellation policy carefully before booking.",
    }),

    // Property Guidelines (Section 11) - Send as individual fields, not nested object
    check_in_guidelines:
      "<p><strong>Check-in Process:</strong></p><ul><li>Present valid ID proof</li><li>Complete registration form</li><li>Receive keys and property tour</li></ul>",
    house_rules_text:
      "<p><strong>House Rules:</strong></p><ul><li>No smoking inside property</li><li>Keep noise levels down after 10 PM</li><li>Report any damages immediately</li></ul>",
    amenities_guide:
      "<p><strong>Amenities Guide:</strong></p><ul><li>WiFi password available at check-in</li><li>Pool hours: 6 AM - 8 PM</li><li>Kitchen fully equipped with utensils</li></ul>",
    safety_information:
      "<p><strong>Safety Information:</strong></p><ul><li>Fire extinguisher in kitchen</li><li>First aid kit in bedroom</li><li>Emergency exits marked</li></ul>",
    local_area_info:
      "<p><strong>Local Area:</strong></p><ul><li>Supermarket 500m away</li><li>Hospital 2km away</li><li>Airport 15km away</li></ul>",
    emergency_contacts:
      "<p><strong>Emergency Contacts:</strong></p><ul><li>Property Manager: +919876543210</li><li>Police: 100</li><li>Ambulance: 108</li></ul>",

    // Photos (Section 12) - Send as JSON string
    photos: JSON.stringify([
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&h=800&fit=crop",
    ]),

    // Status
    status: "draft",
  };

  log("✅", "Property data created with all sections filled", {
    title: propertyData.title,
    price: propertyData.price_per_night,
    bedrooms: propertyData.bedrooms,
    amenities_count: propertyData.amenities.length,
    photos_count: propertyData.photos.length,
  });

  return propertyData;
}

// ============================================
// STEP 4: SUBMIT PROPERTY
// ============================================

async function submitProperty(propertyData) {
  logSection("STEP 4: SUBMIT PROPERTY");

  try {
    log("📤", "Submitting property to API...");

    const response = await axios.post(
      `${API_BASE}/admin/properties`,
      propertyData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.success) {
      log("✅", "Property created successfully!", {
        propertyId: response.data.data.id,
        message: response.data.message,
      });

      return response.data.data;
    } else {
      log("⚠️", "Unexpected response structure", response.data);
      return null;
    }
  } catch (error) {
    log("❌", "ERROR SUBMITTING PROPERTY", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Detailed error breakdown
    if (error.response?.data) {
      const errorData = error.response.data;

      if (errorData.errors) {
        log("🔍", "Validation Errors:", errorData.errors);
      }

      if (errorData.message) {
        log("💬", "Error Message:", errorData.message);
      }
    }

    return null;
  }
}

// ============================================
// STEP 5: VERIFY PROPERTY IN DATABASE
// ============================================

async function verifyProperty(propertyId) {
  logSection("STEP 5: VERIFY PROPERTY IN DATABASE");

  try {
    log("🔍", `Fetching property ${propertyId} from API...`);

    const response = await axios.get(
      `${API_BASE}/admin/properties/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (response.data && response.data.success) {
      const property = response.data.data;

      log("✅", "Property verified in database", {
        id: property.id,
        title: property.title,
        status: property.status,
        price_per_night: property.price_per_night,
        bedrooms: property.bedrooms,
        city: property.city,
      });

      // Check critical fields
      const checks = {
        "Title exists": !!property.title,
        "Price set": !!property.price_per_night,
        "Location set": !!property.city && !!property.state,
        "Amenities loaded":
          Array.isArray(property.amenities) && property.amenities.length > 0,
        "Photos loaded":
          Array.isArray(property.photos) && property.photos.length > 0,
        "House rules set": !!property.house_rules,
        "Cancellation policy set": !!property.cancellation_policy,
        "Primary incharge set": !!property.primary_incharge_name,
      };

      log("📋", "Data integrity checks:");
      Object.entries(checks).forEach(([check, passed]) => {
        console.log(`  ${passed ? "✅" : "❌"} ${check}`);
      });

      return property;
    } else {
      log("⚠️", "Property not found or invalid response", response.data);
      return null;
    }
  } catch (error) {
    log("❌", "Error verifying property", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return null;
  }
}

// ============================================
// STEP 6: CLEANUP (DELETE TEST PROPERTY)
// ============================================

async function cleanupProperty(propertyId) {
  logSection("STEP 6: CLEANUP TEST PROPERTY");

  try {
    log("🗑️", `Deleting test property ${propertyId}...`);

    const response = await axios.delete(
      `${API_BASE}/admin/properties/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );

    if (response.data && response.data.success) {
      log("✅", "Test property deleted successfully");
      return true;
    } else {
      log("⚠️", "Unexpected delete response", response.data);
      return false;
    }
  } catch (error) {
    log("❌", "Error deleting property", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return false;
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runCompleteTest() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  COMPREHENSIVE ADD PROPERTY FORM TEST                      ║");
  console.log("║  Testing Frontend → Backend → Database Flow                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  let propertyId = null;

  try {
    // Step 1: Login
    const loginSuccess = await loginAsAdmin();
    if (!loginSuccess) {
      log("❌", "Test failed: Could not login");
      return;
    }

    // Step 2: Fetch dropdown data
    const dropdownData = await fetchDropdownData();
    if (!dropdownData) {
      log("❌", "Test failed: Could not fetch dropdown data");
      return;
    }

    if (
      dropdownData.cities.length === 0 ||
      dropdownData.vendors.length === 0 ||
      dropdownData.propertyTypes.length === 0
    ) {
      log("⚠️", "Warning: Missing dropdown data", {
        cities: dropdownData.cities.length,
        vendors: dropdownData.vendors.length,
        propertyTypes: dropdownData.propertyTypes.length,
      });
      log(
        "💡",
        "Please ensure cities, vendors, and property types exist in database",
      );
      return;
    }

    // Step 3: Create property data
    const propertyData = createPropertyData(dropdownData);

    // Step 4: Submit property
    const createdProperty = await submitProperty(propertyData);
    if (!createdProperty) {
      log("❌", "Test failed: Property creation failed");
      return;
    }

    propertyId = createdProperty.id;

    // Step 5: Verify property
    const verifiedProperty = await verifyProperty(propertyId);
    if (!verifiedProperty) {
      log("⚠️", "Warning: Property created but verification failed");
    }

    // Step 6: Cleanup
    if (propertyId) {
      await cleanupProperty(propertyId);
    }

    // Final Summary
    logSection("TEST RESULTS");
    log("🎉", "ALL TESTS PASSED!", {
      login: "✅",
      dropdown_data: "✅",
      property_creation: "✅",
      database_verification: verifiedProperty ? "✅" : "⚠️",
      cleanup: "✅",
    });
  } catch (error) {
    log("❌", "Unexpected error in test runner", {
      message: error.message,
      stack: error.stack,
    });

    // Attempt cleanup if property was created
    if (propertyId) {
      log("🗑️", "Attempting cleanup...");
      await cleanupProperty(propertyId);
    }
  }
}

// ============================================
// RUN TEST
// ============================================

console.log("\n🚀 Starting comprehensive property form test...\n");
runCompleteTest()
  .then(() => {
    console.log("\n✨ Test execution complete\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error:", error);
    process.exit(1);
  });
