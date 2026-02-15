import db from "./src/config/database.js";

const propertyId = "bb9739d5-e418-11f0-9f30-00410e2b5e6e";

async function cleanGhostImage() {
  try {
    console.log("🔍 Checking property photos...");

    // Check current photos
    const [rows] = await db.query(
      "SELECT id, title, photos FROM properties WHERE id = ?",
      [propertyId],
    );

    if (rows.length === 0) {
      console.log("❌ Property not found");
      return;
    }

    const property = rows[0];
    console.log("\n📦 Current data:");
    console.log("   Property:", property.title);
    console.log("   Photos column:", property.photos);
    console.log("   Type:", typeof property.photos);

    // Clear the photos column
    console.log("\n🧹 Clearing photos column...");
    const [result] = await db.query(
      "UPDATE properties SET photos = NULL WHERE id = ?",
      [propertyId],
    );

    console.log("✅ Cleaned:", result.affectedRows, "row(s)");
    console.log("🎯 Property is now ready for fresh image uploads");

    // Verify
    const [verify] = await db.query(
      "SELECT id, title, photos FROM properties WHERE id = ?",
      [propertyId],
    );

    console.log("\n✓ Verification:");
    console.log("   Photos column:", verify[0].photos);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

cleanGhostImage();
