import mysql from "mysql2/promise";
import fs from "fs";

(async () => {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "zevio",
  });

  // Run each ALTER separately since they can't be parameterized
  console.log("1. Adding is_gst_registered to vendors...");
  try {
    await conn.query(
      "ALTER TABLE vendors ADD COLUMN is_gst_registered TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Whether vendor is GST registered' AFTER gst_number",
    );
    console.log("   ✅ Column added");
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME")
      console.log("   ⚠️ Column already exists");
    else throw e;
  }

  console.log("2. Setting is_gst_registered=1 for vendors with gst_number...");
  const [upd] = await conn.execute(
    "UPDATE vendors SET is_gst_registered = 1 WHERE gst_number IS NOT NULL AND gst_number != ''",
  );
  console.log(`   ✅ Updated ${upd.affectedRows} vendors`);

  console.log("3. Adding breakdown columns to vendor_settlements...");
  const columns = [
    [
      "booking_base_amount",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'Booking base amount'",
      "booking_id",
    ],
    [
      "booking_gst_amount",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'GST from booking'",
      "booking_base_amount",
    ],
    [
      "booking_service_charge",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'Service charge from booking'",
      "booking_gst_amount",
    ],
    [
      "booking_total_amount",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'Total guest paid'",
      "booking_service_charge",
    ],
    [
      "vendor_gross_amount",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'Vendor gross amount'",
      "booking_total_amount",
    ],
    [
      "platform_fee",
      "DECIMAL(12,2) DEFAULT NULL COMMENT '3% of vendor gross'",
      "vendor_gross_amount",
    ],
    [
      "platform_fee_gst",
      "DECIMAL(12,2) DEFAULT NULL COMMENT '18% GST on platform fee'",
      "platform_fee",
    ],
    [
      "total_deduction",
      "DECIMAL(12,2) DEFAULT NULL COMMENT 'platform_fee + platform_fee_gst'",
      "platform_fee_gst",
    ],
    [
      "is_vendor_gst",
      "TINYINT(1) DEFAULT 0 COMMENT 'Vendor GST status at settlement time'",
      "total_deduction",
    ],
  ];

  for (const [name, def, after] of columns) {
    try {
      await conn.query(
        `ALTER TABLE vendor_settlements ADD COLUMN ${name} ${def} AFTER ${after}`,
      );
      console.log(`   ✅ ${name} added`);
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME")
        console.log(`   ⚠️ ${name} already exists`);
      else throw e;
    }
  }

  // Verify
  const [vendorCols] = await conn.execute(
    "SHOW COLUMNS FROM vendors WHERE Field IN ('is_gst_registered', 'gst_number')",
  );
  console.log(
    "\nVendor GST columns:",
    vendorCols.map((c) => `${c.Field} (${c.Type}, default: ${c.Default})`),
  );

  const [settCols] = await conn.execute("SHOW COLUMNS FROM vendor_settlements");
  console.log(
    "Settlement columns:",
    settCols.map((c) => c.Field),
  );

  await conn.end();
  console.log("\n✅ Migration complete!");
})();
