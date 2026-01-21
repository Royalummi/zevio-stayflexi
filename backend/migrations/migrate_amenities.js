/**
 * Migrate Amenities from JSON column to normalized tables
 * Run after phase2_normalize_amenities.sql
 */

import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
};

async function migrateAmenities() {
  let connection;

  try {
    console.log("🔌 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected!\n");

    // Step 1: Get all amenities from master table
    console.log("📋 Step 1: Fetching amenities from master table...");
    const [amenities] = await connection.execute(
      "SELECT id, name FROM amenities"
    );
    console.log(`✅ Found ${amenities.length} amenities in master table\n`);

    // Create a map for quick lookup
    const amenityMap = {};
    amenities.forEach((amenity) => {
      amenityMap[amenity.name.toLowerCase().trim()] = amenity.id;
      // Also map common variations
      if (amenity.name === "WiFi") {
        amenityMap["wi-fi"] = amenity.id;
        amenityMap["internet"] = amenity.id;
      }
    });

    // Step 2: Get all properties with amenities JSON
    console.log("📋 Step 2: Fetching properties with amenities...");
    const [properties] = await connection.execute(
      "SELECT id, title, amenities FROM properties WHERE deleted_at IS NULL AND amenities IS NOT NULL"
    );
    console.log(`✅ Found ${properties.length} properties with amenities\n`);

    // Step 3: Parse and insert into junction table
    console.log("📋 Step 3: Migrating amenities to junction table...");
    let totalInserted = 0;
    let totalSkipped = 0;

    for (const property of properties) {
      try {
        // Parse JSON amenities
        let amenitiesList = [];

        try {
          amenitiesList = JSON.parse(property.amenities);
        } catch (e) {
          console.warn(
            `⚠️  Could not parse amenities for ${property.title}: ${property.amenities}`
          );
          continue;
        }

        if (!Array.isArray(amenitiesList)) {
          console.warn(`⚠️  Amenities not an array for ${property.title}`);
          continue;
        }

        console.log(`\n   Property: ${property.title}`);
        console.log(`   Amenities: ${amenitiesList.join(", ")}`);

        for (const amenityName of amenitiesList) {
          const normalizedName = amenityName.toLowerCase().trim();
          const amenityId = amenityMap[normalizedName];

          if (!amenityId) {
            console.log(`   ⚠️  Unknown amenity: "${amenityName}" - skipping`);
            totalSkipped++;
            continue;
          }

          // Insert into junction table
          try {
            await connection.execute(
              `INSERT INTO property_amenities (id, property_id, amenity_id) 
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE property_id=property_id`,
              [uuidv4(), property.id, amenityId]
            );
            console.log(`   ✅ Linked: ${amenityName}`);
            totalInserted++;
          } catch (err) {
            if (err.code !== "ER_DUP_ENTRY") {
              console.error(
                `   ❌ Error inserting ${amenityName}:`,
                err.message
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `❌ Error processing property ${property.title}:`,
          error.message
        );
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Total amenity mappings inserted: ${totalInserted}`);
    console.log(`   - Unknown amenities skipped: ${totalSkipped}`);

    // Step 4: Add foreign key constraints
    console.log("\n📋 Step 4: Adding foreign key constraints...");

    try {
      await connection.execute(`
        ALTER TABLE property_amenities
        ADD CONSTRAINT fk_property_amenities_property
          FOREIGN KEY (property_id) REFERENCES properties(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("✅ Added property_amenities → properties FK");
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  FK already exists: property_amenities → properties");
      } else {
        throw err;
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE property_amenities
        ADD CONSTRAINT fk_property_amenities_amenity
          FOREIGN KEY (amenity_id) REFERENCES amenities(id)
          ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("✅ Added property_amenities → amenities FK");
    } catch (err) {
      if (err.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  FK already exists: property_amenities → amenities");
      } else {
        throw err;
      }
    }

    // Step 5: Verify data
    console.log("\n📊 Verification:");
    const [propertiesCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM properties WHERE deleted_at IS NULL"
    );
    const [mappingsCount] = await connection.execute(
      "SELECT COUNT(*) as count FROM property_amenities"
    );
    const [avgCount] = await connection.execute(
      "SELECT AVG(amenity_count) as avg_amenities FROM (SELECT COUNT(*) as amenity_count FROM property_amenities GROUP BY property_id) as counts"
    );

    console.log(`   - Total properties: ${propertiesCount[0].count}`);
    console.log(`   - Total amenity mappings: ${mappingsCount[0].count}`);
    console.log(
      `   - Average amenities per property: ${
        Math.round(avgCount[0].avg_amenities * 10) / 10
      }`
    );

    // Show sample
    console.log("\n📋 Sample properties with amenities:");
    const [sample] = await connection.execute(`
      SELECT 
        p.title,
        COUNT(pa.amenity_id) as amenity_count,
        GROUP_CONCAT(a.name ORDER BY a.display_order SEPARATOR ', ') as amenities
      FROM properties p
      LEFT JOIN property_amenities pa ON p.id = pa.property_id
      LEFT JOIN amenities a ON pa.amenity_id = a.amenity_id
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.title
      LIMIT 5
    `);

    sample.forEach((row) => {
      console.log(`\n   ${row.title}`);
      console.log(
        `   → ${row.amenity_count} amenities: ${row.amenities || "None"}`
      );
    });

    console.log("\n\n🎉 Phase 2 migration completed successfully!");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run migration
migrateAmenities().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
