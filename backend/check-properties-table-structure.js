/**
 * CHECK: What columns exist in properties table?
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
  const [columns] = await db.query(`
    DESCRIBE properties
  `);

  console.log("\n═══════════════════════════════════════");
  console.log("PROPERTIES TABLE STRUCTURE");
  console.log("═══════════════════════════════════════\n");

  console.log("Total columns:", columns.length, "\n");

  // Check for guideline-related columns
  const guidelineColumns = columns.filter(
    (col) =>
      col.Field.includes("guideline") ||
      col.Field.includes("rules") ||
      col.Field.includes("amenities_guide") ||
      col.Field.includes("safety") ||
      col.Field.includes("local_area") ||
      col.Field.includes("emergency"),
  );

  if (guidelineColumns.length > 0) {
    console.log("✅ Found guideline columns:");
    guidelineColumns.forEach((col) => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
  } else {
    console.log("❌ NO GUIDELINE COLUMNS FOUND!");
    console.log("\n   Need to add these columns:");
    console.log("   - check_in_guidelines");
    console.log("   - house_rules_text");
    console.log("   - amenities_guide");
    console.log("   - safety_information");
    console.log("   - local_area_info");
    console.log("   - emergency_contacts");
  }

  console.log("\n═══════════════════════════════════════");
  console.log("ALL COLUMNS:");
  console.log("═══════════════════════════════════════\n");
  columns.forEach((col, idx) => {
    console.log(
      `${idx + 1}. ${col.Field} (${col.Type}) ${col.Null === "YES" ? "NULL" : "NOT NULL"}`,
    );
  });
} catch (error) {
  console.error("Error:", error);
} finally {
  await db.end();
}
