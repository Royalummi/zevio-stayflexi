// Check which columns exist in reviews table
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function checkColumns() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "zevio",
    });

    console.log("✅ Connected to database\n");

    const [columns] = await connection.query("DESCRIBE reviews");

    console.log("📊 Current reviews table structure:");
    console.log("=====================================");
    columns.forEach((col) => {
      console.log(
        `${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Null} ${col.Key} ${col.Default || "NULL"}`,
      );
    });

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

checkColumns();
