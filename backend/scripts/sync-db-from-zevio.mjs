/**
 * Sync non-CM schema + core data from `zevio` -> `zevio_stayflexi`.
 * - Never modifies CM tables or their data
 * - Additive schema only on shared tables (add missing columns from source)
 * - Replaces data in core tables from source (FK checks disabled during import)
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MYSQL = "C:\\xampp\\mysql\\bin\\mysql.exe";
const MYSQLDUMP = "C:\\xampp\\mysql\\bin\\mysqldump.exe";

const SOURCE_DB = "zevio";
const TARGET_DB = "zevio_stayflexi";

const CM_TABLES = new Set([
  "channel_manager_integrations",
  "channel_manager_property_mappings",
  "channel_manager_webhook_events",
  "channel_manager_daily_controls",
]);

// Core tables: schema diff + data copy from zevio
const CORE_TABLES = [
  "admins",
  "users",
  "user_settings",
  "vendors",
  "vendor_terms_conditions",
  "cities",
  "property_types",
  "amenities",
  "features",
  "guide_types",
  "location_types",
  "contact_types",
  "cancellation_policies",
  "properties",
  "property_pricing",
  "property_amenities",
  "property_features",
  "property_contacts",
  "property_locations",
  "property_guides",
  "property_guidelines",
  "property_images",
  "property_calendar_pricing",
  "property_blackout_dates",
  "property_change_requests",
  "bookings",
  "payments",
  "invoices",
  "refunds",
  "reviews",
  "review_photos",
  "review_replies",
  "review_email_log",
  "coupons",
  "coupon_usages",
  "wishlists",
  "notifications",
  "banners",
  "vendor_settlements",
  "activity_logs",
  "login_attempts",
  "refresh_tokens",
  "cron_jobs_log",
];

const connOpts = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  multipleStatements: true,
};

const log = (msg) => console.log(msg);

const getTables = async (conn, db) => {
  const [rows] = await conn.query(
    `SELECT table_name AS name, table_type AS type
     FROM information_schema.tables
     WHERE table_schema = ?
     ORDER BY table_name`,
    [db],
  );
  return rows;
};

const getColumns = async (conn, db, table) => {
  const [rows] = await conn.query(
    `SELECT column_name, column_type, is_nullable, column_default, extra, column_key
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ?
     ORDER BY ordinal_position`,
    [db, table],
  );
  return rows;
};

const buildAddColumnSql = (table, col) => {
  let def = `ALTER TABLE \`${table}\` ADD COLUMN \`${col.column_name}\` ${col.column_type}`;
  def += col.is_nullable === "YES" ? " NULL" : " NOT NULL";
  if (col.column_default !== null && col.column_default !== undefined) {
    const d = String(col.column_default);
    if (d.toUpperCase() === "NULL") {
      def += " DEFAULT NULL";
    } else if (/^current_timestamp/i.test(d)) {
      def += ` DEFAULT ${d}`;
    } else {
      def += ` DEFAULT '${d.replace(/'/g, "''")}'`;
    }
  }
  if (col.extra) def += ` ${col.extra}`;
  return def;
};

const main = async () => {
  const source = await mysql.createConnection({ ...connOpts, database: SOURCE_DB });
  const target = await mysql.createConnection({ ...connOpts, database: TARGET_DB });

  const sourceTables = await getTables(source, SOURCE_DB);
  const targetTables = await getTables(target, TARGET_DB);
  const targetTableSet = new Set(targetTables.map((t) => t.name));

  // 1) Create missing non-CM tables from source
  for (const t of sourceTables) {
    if (t.type !== "BASE TABLE") continue;
    if (CM_TABLES.has(t.name)) continue;
    if (targetTableSet.has(t.name)) continue;

    log(`CREATE missing table: ${t.name}`);
    const createSql = execSync(
      `"${MYSQLDUMP}" -h 127.0.0.1 -u root --no-data ${SOURCE_DB} ${t.name}`,
      { encoding: "utf8" },
    );
    await target.query(createSql);
    targetTableSet.add(t.name);
  }

  // 2) Add missing columns on shared core tables (never drop CM-only columns)
  for (const table of CORE_TABLES) {
    if (CM_TABLES.has(table)) continue;
    if (!targetTableSet.has(table)) {
      log(`SKIP schema diff (missing in target): ${table}`);
      continue;
    }

    const srcCols = await getColumns(source, SOURCE_DB, table);
    const tgtCols = await getColumns(target, TARGET_DB, table);
    const tgtColSet = new Set(tgtCols.map((c) => c.column_name));

    for (const col of srcCols) {
      if (tgtColSet.has(col.column_name)) continue;
      const sql = buildAddColumnSql(table, col);
      log(`ALTER ${table}: add column ${col.column_name}`);
      try {
        await target.query(sql);
      } catch (e) {
        log(`  WARN: ${e.message}`);
      }
    }
  }

  await source.end();
  await target.end();

  // 3) Data copy for core tables (disable FK checks)
  const dataDir = path.join(__dirname, "_tmp_zevio_data");
  fs.mkdirSync(dataDir, { recursive: true });

  const importOrder = CORE_TABLES.filter((t) => !CM_TABLES.has(t));

  log(`Importing data into ${TARGET_DB} (per-table truncate + reload)...`);
  const target2 = await mysql.createConnection({ ...connOpts, database: TARGET_DB });
  await target2.query("SET FOREIGN_KEY_CHECKS=0");

  for (const table of [...importOrder].reverse()) {
    if (!targetTableSet.has(table)) continue;
    log(`  TRUNCATE ${table}`);
    try {
      await target2.query(`TRUNCATE TABLE \`${table}\``);
    } catch (e) {
      log(`  WARN truncate ${table}: ${e.message}`);
    }
  }

  for (const table of importOrder) {
    if (!targetTableSet.has(table)) continue;
    log(`  DUMP+IMPORT ${table}`);
    try {
      const chunk = execSync(
        `"${MYSQLDUMP}" -h 127.0.0.1 -u root --skip-lock-tables --no-create-info --skip-triggers --compact ${SOURCE_DB} ${table}`,
        { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 },
      );
      if (chunk.trim()) {
        await target2.query(chunk);
      }
    } catch (e) {
      log(`  SKIP ${table}: ${e.message?.split("\n")[0] || e}`);
    }
  }

  await target2.query("SET FOREIGN_KEY_CHECKS=1");
  await target2.end();

  if (fs.existsSync(dataDir)) {
    try {
      fs.rmdirSync(dataDir, { recursive: true });
    } catch {
      /* ignore */
    }
  }

  log("DB sync complete.");
};

main().catch((e) => {
  console.error("DB sync failed:", e);
  process.exit(1);
});
