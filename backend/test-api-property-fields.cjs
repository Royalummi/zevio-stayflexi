const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Test admin login and property fetch
async function testPropertyAPI() {
  try {
    console.log("🔐 Logging in as admin...\n");

    // Login
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "admin@zevio.in",
      password: "admin123",
    });

    if (!loginRes.data.success) {
      console.log("❌ Login failed:", loginRes.data.message);
      return;
    }

    const token = loginRes.data.data.token;
    console.log("✅ Login successful\n");

    // Get property list to find an ID
    console.log(" Fetching property list...\n");
    const listRes = await axios.get(`${API_URL}/admin/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.data.success || !listRes.data.data?.properties?.length) {
      console.log("❌ No properties found");
      return;
    }

    const propertyId = listRes.data.data.properties[0].id;
    const propertyTitle = listRes.data.data.properties[0].title;

    console.log(`📋 Testing Property: "${propertyTitle}"`);
    console.log(`   ID: ${propertyId}\n`);
    console.log("=".repeat(80));

    // Get property details
    console.log("\n📡 Fetching property details from API...\n");
    const detailRes = await axios.get(
      `${API_URL}/admin/properties/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!detailRes.data.success) {
      console.log("❌ Failed to fetch property details");
      return;
    }

    const property = detailRes.data.data;

    console.log("✅ API Response Structure:\n");
    console.log("-".repeat(80));

    // Check main property fields
    console.log("\n📦 Main Property Fields:");
    const mainFields = [
      "id",
      "title",
      "city_name",
      "city_state",
      "bedrooms",
      "bathrooms",
      "max_guests",
      "check_in_time",
      "check_out_time",
      "status",
    ];
    mainFields.forEach((field) => {
      console.log(
        `  ${field.padEnd(20)}: ${property[field] !== undefined ? "✓" : "✗"}`,
      );
    });

    // Check pricing object
    console.log("\n💰 Pricing Object:");
    if (property.pricing) {
      console.log("  ✓ pricing object EXISTS");
      const pricingFields = [
        "price_per_night",
        "gst_percentage",
        "min_guests",
        "extra_guest_charge",
        "min_children",
        "max_children",
        "extra_child_charge",
        "weekly_discount_percent",
        "monthly_discount_percent",
        "quarterly_discount_percent",
        "long_term_discount_percent",
        "allow_corporate_booking",
        "corporate_discount_percent",
        "deposit_amount",
        "maintenance_charges",
        "notice_period_days",
      ];

      console.log("\n  Pricing Fields:");
      pricingFields.forEach((field) => {
        const value = property.pricing[field];
        const exists = value !== null && value !== undefined;
        console.log(
          `    ${field.padEnd(32)}: ${exists ? `✓ (${value})` : "✗ (missing)"}`,
        );
      });
    } else {
      console.log("  ✗ pricing object is NULL or UNDEFINED");
    }

    // Check guideline fields
    console.log("\n📖 Guideline Fields:");
    const guidelineFields = [
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];
    guidelineFields.forEach((field) => {
      const value = property[field];
      const exists = value && value.length > 0;
      console.log(
        `  ${field.padEnd(25)}: ${exists ? `✓ (${value.length} chars)` : "✗ (empty)"}`,
      );
    });

    console.log("\n" + "=".repeat(80));
    console.log("\n✅ API Test Complete\n");

    console.log("📊 SUMMARY:");
    console.log(`   Property: ${property.title || "(no title)"}`);
    console.log(
      `   Pricing object: ${property.pricing ? "EXISTS" : "MISSING"}`,
    );
    if (property.pricing) {
      console.log(`   Price per night: ₹${property.pricing.price_per_night}`);
    }
    console.log(
      `   Guidelines populated: ${property.check_in_guidelines ? "YES" : "NO"}`,
    );
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    if (error.response) {
      console.error("   Status:", error.response.status);
      console.error("   Message:", error.response.data?.message);
    }
  }
}

testPropertyAPI();
