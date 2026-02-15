import db from "./src/config/database.js";

async function checkAmenitiesSchema() {
  console.log("🔍 Checking amenities table schema...\n");

  try {
    const [columns] = await db.query(`DESCRIBE amenities`);
    console.log("✅ Amenities table columns:");
    columns.forEach((col) => {
      console.log(
        `   - ${col.Field} (${col.Type}) ${col.Null === "NO" ? "NOT NULL" : "NULL"}`,
      );
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  }

  process.exit(0);
}

checkAmenitiesSchema();
