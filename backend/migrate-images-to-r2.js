/**
 * Migration Script: Local Storage → Cloudflare R2
 *
 * This script migrates existing images from backend/uploads/ to Cloudflare R2
 * and updates the database with new R2 URLs.
 *
 * Usage: node migrate-images-to-r2.js
 *
 * IMPORTANT:
 * 1. Configure R2 credentials in .env first
 * 2. Backup your database before running
 * 3. Test with a few properties first (set TEST_MODE = true)
 */

import db from "./src/config/database.js";
import { migrateLocalToR2 } from "./src/utils/r2Storage.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const TEST_MODE = true; // Set to false for full migration
const MAX_PROPERTIES = TEST_MODE ? 5 : 9999; // Limit for testing

console.log("🚀 Starting Image Migration to Cloudflare R2...\n");
console.log(
  `Mode: ${TEST_MODE ? "🧪 TEST (first 5 properties)" : "🔥 FULL MIGRATION"}\n`,
);

async function migrateImages() {
  const stats = {
    propertiesProcessed: 0,
    imagesProcessed: 0,
    imagesMigrated: 0,
    imagesFailed: 0,
    errors: [],
  };

  try {
    // Get all properties with photos
    const [properties] = await db.query(
      `SELECT id, name, photos 
       FROM properties 
       WHERE deleted_at IS NULL 
       AND photos IS NOT NULL 
       AND photos != '[]' 
       LIMIT ?`,
      [MAX_PROPERTIES],
    );

    console.log(`📊 Found ${properties.length} properties with images\n`);

    for (const property of properties) {
      console.log(`\n🏠 Processing: ${property.name} (ID: ${property.id})`);
      stats.propertiesProcessed++;

      try {
        // Parse photos
        const photos = JSON.parse(property.photos);
        if (!Array.isArray(photos) || photos.length === 0) {
          console.log("  ⏭️  No photos to migrate");
          continue;
        }

        console.log(`  📸 Found ${photos.length} images`);
        stats.imagesProcessed += photos.length;

        const migratedUrls = [];

        for (const photoUrl of photos) {
          // Skip if already migrated (absolute URL)
          if (
            photoUrl.startsWith("http://") ||
            photoUrl.startsWith("https://")
          ) {
            console.log(
              `  ✅ Already migrated: ${photoUrl.substring(0, 50)}...`,
            );
            migratedUrls.push(photoUrl);
            continue;
          }

          // Skip if not a local upload path
          if (!photoUrl.startsWith("/uploads/")) {
            console.log(`  ⚠️  Skipping non-upload path: ${photoUrl}`);
            migratedUrls.push(photoUrl);
            continue;
          }

          try {
            // Construct local file path
            const localPath = path.join(__dirname, photoUrl.replace(/^\//, ""));

            // Check if file exists
            try {
              await fs.access(localPath);
            } catch {
              console.log(`  ❌ File not found: ${photoUrl}`);
              stats.imagesFailed++;
              stats.errors.push({
                property: property.id,
                error: "File not found",
                path: photoUrl,
              });
              continue;
            }

            // Migrate to R2
            console.log(`  ☁️  Migrating: ${path.basename(localPath)}`);
            const r2Url = await migrateLocalToR2(localPath, "properties");
            migratedUrls.push(r2Url);
            stats.imagesMigrated++;
            console.log(`  ✅ Migrated: ${r2Url.substring(0, 60)}...`);
          } catch (error) {
            console.log(`  ❌ Migration failed: ${error.message}`);
            stats.imagesFailed++;
            stats.errors.push({
              property: property.id,
              error: error.message,
              path: photoUrl,
            });
            // Keep original URL if migration fails
            migratedUrls.push(photoUrl);
          }
        }

        // Update database with new URLs
        if (migratedUrls.length > 0) {
          await db.query("UPDATE properties SET photos = ? WHERE id = ?", [
            JSON.stringify(migratedUrls),
            property.id,
          ]);
          console.log(`  💾 Database updated with ${migratedUrls.length} URLs`);
        }
      } catch (error) {
        console.error(
          `  ❌ Error processing property ${property.id}:`,
          error.message,
        );
        stats.errors.push({ property: property.id, error: error.message });
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Migration Summary\n");
    console.log(`Properties processed: ${stats.propertiesProcessed}`);
    console.log(`Images found: ${stats.imagesProcessed}`);
    console.log(`✅ Successfully migrated: ${stats.imagesMigrated}`);
    console.log(`❌ Failed: ${stats.imagesFailed}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors (${stats.errors.length}):`);
      stats.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. Property ${err.property}: ${err.error}`);
        if (err.path) console.log(`     Path: ${err.path}`);
      });
    }

    if (TEST_MODE) {
      console.log("\n🧪 TEST MODE - Only first 5 properties processed");
      console.log("   Set TEST_MODE = false to migrate all images");
    }

    console.log("\n✅ Migration complete!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await db.end();
  }
}

// Run migration
migrateImages().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
