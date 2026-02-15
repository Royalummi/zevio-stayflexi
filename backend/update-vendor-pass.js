import mysql from "mysql2/promise";

async function updateVendorPasswords() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "",
      database: "zevio",
    });

    console.log("✅ Connected to database");

    const passwordHash =
      "$2a$10$L.af4iIHa.7gljOwdv/3Q.Pr1qa1rbqyGvwfzUNd/dn.YR1fiLTDW";

    const [result] = await connection.query(
      `UPDATE vendors 
       SET password_hash = ? 
       WHERE email IN ('vendor1@example.com', 'vendor2@example.com', 'vendor3@example.com')`,
      [passwordHash],
    );

    console.log(
      `✅ Updated ${result.affectedRows} vendor passwords to 'password123'`,
    );

    // Verify update
    const [vendors] = await connection.query(
      `SELECT email, name FROM vendors WHERE email IN ('vendor1@example.com', 'vendor2@example.com', 'vendor3@example.com')`,
    );

    console.log("\n📋 Test Vendor Accounts:");
    vendors.forEach((v) => {
      console.log(`   - ${v.email} (${v.name})`);
    });
    console.log("   Password for all: password123\n");

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

updateVendorPasswords();
