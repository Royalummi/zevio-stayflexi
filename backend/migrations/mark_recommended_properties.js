import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio",
  multipleStatements: true,
};

async function markRecommendedProperties() {
  let connection;

  try {
    console.log("\n🔄 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log(`✅ Connected to database: ${dbConfig.database}\n`);

    // Read the SQL file
    const sqlPath = join(__dirname, "mark_recommended_properties.sql");
    const sqlContent = await fs.readFile(sqlPath, "utf8");

    console.log("📝 Marking 8 properties as recommended...\n");
    console.log("   4 Villas (pt-001):");
    console.log("   - Luxury Beach Villa - Goa (Priority 4)");
    console.log("   - Cozy Cottage - North Goa (Priority 3)");
    console.log("   - Premium Villa with Pool - Candolim (Priority 2)");
    console.log("   - Hill View Villa - Lonavala (Priority 1)\n");

    console.log("   4 Service Apartments (pt-002):");
    console.log(
      "   - Modern 2BHK Service Apartment - Koramangala (Priority 4)",
    );
    console.log("   - Luxury 3BHK Service Apartment - Whitefield (Priority 3)");
    console.log(
      "   - Compact 1BHK Service Apartment - Andheri East (Priority 2)",
    );
    console.log("   - Premium 2BHK Service Apartment - BKC (Priority 1)\n");

    // Execute the SQL
    const [results] = await connection.query(sqlContent);

    // The last result set is the SELECT query showing marked properties
    const verificationResults = results[results.length - 1];

    console.log("✅ Properties marked successfully!\n");
    console.log("📊 VERIFICATION RESULTS:\n");
    console.log("─".repeat(100));
    console.log(
      "Title".padEnd(50),
      "| Type".padEnd(20),
      "| Priority | Recommended By",
    );
    console.log("─".repeat(100));

    verificationResults.forEach((row) => {
      console.log(
        row.title.padEnd(50),
        `| ${row.property_type}`.padEnd(20),
        `| ${row.recommended_priority}`.padEnd(10),
        `| ${row.recommended_by_name || "N/A"}`,
      );
    });

    console.log("─".repeat(100));
    console.log(
      `\n✅ Total ${verificationResults.length} properties marked as recommended`,
    );
    console.log(
      `   - ${verificationResults.filter((r) => r.property_type === "Villa").length} Villas`,
    );
    console.log(
      `   - ${verificationResults.filter((r) => r.property_type === "Service Apartment").length} Service Apartments`,
    );

    console.log("\n🎉 Database update completed successfully!");
    console.log("\n📍 NEXT STEPS:");
    console.log("   1. Restart backend: npm run dev");
    console.log("   2. Restart frontend: cd ../nextjs && npm run dev");
    console.log('   3. Visit homepage to see "Recommended for You" section\n');
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed\n");
    }
  }
}

markRecommendedProperties();
