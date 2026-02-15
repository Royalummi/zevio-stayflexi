/**
 * Test Property API Response - Check all fields including pricing
 */
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// You'll need to update this token after login
const ADMIN_TOKEN = "YOUR_NEW_TOKEN_HERE";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json",
  },
});

async function testPropertyFields() {
  try {
    console.log("\n🔍 TESTING PROPERTY API FIELDS\n");
    console.log("=".repeat(80));

    // Get first property
    const listResponse = await api.get("/admin/properties?limit=1");
    const properties =
      listResponse.data.data.properties || listResponse.data.data || [];

    if (properties.length === 0) {
      console.log("❌ No properties found");
      return;
    }

    const propertyId = properties[0].id;
    console.log(`\n✅ Testing Property: ${properties[0].title}`);
    console.log(`   ID: ${propertyId}\n`);

    // Get detailed property
    const response = await api.get(`/admin/properties/${propertyId}`);
    const property = response.data.data;

    // Check PRICING fields specifically
    console.log("=".repeat(80));
    console.log("💰 PRICING FIELDS:");
    console.log("=".repeat(80));

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
      "corporate_discount_percent",
      "deposit_amount",
      "maintenance_charges",
      "notice_period_days",
    ];

    pricingFields.forEach((field) => {
      const value = property[field];
      const hasValue = value !== null && value !== undefined;
      const status = hasValue ? "✅" : "❌";
      console.log(`${status} ${field}: ${value} (${typeof value})`);
    });

    // Check if there's a nested pricing object
    console.log("\n📦 NESTED PRICING OBJECT:");
    console.log("=".repeat(80));
    if (property.pricing) {
      console.log("✅ property.pricing exists");
      console.log(JSON.stringify(property.pricing, null, 2));
    } else {
      console.log("❌ property.pricing does NOT exist");
    }

    // Check ALL fields
    console.log("\n📋 ALL PROPERTY FIELDS:");
    console.log("=".repeat(80));
    Object.keys(property).forEach((key) => {
      const value = property[key];
      const type = typeof value;
      const hasValue = value !== null && value !== undefined && value !== "";
      const status = hasValue ? "✅" : "⚠️ ";
      const displayValue =
        type === "object"
          ? JSON.stringify(value).substring(0, 50) + "..."
          : value;
      console.log(`${status} ${key}: ${displayValue} (${type})`);
    });

    // SPECIFIC CHECKS
    console.log("\n🔍 SPECIFIC FIELD CHECKS:");
    console.log("=".repeat(80));

    // Check basic info
    console.log("\n1. BASIC INFO:");
    console.log(`   Title: ${property.title}`);
    console.log(`   Status: ${property.status}`);
    console.log(`   Type ID: ${property.property_type_id}`);

    // Check location
    console.log("\n2. LOCATION:");
    console.log(`   Address: ${property.address}`);
    console.log(`   City (property.city): ${property.city}`);
    console.log(`   City (property.city_name): ${property.city_name}`);
    console.log(`   State (property.state): ${property.state}`);
    console.log(`   State (property.city_state): ${property.city_state}`);

    // Check pricing - both root level and nested
    console.log("\n3. PRICING (ROOT LEVEL):");
    console.log(`   price_per_night: ${property.price_per_night}`);
    console.log(`   gst_percentage: ${property.gst_percentage}`);
    console.log(`   deposit_amount: ${property.deposit_amount}`);

    if (property.pricing) {
      console.log("\n4. PRICING (NESTED):");
      console.log(`   pricing.base_price: ${property.pricing.base_price}`);
      console.log(
        `   pricing.gst_percentage: ${property.pricing.gst_percentage}`,
      );
      console.log(
        `   pricing.deposit_amount: ${property.pricing.deposit_amount}`,
      );
    }

    // Check property details
    console.log("\n5. PROPERTY DETAILS:");
    console.log(`   Bedrooms: ${property.bedrooms}`);
    console.log(`   Bathrooms: ${property.bathrooms}`);
    console.log(`   Max Guests: ${property.max_guests}`);

    // Check guidelines
    console.log("\n6. GUIDELINES:");
    console.log(
      `   check_in_guidelines: ${property.check_in_guidelines ? "HAS CONTENT" : "EMPTY"}`,
    );
    console.log(
      `   house_rules_text: ${property.house_rules_text ? "HAS CONTENT" : "EMPTY"}`,
    );

    console.log("\n" + "=".repeat(80));
    console.log("✅ TEST COMPLETE");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("\n❌ ERROR:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log("\n⚠️  TOKEN EXPIRED - Please:");
      console.log("   1. Login at http://localhost:3001/login");
      console.log("   2. Open browser console (F12)");
      console.log("   3. Check Network tab for login response");
      console.log("   4. Copy the accessToken");
      console.log("   5. Update ADMIN_TOKEN in this file");
    }
  }
}

testPropertyFields();
