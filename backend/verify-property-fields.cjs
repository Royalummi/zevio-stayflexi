const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
};

async function verifyFields() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database\n");

    // Get first property ID
    const [properties] = await connection.query(
      "SELECT id, title FROM properties LIMIT 1",
    );

    if (properties.length === 0) {
      console.log("❌ No properties found in database");
      return;
    }

    const propertyId = properties[0].id;
    const propertyTitle = properties[0].title;

    console.log(`📋 Checking Property: "${propertyTitle}" (${propertyId})\n`);
    console.log("=".repeat(80));

    // Simulate backend getPropertyById query
    const [propertyData] = await connection.query(
      "SELECT * FROM properties WHERE id = ?",
      [propertyId],
    );

    const [pricingData] = await connection.query(
      "SELECT * FROM property_pricing WHERE property_id = ?",
      [propertyId],
    );

    console.log("\n🏠 PROPERTY TABLE FIELDS:");
    console.log("-".repeat(80));
    const property = propertyData[0];
    const displayFields = [
      "title",
      "city_name",
      "city_state",
      "bedrooms",
      "bathrooms",
      "max_guests",
      "check_in_time",
      "check_out_time",
      "min_stay_days",
      "max_stay_days",
      "status",
      "property_type_id",
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];

    displayFields.forEach((field) => {
      const value = property[field];
      const display = value
        ? typeof value === "string" && value.length > 50
          ? value.substring(0, 50) + "..."
          : value
        : "(empty)";
      console.log(`  ✓ ${field.padEnd(25)}: ${display}`);
    });

    console.log("\n💰 PRICING TABLE FIELDS (property_pricing):");
    console.log("-".repeat(80));
    if (pricingData.length > 0) {
      const pricing = pricingData[0];
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

      pricingFields.forEach((field) => {
        const value = pricing[field];
        const display =
          value !== null && value !== undefined ? value : "(null)";
        console.log(`  ✓ ${field.padEnd(30)}: ${display}`);
      });
    } else {
      console.log("  ❌ No pricing data found for this property!");
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ Field verification complete\n");

    console.log("📝 SUMMARY:");
    console.log(`   - Property: ${property.title || "(no title)"}`);
    console.log(
      `   - Guidelines populated: ${property.check_in_guidelines ? "YES" : "NO"}`,
    );
    console.log(
      `   - Pricing data exists: ${pricingData.length > 0 ? "YES" : "NO"}`,
    );
    if (pricingData.length > 0) {
      console.log(
        `   - Price per night: ₹${pricingData[0].price_per_night || 0}`,
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyFields();
