/**
 * MIGRATION: Add guideline columns to properties table
 *
 * Adds 6 rich text guideline fields that are displayed in PropertyEdit form
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

async function addGuidelineColumns() {
  try {
    console.log("\n🔄 Starting migration: Add guideline columns...\n");

    const columns = [
      { name: "check_in_guidelines", type: "LONGTEXT" },
      { name: "house_rules_text", type: "LONGTEXT" },
      { name: "amenities_guide", type: "LONGTEXT" },
      { name: "safety_information", type: "LONGTEXT" },
      { name: "local_area_info", type: "LONGTEXT" },
      { name: "emergency_contacts", type: "LONGTEXT" },
    ];

    let addedCount = 0;
    let alreadyExistsCount = 0;

    for (const column of columns) {
      try {
        // Check if column already exists
        const [existing] = await db.query(`
          SHOW COLUMNS FROM properties LIKE '${column.name}'
        `);

        if (existing.length > 0) {
          console.log(`⏭️  Column '${column.name}' already exists - skipping`);
          alreadyExistsCount++;
          continue;
        }

        // Add column
        await db.query(`
          ALTER TABLE properties 
          ADD COLUMN ${column.name} ${column.type} NULL 
          AFTER cancellation_policy
        `);

        console.log(`✅ Added column: ${column.name}`);
        addedCount++;
      } catch (error) {
        if (error.code === "ER_DUP_FIELDNAME") {
          console.log(`⏭️  Column '${column.name}' already exists - skipping`);
          alreadyExistsCount++;
        } else {
          throw error;
        }
      }
    }

    console.log("\n═══════════════════════════════════════");
    console.log("✅ Migration Complete!");
    console.log(`   Added: ${addedCount} columns`);
    console.log(`   Already existed: ${alreadyExistsCount} columns`);
    console.log(`   Total: ${columns.length} columns`);
    console.log("═══════════════════════════════════════\n");

    console.log(
      "📝 Next step: Run populate-guidelines-migration.js to add default content\n",
    );
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run migration
addGuidelineColumns();
