// Run vendor_terms_conditions migration
import db from "./src/config/database.js";

try {
  await db.query(`
    CREATE TABLE IF NOT EXISTS \`vendor_terms_conditions\` (
      \`id\` INT NOT NULL AUTO_INCREMENT,
      \`content\` LONGTEXT NOT NULL,
      \`version\` INT NOT NULL DEFAULT 1,
      \`updated_by\` CHAR(36) DEFAULT NULL COMMENT 'Admin user ID who last updated',
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("✅ vendor_terms_conditions table created (or already exists)");

  const [rows] = await db.query("SELECT COUNT(*) as cnt FROM vendor_terms_conditions");
  if (rows[0].cnt === 0) {
    const defaultContent = `<h2>Vendor Terms and Conditions</h2>
<p>By listing your property on Zevio and clicking "Submit for Approval", you agree to the following terms and conditions. Please read them carefully before proceeding.</p>
<h3>1. Property Listing</h3>
<p>You agree to provide accurate, complete, and up-to-date information about your property, including descriptions, photos, pricing, and availability.</p>
<h3>2. Commission and Payments</h3>
<p>Zevio charges a platform commission on each confirmed booking. Settlement will be processed within the agreed timeline after guest check-out, minus applicable deductions.</p>
<h3>3. Cancellation Policy</h3>
<p>You must honour the cancellation policy associated with your property type. Frequent cancellations may result in suspension or removal of your listing.</p>
<h3>4. Property Standards</h3>
<p>Your property must meet Zevio's quality and safety standards. Zevio reserves the right to remove listings that do not comply with these standards.</p>
<h3>5. Guest Conduct</h3>
<p>You agree to treat all guests with respect and professionalism. Any discrimination or misconduct may result in immediate account suspension.</p>
<h3>6. Legal Compliance</h3>
<p>You are solely responsible for ensuring your property listing complies with all applicable local laws, regulations, and licensing requirements.</p>
<h3>7. Amendments</h3>
<p>Zevio reserves the right to update these Terms and Conditions at any time. Continued use of the platform constitutes acceptance of the revised terms.</p>`;

    await db.query(
      "INSERT INTO vendor_terms_conditions (content, version) VALUES (?, 1)",
      [defaultContent]
    );
    console.log("✅ Default T&C content inserted");
  } else {
    console.log("ℹ️  T&C content already present, skipping insert");
  }

  console.log("\n✅ Migration complete!");
  process.exit(0);
} catch (err) {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
}
