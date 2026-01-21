import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio",
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+05:30",
  connectTimeout: 10000,
  multipleStatements: false,
  charset: "utf8mb4",
});

// Test database connection
export const testConnection = async () => {
  try {
    console.log("🔍 Attempting database connection...");
    console.log(`   Host: ${process.env.DB_HOST || "127.0.0.1"}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME || "zevio"}`);
    console.log(`   User: ${process.env.DB_USER || "root"}`);

    const connection = await pool.getConnection();
    await connection.ping(); // Verify connection is alive
    console.log("✅ Database connected successfully");

    // Test query
    const [rows] = await connection.query("SELECT 1 + 1 AS result");
    console.log(
      `✅ Database query test successful: ${
        rows[0].result === 2 ? "PASS" : "FAIL"
      }`
    );

    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("\n🔧 Troubleshooting tips:");
    console.error(
      "   1. Make sure XAMPP MySQL is running (green in control panel)"
    );
    console.error(
      "   2. Check XAMPP MySQL port in Control Panel > Config > my.ini"
    );
    console.error("   3. Verify database 'zevio' exists in phpMyAdmin");
    console.error("   4. Try stopping other MySQL services (MySQL80)");
    console.error("   5. Restart XAMPP MySQL service");
    console.error(
      `   6. Check MySQL error log: C:\\xampp\\mysql\\data\\mysql_error.log\n`
    );

    if (error.code === "ETIMEDOUT") {
      console.error("⚠️  CONNECTION TIMEOUT: MySQL is not responding");
      console.error("   - MySQL service might be stopped");
      console.error("   - Firewall might be blocking connection");
      console.error("   - Wrong port number configured\n");
    } else if (error.code === "ECONNREFUSED") {
      console.error(
        "⚠️  CONNECTION REFUSED: MySQL is not listening on this port"
      );
      console.error("   - Check if MySQL is running on the specified port");
      console.error("   - Try a different port (common: 3306, 3307)\n");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("⚠️  ACCESS DENIED: Wrong username or password\n");
    }

    return false;
  }
};

export default pool;
