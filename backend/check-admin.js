import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
});

try {
  const [admins] = await db.query(
    `SELECT id, name, email FROM admins WHERE email = 'admin@zevio.com'`,
  );
  console.log("Admin found:", admins);
  console.log("\nNote: Password hash is stored, not plain text.");
  console.log("Try testing with this credential setup script instead.");
} catch (error) {
  console.error("Error:", error);
} finally {
  await db.end();
}
