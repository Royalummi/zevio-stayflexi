import mysql from "mysql2/promise";

async function debugTestProperty() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "zevio",
  });

  try {
    // Get the most recent test property
    const [properties] = await connection.query(`
      SELECT id, title, status, city_id, property_type_id, created_at
      FROM properties
      WHERE title LIKE '%Test Villa%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (properties.length === 0) {
      console.log("❌ No test property found");
      return;
    }

    const property = properties[0];
    console.log("\n📋 TEST PROPERTY:");
    console.log(JSON.stringify(property, null, 2));

    // Check pricing
    const [pricing] = await connection.query(
      `
      SELECT * FROM property_pricing WHERE property_id = ?
    `,
      [property.id],
    );

    console.log("\n💰 PRICING DATA:");
    if (pricing.length > 0) {
      console.log("✅ Pricing exists:");
      console.log(JSON.stringify(pricing[0], null, 2));
    } else {
      console.log("❌ NO PRICING DATA FOUND!");
    }

    // Check amenities
    const [amenities] = await connection.query(
      `
      SELECT pa.id, a.name
      FROM property_amenities pa
      JOIN amenities a ON pa.amenity_id = a.id
      WHERE pa.property_id = ?
    `,
      [property.id],
    );

    console.log("\n🏷️  AMENITIES:");
    if (amenities.length > 0) {
      console.log(`✅ ${amenities.length} amenities:`);
      amenities.forEach((a) => console.log(`  - ${a.name}`));
    } else {
      console.log("ℹ️  No amenities yet");
    }

    // Check any errors that might prevent submission
    console.log("\n🔍 SUBMISSION REQUIREMENTS:");
    console.log("  city_id:", property.city_id ? "✅" : "❌ MISSING");
    console.log(
      "  property_type_id:",
      property.property_type_id ? "✅" : "❌ MISSING",
    );
    console.log("  pricing:", pricing.length > 0 ? "✅" : "❌ MISSING");
    console.log("  status:", property.status);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await connection.end();
  }
}

debugTestProperty();
