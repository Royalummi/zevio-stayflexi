// Check and run pending migrations: living_area + apartment_only + amenities reorder
import db from "./src/config/database.js";

try {
  // --- Check living_area ---
  const [laCols] = await db.query("SHOW COLUMNS FROM `properties` LIKE 'living_area'");
  if (laCols.length === 0) {
    await db.query("ALTER TABLE `properties` ADD COLUMN `living_area` INT DEFAULT NULL COMMENT 'Living area in square feet' AFTER `bathrooms`");
    console.log("✅ Added living_area column to properties");
  } else {
    console.log("ℹ️  living_area already exists");
  }

  // --- Check apartment_only ---
  const [aoCols] = await db.query("SHOW COLUMNS FROM `amenities` LIKE 'apartment_only'");
  if (aoCols.length === 0) {
    await db.query("ALTER TABLE `amenities` ADD COLUMN `apartment_only` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'If 1, only show for Service Apartment properties' AFTER `is_active`");
    console.log("✅ Added apartment_only column to amenities");

    // Mark Housekeeping as apartment_only
    const [hk] = await db.query("UPDATE `amenities` SET `apartment_only` = 1 WHERE `name` = 'Housekeeping' AND `category` = 'service'");
    console.log(`✅ Marked Housekeeping as apartment_only (${hk.affectedRows} row(s))`);
  } else {
    console.log("ℹ️  apartment_only already exists");
  }

  // --- Set Kitchen as first in Facilities ---
  const [kRes] = await db.query("UPDATE `amenities` SET `display_order` = 1 WHERE `name` = 'Kitchen' AND `category` = 'facility'");
  console.log(`✅ Kitchen display_order set to 1 (${kRes.affectedRows} row(s))`);

  // --- Insert new amenities if they don't exist ---
  const newAmenities = [
    { name: "Private Pool", category: "facility", icon: "private-pool", display_order: 17 },
    { name: "Jacuzzi",       category: "facility", icon: "jacuzzi",      display_order: 18 },
    { name: "Mountain View", category: "feature",  icon: "mountain",     display_order: 5  },
    { name: "Smoke Alarms",  category: "safety",   icon: "smoke-alarm",  display_order: 16 },
  ];

  for (const amenity of newAmenities) {
    const [exists] = await db.query("SELECT id FROM `amenities` WHERE `name` = ? AND `category` = ?", [amenity.name, amenity.category]);
    if (exists.length === 0) {
      await db.query(
        "INSERT INTO `amenities` (id, name, category, icon, display_order, is_active, apartment_only) VALUES (UUID(), ?, ?, ?, ?, 1, 0)",
        [amenity.name, amenity.category, amenity.icon, amenity.display_order]
      );
      console.log(`✅ Inserted amenity: ${amenity.name}`);
    } else {
      console.log(`ℹ️  Amenity already exists: ${amenity.name}`);
    }
  }

  console.log("\n✅ All pending migrations complete!");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}
