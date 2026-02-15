import db from "./src/config/database.js";

console.log("🔍 Checking property types in database...\n");

try {
  const [propertyTypes] = await db.query(`
    SELECT id, name, slug, stay_type, is_active, sort_order
    FROM property_types
    ORDER BY is_active DESC, sort_order ASC, name ASC
  `);

  console.log("=== ALL PROPERTY TYPES ===");
  console.log(`Total records: ${propertyTypes.length}\n`);

  propertyTypes.forEach((type, index) => {
    console.log(`${index + 1}. ${type.name}`);
    console.log(`   ID: ${type.id}`);
    console.log(`   Slug: ${type.slug}`);
    console.log(`   Stay Type: ${type.stay_type}`);
    console.log(`   Active: ${type.is_active === 1 ? "✅ YES" : "❌ NO"}`);
    console.log(`   Sort Order: ${type.sort_order}`);
    console.log("");
  });

  const activeTypes = propertyTypes.filter((t) => t.is_active === 1);
  console.log(`\n=== ACTIVE PROPERTY TYPES ===`);
  console.log(`Count: ${activeTypes.length}\n`);

  activeTypes.forEach((type, index) => {
    console.log(`${index + 1}. ${type.name} (${type.slug})`);
  });

  if (activeTypes.length !== 2) {
    console.log(
      `\n⚠️  WARNING: Expected 2 active property types, found ${activeTypes.length}`,
    );
  } else {
    console.log(`\n✅ Correct: Found exactly 2 active property types`);
  }

  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  process.exit(1);
}
