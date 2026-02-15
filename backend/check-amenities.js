import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
});

try {
  const [amenities] = await db.query(`SELECT id, name FROM amenities LIMIT 10`);
  console.log("\n📋 Available Amenities:\n");
  amenities.forEach((a) => {
    console.log(`  ${a.id} - ${a.name}`);
  });
} catch (error) {
  console.error("Error:", error);
} finally {
  await db.end();
}
