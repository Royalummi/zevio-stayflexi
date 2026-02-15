import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio",
  multipleStatements: true, // Allow multiple SQL statements
};

async function runSession64Migration() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database\n");

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "session_64_alter_tables.sql",
    );
    console.log(`📝 Reading migration file: ${migrationPath}`);

    const sql = fs.readFileSync(migrationPath, "utf8");

    // Split by common statement endings to show progress
    const statements = sql
      .split(";")
      .filter((stmt) => stmt.trim() && !stmt.trim().startsWith("--"));

    console.log(`\n🚀 Executing ${statements.length} SQL statements...\n`);

    // Execute the entire migration
    await connection.query(sql);

    console.log("\n✅ SESSION 64 MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("\n📊 Changes applied:");
    console.log(
      "   ✅ Modified bookings table (service_charge, coupon fields)",
    );
    console.log("   ✅ Upgraded coupons table (first_time type, new fields)");
    console.log("   ✅ Upgraded coupon_usages table (reservation tracking)");
    console.log("   ✅ Upgraded reviews table (admin moderation)");
    console.log("   ✅ Created review_photos table (R2 storage)");
    console.log("   ✅ Created review_email_log table (email tracking)");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("\nError details:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

runSession64Migration();
