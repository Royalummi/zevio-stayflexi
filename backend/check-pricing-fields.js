/**
 * Direct database check for pricing fields
 */
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const db = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio_villas",
});

try {
  console.log("\n💰 CHECKING PRICING FIELDS IN DATABASE\n");
  console.log("=".repeat(100));

  // Get first property
  const [properties] = await db.query(`
    SELECT id, title, 
           price_per_night, gst_percentage,
           min_guests, extra_guest_charge,
           weekly_discount_percent, monthly_discount_percent,
           deposit_amount, maintenance_charges
    FROM properties 
    WHERE deleted_at IS NULL 
    LIMIT 1
  `);

  if (properties.length === 0) {
    console.log("❌ No properties found");
    process.exit(1);
  }

  const property = properties[0];
  console.log(`\n✅ Property: ${property.title}`);
  console.log(`   ID: ${property.id}\n`);

  console.log("📊 PRICING FIELDS FROM DATABASE:");
  console.log("=".repeat(100));

  const pricingFields = [
    "price_per_night",
    "gst_percentage",
    "min_guests",
    "extra_guest_charge",
    "weekly_discount_percent",
    "monthly_discount_percent",
    "deposit_amount",
    "maintenance_charges",
  ];

  pricingFields.forEach((field) => {
    const value = property[field];
    const hasValue = value !== null && value !== undefined;
    const status = hasValue ? "✅" : "❌";
    console.log(`${status} ${field}: ${value} (${typeof value})`);
  });

  // Check if these columns even exist
  console.log("\n📋 PROPERTIES TABLE STRUCTURE (Pricing-related columns):");
  console.log("=".repeat(100));

  const [columns] = await db.query(`DESCRIBE properties`);
  const pricingColumns = columns.filter(
    (col) =>
      col.Field.includes("price") ||
      col.Field.includes("gst") ||
      col.Field.includes("guest") ||
      col.Field.includes("discount") ||
      col.Field.includes("deposit") ||
      col.Field.includes("maintenance") ||
      col.Field.includes("notice"),
  );

  console.log(`Found ${pricingColumns.length} pricing-related columns:\n`);
  pricingColumns.forEach((col) => {
    console.log(
      `   - ${col.Field} (${col.Type}) ${col.Null === "YES" ? "NULL" : "NOT NULL"}`,
    );
  });

  // Check if pricing columns are missing
  console.log("\n🔍 CHECKING FOR MISSING PRICING COLUMNS:");
  console.log("=".repeat(100));

  const expectedPricingFields = [
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
    "allow_corporate_booking",
  ];

  const existingFieldNames = columns.map((c) => c.Field);
  const missingFields = expectedPricingFields.filter(
    (f) => !existingFieldNames.includes(f),
  );

  if (missingFields.length > 0) {
    console.log(`\n❌ MISSING ${missingFields.length} PRICING COLUMNS:`);
    missingFields.forEach((field) => console.log(`   - ${field}`));
  } else {
    console.log("\n✅ All expected pricing columns exist in database");
  }

  console.log("\n" + "=".repeat(100));
} catch (error) {
  console.error("❌ Error:", error.message);
} finally {
  await db.end();
}
