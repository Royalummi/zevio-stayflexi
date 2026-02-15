import db from "./src/config/database.js";

async function checkContactTypesSchema() {
  console.log("🔍 Checking contact_types table schema...\n");

  try {
    const [tables] = await db.query(`SHOW TABLES LIKE 'contact_types'`);

    if (tables.length === 0) {
      console.log("❌ contact_types table does not exist!");
      process.exit(0);
    }

    const [columns] = await db.query(`DESCRIBE contact_types`);
    console.log("✅ contact_types table columns:");
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

checkContactTypesSchema();
