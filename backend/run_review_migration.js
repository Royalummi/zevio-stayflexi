// Quick script to run review admin columns migration
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runMigration() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "zevio",
      multipleStatements: true,
    });

    console.log("✅ Connected to database");

    console.log("\n📝 Running Migration: add_review_admin_columns.sql");
    const migration = fs.readFileSync(
      path.join(__dirname, "migrations", "add_review_admin_columns.sql"),
      "utf8",
    );
    await connection.query(migration);
    console.log("✅ Migration completed successfully");

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
