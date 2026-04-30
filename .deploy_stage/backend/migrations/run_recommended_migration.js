// Run Recommended Properties Migration
// Usage: node migrations/run_recommended_migration.js

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function runRecommendedMigration() {
  let connection;

  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "zevio",
      multipleStatements: true,
    });

    console.log("✅ Connected to database: zevio");
    console.log("\n" + "=".repeat(60));
    console.log("📝 Running Migration: Recommended Properties");
    console.log("=".repeat(60) + "\n");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "10_add_recommended_properties_fields.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Execute migration
    await connection.query(migrationSQL);

    console.log("✅ Migration executed successfully!\n");

    // Verify columns were added
    console.log("🔍 Verifying new columns...\n");
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'zevio' 
        AND TABLE_NAME = 'properties'
        AND COLUMN_NAME IN ('is_recommended', 'recommended_priority', 'recommended_at', 'recommended_by')
      ORDER BY ORDINAL_POSITION
    `);

    if (columns.length === 4) {
      console.log("✅ All 4 columns added successfully:");
      columns.forEach((col) => {
        console.log(
          `  - ${col.COLUMN_NAME} (${col.COLUMN_TYPE}) - ${col.COLUMN_COMMENT}`,
        );
      });
    } else {
      console.log("⚠️  Warning: Expected 4 columns but found", columns.length);
    }

    // Verify index
    console.log("\n🔍 Verifying index...\n");
    const [indexes] = await connection.query(`
      SHOW INDEX FROM properties WHERE Key_name = 'idx_recommended'
    `);

    if (indexes.length > 0) {
      console.log("✅ Index 'idx_recommended' created successfully");
    } else {
      console.log("⚠️  Warning: Index 'idx_recommended' not found");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 Migration completed successfully!");
    console.log("=".repeat(60) + "\n");

    console.log("Next steps:");
    console.log("1. Restart backend server");
    console.log("2. Test recommended properties API endpoints");
    console.log("3. Update admin panel to manage recommendations\n");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);
    if (error.sql) {
      console.error("\nFailed SQL:");
      console.error(error.sql);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run migration
runRecommendedMigration();
