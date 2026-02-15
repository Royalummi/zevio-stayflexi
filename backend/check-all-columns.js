/**
 * Check what columns actually exist in properties table
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
  console.log("\n📋 ALL PROPERTIES TABLE COLUMNS:\n");
  console.log("=".repeat(100));

  const [columns] = await db.query(`DESCRIBE properties`);

  console.log(`Total columns: ${columns.length}\n`);

  columns.forEach((col, idx) => {
    const nullStatus = col.Null === "YES" ? "✓ NULL" : "✗ NOT NULL";
    console.log(
      `${idx + 1}. ${col.Field.padEnd(35)} ${col.Type.padEnd(20)} ${nullStatus}`,
    );
  });

  console.log("\n" + "=".repeat(100));

  // Check for pricing-related columns
  const pricingRelated = columns.filter(
    (col) =>
      col.Field.includes("price") ||
      col.Field.includes("gst") ||
      col.Field.includes("guest") ||
      col.Field.includes("discount") ||
      col.Field.includes("deposit") ||
      col.Field.includes("maintenance"),
  );

  console.log(`\n💰 PRICING-RELATED COLUMNS FOUND: ${pricingRelated.length}`);
  if (pricingRelated.length > 0) {
    pricingRelated.forEach((col) => {
      console.log(`   - ${col.Field}`);
    });
  } else {
    console.log("   ❌ NO PRICING COLUMNS FOUND IN PROPERTIES TABLE!");
    console.log("\n   This means pricing data is likely in a separate table.");
    console.log(
      '   Let me check for a "pricing" or "property_pricing" table...\n',
    );

    const [tables] = await db.query(`SHOW TABLES`);
    const tableNames = tables.map((t) => Object.values(t)[0]);

    console.log("   📊 All tables in database:");
    tableNames.forEach((name) => {
      console.log(`      - ${name}`);
    });

    const pricingTables = tableNames.filter(
      (t) => t.includes("pricing") || t.includes("price"),
    );

    if (pricingTables.length > 0) {
      console.log(
        `\n   ✅ Found pricing-related tables: ${pricingTables.join(", ")}`,
      );

      // Check structure of pricing table
      for (const table of pricingTables) {
        console.log(`\n   📋 Structure of ${table}:`);
        const [cols] = await db.query(`DESCRIBE ${table}`);
        cols.forEach((col) => {
          console.log(`      - ${col.Field} (${col.Type})`);
        });
      }
    } else {
      console.log("\n   ❌ No separate pricing table found either!");
    }
  }

  console.log("\n" + "=".repeat(100));
} catch (error) {
  console.error("❌ Error:", error.message);
} finally {
  await db.end();
}
