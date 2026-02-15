import mysql from "mysql2/promise";

async function cleanupTestProperty() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "zevio",
  });

  try {
    // Find test property
    const [properties] = await connection.query(`
      SELECT id, title
      FROM properties
      WHERE title LIKE '%Test Villa%'
      ORDER BY created_at DESC
    `);

    if (properties.length === 0) {
      console.log("No test properties found");
      return;
    }

    console.log(`Found ${properties.length} test properties:`);

    for (const property of properties) {
      console.log(`\nCleaning up: ${property.title} (${property.id})`);

      // Delete related records
      await connection.query(
        "DELETE FROM property_amenities WHERE property_id = ?",
        [property.id],
      );
      console.log("  ✅ Deleted amenities");

      await connection.query(
        "DELETE FROM property_pricing WHERE property_id = ?",
        [property.id],
      );
      console.log("  ✅ Deleted pricing");

      await connection.query(
        "DELETE FROM property_contacts WHERE property_id = ?",
        [property.id],
      );
      console.log("  ✅ Deleted contacts");

      await connection.query(
        "DELETE FROM property_change_requests WHERE property_id = ?",
        [property.id],
      );
      console.log("  ✅ Deleted change requests");

      await connection.query("DELETE FROM properties WHERE id = ?", [
        property.id,
      ]);
      console.log("  ✅ Deleted property");
    }

    console.log(
      `\n✅ Cleanup complete! Removed ${properties.length} test properties`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await connection.end();
  }
}

cleanupTestProperty();
