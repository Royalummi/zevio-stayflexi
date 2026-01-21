import mysql from "mysql2/promise";

async function checkProperties() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "zevio",
  });

  try {
    const [rows] = await connection.query(`
      SELECT p.id, p.title, p.property_type_id, p.status,
             pr.price_per_night, pr.gst_percentage
      FROM properties p
      LEFT JOIN property_pricing pr ON p.id = pr.property_id
      WHERE p.property_type_id = 'pt-002' 
      LIMIT 10
    `);

    console.log("=== Service Apartments with Pricing ===");
    console.log(JSON.stringify(rows, null, 2));
    console.log("\nTotal found:", rows.length);

    // Check for missing pricing
    const missingPricing = rows.filter((r) => !r.price_per_night);
    if (missingPricing.length > 0) {
      console.log("\n⚠️  Properties missing pricing data:");
      missingPricing.forEach((p) => console.log(`  - ${p.id}: ${p.title}`));
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

checkProperties();
