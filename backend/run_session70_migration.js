import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";

async function main() {
  const conn = await createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "zevio",
    multipleStatements: true,
  });

  const sql = readFileSync(
    "./migrations/session70_pricing_features.sql",
    "utf8",
  );

  try {
    await conn.query(sql);
    console.log("✅ Migration executed successfully");

    const [rows] = await conn.query("SHOW TABLES LIKE '%pricing%'");
    console.log(
      'Tables with "pricing":',
      rows.map((r) => Object.values(r)[0]).join(", "),
    );

    const [cols] = await conn.query(
      "SHOW COLUMNS FROM property_pricing LIKE 'discount_%'",
    );
    console.log("New discount columns:", cols.map((c) => c.Field).join(", "));

    const [pols] = await conn.query(
      "SELECT policy_name FROM cancellation_policies",
    );
    console.log("Policies seeded:", pols.map((p) => p.policy_name).join(", "));
  } catch (e) {
    console.error("❌ Migration error:", e.message);
  }

  await conn.end();
}

main().catch(console.error);
