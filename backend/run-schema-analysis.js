import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env") });

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zevio",
  multipleStatements: true,
};

async function runSchemaAnalysis() {
  let connection;

  try {
    console.log("\n=== SESSION 50: Schema Analysis & Fixes ===\n");

    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database:", dbConfig.database);

    // Step 1: Check properties table columns
    console.log("\n--- STEP 1: Properties Table Structure ---");
    const [propertiesColumns] = await connection.query("DESCRIBE properties");
    console.log(`Properties table has ${propertiesColumns.length} columns:`);
    const propertyColumnsNames = propertiesColumns.map((col) => col.Field);
    console.log(propertyColumnsNames.join(", "));

    // Step 2: Check property_pricing table columns
    console.log("\n--- STEP 2: Property Pricing Table Structure ---");
    const [pricingColumns] = await connection.query(
      "DESCRIBE property_pricing",
    );
    console.log(`Property_pricing table has ${pricingColumns.length} columns:`);
    const pricingColumnsNames = pricingColumns.map((col) => col.Field);
    console.log(pricingColumnsNames.join(", "));

    // Step 3: Check property_contacts table
    console.log("\n--- STEP 3: Property Contacts Table Structure ---");
    const [contactsColumns] = await connection.query(
      "DESCRIBE property_contacts",
    );
    console.log(
      `Property_contacts table has ${contactsColumns.length} columns:`,
    );
    const contactsColumnsNames = contactsColumns.map((col) => col.Field);
    console.log(contactsColumnsNames.join(", "));

    // Step 4: Check if property_guidelines table exists
    console.log("\n--- STEP 4: Check Property Guidelines Table ---");
    const [guideTables] = await connection.query(
      "SHOW TABLES LIKE 'property_guidelines'",
    );

    if (guideTables.length === 0) {
      console.log("❌ property_guidelines table does NOT exist");
      console.log("📝 Creating property_guidelines table...");

      const createGuidelinesTable = `
        CREATE TABLE IF NOT EXISTS property_guidelines (
          id CHAR(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL PRIMARY KEY,
          property_id CHAR(36) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
          check_in_guidelines TEXT NULL COMMENT 'Rich text - Check-in process and instructions',
          house_rules_text TEXT NULL COMMENT 'Rich text - Detailed house rules',
          amenities_guide TEXT NULL COMMENT 'Rich text - How to use amenities',
          safety_information TEXT NULL COMMENT 'Rich text - Safety guidelines and emergency procedures',
          local_area_info TEXT NULL COMMENT 'Rich text - Local attractions, restaurants, transport',
          emergency_contacts TEXT NULL COMMENT 'Rich text - Emergency contact information',
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_property_guidelines_property 
            FOREIGN KEY (property_id) 
            REFERENCES properties (id) 
            ON DELETE CASCADE ON UPDATE CASCADE,
          INDEX idx_property_id (property_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Stores rich text guidelines and instructions for each property'
      `;

      await connection.query(createGuidelinesTable);
      console.log("✅ property_guidelines table created successfully!");
    } else {
      console.log("✅ property_guidelines table already exists");
    }

    // Step 5: Verify data integrity
    console.log("\n--- STEP 5: Data Integrity Check ---");

    const [propertyCount] = await connection.query(
      "SELECT COUNT(*) AS total FROM properties WHERE deleted_at IS NULL",
    );
    console.log(`Total active properties: ${propertyCount[0].total}`);

    const [pricingCount] = await connection.query(
      "SELECT COUNT(*) AS total FROM property_pricing",
    );
    console.log(`Total pricing records: ${pricingCount[0].total}`);

    const [contactsCount] = await connection.query(
      "SELECT COUNT(*) AS total FROM property_contacts",
    );
    console.log(`Total contact records: ${contactsCount[0].total}`);

    // Step 6: Schema mismatch analysis
    console.log("\n--- STEP 6: Schema Mismatch Analysis ---");

    const backendAttemptingToInsert = [
      "min_guests",
      "extra_guest_charge",
      "min_children",
      "max_children",
      "extra_child_charge",
      "price_per_night",
      "gst_percentage",
      "primary_incharge_name",
      "primary_incharge_phone",
      "primary_incharge_email",
      "primary_incharge_whatsapp",
      "primary_incharge_alt_contact",
      "secondary_incharge_name",
      "secondary_incharge_phone",
      "secondary_incharge_email",
      "secondary_incharge_whatsapp",
      "secondary_incharge_alt_contact",
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];

    console.log(
      "\n❌ Columns backend tries to INSERT into properties table BUT they DON'T EXIST:",
    );

    const missingInProperties = backendAttemptingToInsert.filter(
      (col) => !propertyColumnsNames.includes(col),
    );

    console.log("\nPRICING FIELDS (belong in property_pricing):");
    const pricingFields = [
      "min_guests",
      "extra_guest_charge",
      "min_children",
      "max_children",
      "extra_child_charge",
      "price_per_night",
      "gst_percentage",
    ];
    pricingFields.forEach((field) => {
      if (missingInProperties.includes(field)) {
        const existsInPricing = pricingColumnsNames.includes(field);
        console.log(
          `  - ${field} ${existsInPricing ? "✅ (exists in property_pricing)" : "❌ (MISSING)"}`,
        );
      }
    });

    console.log("\nCONTACT FIELDS (belong in property_contacts):");
    const contactFields = [
      "primary_incharge_name",
      "primary_incharge_phone",
      "primary_incharge_email",
      "primary_incharge_whatsapp",
      "primary_incharge_alt_contact",
      "secondary_incharge_name",
      "secondary_incharge_phone",
      "secondary_incharge_email",
      "secondary_incharge_whatsapp",
      "secondary_incharge_alt_contact",
    ];
    contactFields.forEach((field) => {
      if (missingInProperties.includes(field)) {
        console.log(`  - ${field} ❌ (should use property_contacts table)`);
      }
    });

    console.log("\nGUIDELINES FIELDS (belong in property_guidelines):");
    const guidelineFields = [
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];
    guidelineFields.forEach((field) => {
      if (missingInProperties.includes(field)) {
        console.log(`  - ${field} ✅ (now have property_guidelines table)`);
      }
    });

    // Step 7: Sample JOIN query
    console.log("\n--- STEP 7: Sample JOIN Query ---");
    const [sampleData] = await connection.query(`
      SELECT 
        p.id,
        p.title,
        p.bedrooms,
        p.bathrooms,
        p.max_guests,
        pp.price_per_night,
        pp.min_guests,
        pp.extra_guest_charge,
        pp.gst_percentage,
        p.status
      FROM properties p
      LEFT JOIN property_pricing pp ON p.id = pp.property_id
      WHERE p.deleted_at IS NULL
      LIMIT 3
    `);

    console.log("\nSample properties with pricing data:");
    sampleData.forEach((prop) => {
      console.log(
        `- ${prop.title}: ₹${prop.price_per_night}/night, ${prop.bedrooms}BHK, ${prop.status}`,
      );
    });

    console.log("\n=== Analysis Complete ===\n");
    console.log("✅ Database schema verified");
    console.log("✅ property_guidelines table created/verified");
    console.log("⚠️  Backend code needs fixes in adminController.js");
    console.log("\n📋 Next Steps:");
    console.log("  1. Remove mismatched columns from properties INSERT query");
    console.log(
      "  2. Add property_contacts INSERT for primary/secondary contacts",
    );
    console.log("  3. Add property_guidelines INSERT for rich text fields");
    console.log("  4. Test property creation with updated backend code\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

runSchemaAnalysis();
