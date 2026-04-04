import db from "./src/config/database.js";

async function run() {
  console.log("=== Removing employee tables and references ===\n");

  // 1. Drop child tables first
  for (const table of ["employee_claims", "employee_points"]) {
    try {
      await db.query(`DROP TABLE IF EXISTS ${table}`);
      console.log(`Dropped table: ${table}`);
    } catch (e) {
      console.log(`${table}: ${e.message}`);
    }
  }

  // 2. Drop employee_id FK from properties
  try {
    const [fks] = await db.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' 
       AND COLUMN_NAME = 'employee_id' AND REFERENCED_TABLE_NAME IS NOT NULL`,
    );
    for (const fk of fks) {
      await db.query(
        `ALTER TABLE properties DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`,
      );
      console.log(`Dropped FK: ${fk.CONSTRAINT_NAME}`);
    }
  } catch (e) {
    console.log(`FK drop: ${e.message}`);
  }

  // 3. Drop employee_id column from properties
  try {
    const [cols] = await db.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'employee_id'`,
    );
    if (cols.length > 0) {
      await db.query("ALTER TABLE properties DROP COLUMN employee_id");
      console.log("Dropped column: properties.employee_id");
    } else {
      console.log("Column properties.employee_id already gone");
    }
  } catch (e) {
    console.log(`Column drop: ${e.message}`);
  }

  // 4. Drop employees table (parent - must be after FKs removed)
  try {
    await db.query("DROP TABLE IF EXISTS employees");
    console.log("Dropped table: employees");
  } catch (e) {
    console.log(`employees table: ${e.message}`);
  }

  // 5. Clean notifications and activity logs
  try {
    const [r1] = await db.query(
      "DELETE FROM notifications WHERE recipient_role = 'employee'",
    );
    console.log(`Deleted ${r1.affectedRows} employee notifications`);
  } catch (e) {
    console.log(`notif: ${e.message}`);
  }

  try {
    const [r2] = await db.query(
      "DELETE FROM activity_logs WHERE actor_role = 'employee'",
    );
    console.log(`Deleted ${r2.affectedRows} employee activity logs`);
  } catch (e) {
    console.log(`actlog: ${e.message}`);
  }

  // 6. Verify
  const [tables] = await db.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'employee%'",
  );
  console.log(
    "\nRemaining employee tables:",
    tables.length === 0 ? "NONE (clean)" : tables,
  );

  const [empCol] = await db.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'employee_id'",
  );
  console.log(
    "properties.employee_id:",
    empCol.length === 0 ? "REMOVED" : "STILL EXISTS",
  );

  console.log("\n=== DB cleanup complete ===");
  process.exit(0);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
