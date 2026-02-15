import mysql from "mysql2/promise";

async function testChangeRequestWorkflow() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "zevio",
  });

  try {
    // 1. Get test property
    console.log("🔍 Step 1: Finding test property...");
    const [properties] = await connection.query(`
      SELECT id, title, status
      FROM properties
      WHERE title LIKE '%Test Villa%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (properties.length === 0) {
      console.log("❌ No test property found");
      return;
    }

    const testProperty = properties[0];
    console.log(`✅ Found: ${testProperty.title}`);
    console.log(`   ID: ${testProperty.id}`);
    console.log(`   Status: ${testProperty.status}`);

    // 2. Approve the property (simulate admin action)
    console.log("\n👨‍💼 Step 2: Simulating admin approval...");
    await connection.query(
      `
      UPDATE properties
      SET status = 'approved'
      WHERE id = ?
    `,
      [testProperty.id],
    );
    console.log("✅ Property approved");

    // 3. Now make change using vendor auth (would be API call in real scenario)
    console.log("\n   Now vendor can update it - would create change request");
    console.log("   (This requires API call with vendor token)");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await connection.end();
  }
}

testChangeRequestWorkflow();
