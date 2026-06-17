/**
 * Import rows from zevio -> zevio_stayflexi using only columns present in BOTH tables.
 * Used when target has extra CM columns (bookings, property_blackout_dates).
 */
import mysql from "mysql2/promise";

const SOURCE_DB = "zevio";
const TARGET_DB = "zevio_stayflexi";

const TABLES = ["bookings", "property_blackout_dates"];

const connOpts = { host: "127.0.0.1", user: "root", password: "" };

const getColumns = async (conn, db, table) => {
  const [rows] = await conn.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ?
     ORDER BY ordinal_position`,
    [db, table],
  );
  return rows.map((r) => r.column_name);
};

for (const table of TABLES) {
  const source = await mysql.createConnection({ ...connOpts, database: SOURCE_DB });
  const target = await mysql.createConnection({ ...connOpts, database: TARGET_DB });

  const srcCols = await getColumns(source, SOURCE_DB, table);
  const tgtCols = await getColumns(target, TARGET_DB, table);
  const common = srcCols.filter((c) => tgtCols.includes(c));
  if (common.length === 0) {
    console.log(`SKIP ${table}: no common columns`);
    await source.end();
    await target.end();
    continue;
  }

  const colList = common.map((c) => `\`${c}\``).join(", ");
  const [rows] = await source.query(`SELECT ${colList} FROM \`${table}\``);

  await target.query("SET FOREIGN_KEY_CHECKS=0");
  await target.query(`TRUNCATE TABLE \`${table}\``);

  if (rows.length > 0) {
    const placeholders = common.map(() => "?").join(", ");
    const sql = `INSERT INTO \`${table}\` (${colList}) VALUES (${placeholders})`;
    for (const row of rows) {
      const vals = common.map((c) => row[c]);
      await target.query(sql, vals);
    }
  }

  await target.query("SET FOREIGN_KEY_CHECKS=1");
  console.log(`OK ${table}: imported ${rows.length} rows (${common.length} common columns)`);

  await source.end();
  await target.end();
}
