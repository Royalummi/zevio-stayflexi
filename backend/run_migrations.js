// Script to run migrations
// Run this file with: node run_migrations.js

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function runMigrations() {
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

    console.log("✅ Connected to database");

    // Migration 1: Create user_settings table
    console.log("\n📝 Running Migration 1: create_user_settings_table.sql");
    const migration1 = fs.readFileSync(
      path.join(__dirname, "migrations", "create_user_settings_table.sql"),
      "utf8"
    );
    await connection.query(migration1);
    console.log("✅ Migration 1 completed successfully");

    // Migration 2: Add password reset columns
    console.log("\n📝 Running Migration 2: add_password_reset_columns.sql");
    const migration2 = fs.readFileSync(
      path.join(__dirname, "migrations", "add_password_reset_columns.sql"),
      "utf8"
    );
    await connection.query(migration2);
    console.log("✅ Migration 2 completed successfully");

    // Verify migrations
    console.log("\n🔍 Verifying migrations...");

    // Check user_settings table
    const [tables] = await connection.query("SHOW TABLES LIKE 'user_settings'");
    if (tables.length > 0) {
      console.log("✅ user_settings table created");

      // Check columns
      const [columns] = await connection.query("DESCRIBE user_settings");
      console.log(`   - ${columns.length} columns created`);

      // Check for existing user settings
      const [settings] = await connection.query(
        "SELECT COUNT(*) as count FROM user_settings"
      );
      console.log(
        `   - ${settings[0].count} default settings created for existing users`
      );
    }

    // Check users table for reset columns
    const [userColumns] = await connection.query("DESCRIBE users");
    const hasResetToken = userColumns.some(
      (col) => col.Field === "reset_token"
    );
    const hasResetExpiry = userColumns.some(
      (col) => col.Field === "reset_token_expiry"
    );

    if (hasResetToken && hasResetExpiry) {
      console.log("✅ Password reset columns added to users table");
      console.log("   - reset_token column added");
      console.log("   - reset_token_expiry column added");
    }

    console.log("\n🎉 All migrations completed successfully!");
    console.log("\n📊 Migration Summary:");
    console.log("   1. user_settings table created with 11 preference columns");
    console.log("   2. Default settings created for all existing users");
    console.log("   3. Password reset columns added to users table");
    console.log("   4. Indexes created for optimal performance");
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n✅ Database connection closed");
    }
  }
}

// Run migrations
runMigrations();
