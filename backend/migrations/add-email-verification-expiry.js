/**
 * MIGRATION: Add email_verification_token_expiry column to users table
 * Session: Corporate verification hardening
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

async function run() {
  try {
    console.log(
      "\n🔄 Checking for email_verification_token_expiry column...\n",
    );

    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'email_verification_token_expiry'`,
    );

    if (cols.length > 0) {
      console.log("✅ Column already exists — skipping.");
    } else {
      await db.query(
        `ALTER TABLE users ADD COLUMN email_verification_token_expiry DATETIME NULL
         AFTER email_verification_token`,
      );
      console.log(
        "✅ Added email_verification_token_expiry column to users table.",
      );
    }
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

await run();
