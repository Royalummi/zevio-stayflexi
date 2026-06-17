import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const envPath = path.join(backendRoot, ".env");
if (!fs.existsSync(envPath)) {
  throw new Error(`Missing env file: ${envPath}`);
}

dotenv.config({ path: envPath });

const targetDb = (process.env.DB_NAME || "").trim();
if (!targetDb) {
  throw new Error("DB_NAME is missing in .env");
}

const requiredBaseTables = [
  "vendors",
  "properties",
  "bookings",
  "property_blackout_dates",
];

const migrationPath = path.join(
  backendRoot,
  "migrations",
  "0054_add_channel_manager_foundation.sql",
);

if (!fs.existsSync(migrationPath)) {
  throw new Error(`Migration file missing: ${migrationPath}`);
}

const backupDb = `${targetDb}_backup_${new Date()
  .toISOString()
  .replace(/[-:TZ.]/g, "")
  .slice(0, 14)}`;

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
});

const quoteId = (value) => `\`${String(value).replace(/`/g, "``")}\``;

try {
  console.log(`Target DB: ${targetDb}`);

  const [dbRows] = await connection.query(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [targetDb],
  );

  if (dbRows.length === 0) {
    throw new Error(`Target database does not exist: ${targetDb}`);
  }

  const [tableRows] = await connection.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?",
    [targetDb],
  );
  const tableSet = new Set(tableRows.map((row) => row.TABLE_NAME));

  const missingRequired = requiredBaseTables.filter(
    (table) => !tableSet.has(table),
  );
  if (missingRequired.length > 0) {
    throw new Error(
      `Target DB is missing required tables for 0054: ${missingRequired.join(", ")}`,
    );
  }

  console.log(`Creating backup database: ${backupDb}`);
  await connection.query(`CREATE DATABASE ${quoteId(backupDb)}`);

  const [baseTables] = await connection.query(
    "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [targetDb],
  );

  for (const row of baseTables) {
    const tableName = row.TABLE_NAME;
    const source = `${quoteId(targetDb)}.${quoteId(tableName)}`;
    const destination = `${quoteId(backupDb)}.${quoteId(tableName)}`;

    await connection.query(`CREATE TABLE ${destination} LIKE ${source}`);
    await connection.query(
      `INSERT INTO ${destination} SELECT * FROM ${source}`,
    );
  }

  console.log(`Backup complete: ${backupDb}`);

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  await connection.query(`USE ${quoteId(targetDb)};`);
  await connection.query(migrationSql);

  const checks = [
    "channel_manager_integrations",
    "channel_manager_property_mappings",
    "channel_manager_webhook_events",
  ];

  for (const tableName of checks) {
    const [rows] = await connection.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [targetDb, tableName],
    );

    if (rows.length === 0) {
      throw new Error(`Post-check failed, missing table: ${tableName}`);
    }
  }

  const [bookingCols] = await connection.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bookings' AND COLUMN_NAME IN ('booking_source', 'source_provider_key', 'source_reference_id', 'source_payload')",
    [targetDb],
  );
  if (bookingCols.length < 4) {
    throw new Error(
      "Post-check failed, bookings source columns are incomplete",
    );
  }

  const [blackoutCols] = await connection.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'property_blackout_dates' AND COLUMN_NAME IN ('blackout_source', 'source_provider_key', 'source_reference_id')",
    [targetDb],
  );
  if (blackoutCols.length < 3) {
    throw new Error(
      "Post-check failed, property_blackout_dates source columns are incomplete",
    );
  }

  console.log("Migration 0054 completed and verified successfully.");
  console.log(`Backup DB retained as: ${backupDb}`);
} finally {
  await connection.end();
}
