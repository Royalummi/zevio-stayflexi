// Direct database query to check property data structure
import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPropertyData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "zevio_villas",
  });

  try {
    log(
      "\n╔════════════════════════════════════════════════════════════╗",
      "bold",
    );
    log(
      "║          PROPERTY DATA STRUCTURE ANALYSIS                  ║",
      "bold",
    );
    log(
      "╚════════════════════════════════════════════════════════════╝",
      "bold",
    );

    // Get first property
    const [properties] = await connection.execute(
      "SELECT * FROM properties LIMIT 1",
    );

    if (properties.length === 0) {
      log("❌ No properties found in database", "red");
      return;
    }

    const property = properties[0];
    log(`\n✅ Found property: ${property.id}`, "green");
    log(`   Title: ${property.title}`, "cyan");
    log(`   Status: ${property.status}`, "cyan");

    // Check photos field
    log("\n════ PHOTOS FIELD ════", "blue");
    log(`photos field type: ${typeof property.photos}`, "cyan");
    log(`photos field value: ${property.photos}`, "cyan");
    log(
      `photos is null: ${property.photos === null}`,
      property.photos === null ? "red" : "green",
    );
    log(`photos length (if string): ${property.photos?.length || 0}`, "cyan");

    if (property.photos) {
      try {
        const parsed = JSON.parse(property.photos);
        log(`✅ Photos parsed successfully`, "green");
        log(
          `   Type: ${Array.isArray(parsed) ? "Array" : typeof parsed}`,
          "cyan",
        );
        log(
          `   Length: ${Array.isArray(parsed) ? parsed.length : "N/A"}`,
          "cyan",
        );
        if (Array.isArray(parsed) && parsed.length > 0) {
          log(`   First photo: ${parsed[0]}`, "cyan");
        } else {
          log(`⚠️  Photos array is empty`, "yellow");
        }
      } catch (e) {
        log(`❌ Failed to parse photos JSON: ${e.message}`, "red");
      }
    } else {
      log(`⚠️  photos field is NULL or empty`, "yellow");
    }

    // Check guidelines fields
    log("\n════ GUIDELINES FIELDS ════", "blue");
    const guidelineFields = [
      "check_in_guidelines",
      "house_rules_text",
      "amenities_guide",
      "safety_information",
      "local_area_info",
      "emergency_contacts",
    ];

    let hasAnyGuideline = false;
    for (const field of guidelineFields) {
      const value = property[field];
      const hasValue =
        value !== null && value !== undefined && value.toString().trim() !== "";
      hasAnyGuideline = hasAnyGuideline || hasValue;

      log(`${field}:`, "cyan");
      log(`  - Is null: ${value === null}`, value === null ? "red" : "green");
      log(`  - Is empty: ${!hasValue}`, !hasValue ? "yellow" : "green");
      log(`  - Length: ${value ? value.toString().length : 0}`, "cyan");
      if (hasValue && value.toString().length < 200) {
        log(`  - Preview: ${value.toString().substring(0, 100)}...`, "cyan");
      }
    }

    if (!hasAnyGuideline) {
      log("\n⚠️  WARNING: NO GUIDELINES FOUND!", "yellow");
      log(
        '   This explains why user reported "guidelines are not displaying"',
        "yellow",
      );
      log("   All guideline fields are NULL or empty in database", "yellow");
    } else {
      log("\n✅ At least one guideline field has content", "green");
    }

    // Check other important fields
    log("\n════ OTHER IMPORTANT FIELDS ════", "blue");
    const checkFields = [
      "amenities",
      "house_rules",
      "cancellation_policy",
      "description",
      "address",
    ];
    for (const field of checkFields) {
      const value = property[field];
      log(
        `${field}: ${value === null ? "NULL" : value === "" ? "EMPTY" : `${value.toString().length} chars`}`,
        value === null || value === "" ? "yellow" : "green",
      );
    }

    // Detailed field list
    log("\n════ ALL PROPERTY FIELDS ════", "blue");
    const fields = Object.keys(property);
    log(`Total fields: ${fields.length}`, "cyan");
    fields.forEach((field) => {
      const value = property[field];
      const status =
        value === null
          ? "❌ NULL"
          : value === ""
            ? "⚠️  EMPTY"
            : "✅ HAS VALUE";
      console.log(`  ${status} ${field}`);
    });

    // Check recommendations
    log("\n════ RECOMMENDATIONS ════", "blue");

    if (
      !property.photos ||
      (typeof property.photos === "string" &&
        JSON.parse(property.photos).length === 0)
    ) {
      log("🔧 FIX NEEDED: Add photos to property", "yellow");
      log(
        "   Photos field is empty - PropertyImageUpload will show empty state",
        "yellow",
      );
    }

    if (!hasAnyGuideline) {
      log("🔧 FIX NEEDED: Add guidelines to property", "yellow");
      log(
        "   All guideline rich text editors will be empty in edit mode",
        "yellow",
      );
      log("   Run: UPDATE properties SET", "cyan");
      log('        check_in_guidelines = "<p>Check-in at 2PM...</p>",', "cyan");
      log('        house_rules_text = "<p>No smoking...</p>"', "cyan");
      log(`        WHERE id = "${property.id}";`, "cyan");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
    console.error(error);
  } finally {
    await connection.end();
  }
}

checkPropertyData();
