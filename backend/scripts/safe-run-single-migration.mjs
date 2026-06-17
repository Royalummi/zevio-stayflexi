import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");

const migrationFile = process.argv[2];
if (!migrationFile) {
  throw new Error(
    "Usage: node scripts/safe-run-single-migration.mjs <migration-file.sql>",
  );
}

const envPath = path.join(backendRoot, ".env");
if (!fs.existsSync(envPath)) {
  throw new Error(`Missing env file: ${envPath}`);
}

dotenv.config({ path: envPath });

const targetDb = (process.env.DB_NAME || "").trim();
if (!targetDb) {
  throw new Error("DB_NAME is missing in .env");
}

const migrationPath = path.join(backendRoot, "migrations", migrationFile);
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
  const [dbRows] = await connection.query(
    "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?",
    [targetDb],
  );
  if (dbRows.length === 0) {
    throw new Error(`Target database does not exist: ${targetDb}`);
  }

  console.log(`Target DB: ${targetDb}`);
  console.log(`Migration: ${migrationFile}`);
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

  console.log("Migration executed successfully.");
  console.log(`Backup DB retained as: ${backupDb}`);
} finally {
  await connection.end();
}
