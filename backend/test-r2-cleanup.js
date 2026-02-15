#!/usr/bin/env node

/**
 * SESSION 56.7 - Test R2 Image Cleanup
 *
 * This script verifies that old R2 images are deleted when uploading new ones
 */

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:5000/api";

// Replace with your actual admin token
const ADMIN_TOKEN = "YOUR_ADMIN_TOKEN_HERE";

// Replace with an actual property ID
const PROPERTY_ID = "YOUR_PROPERTY_ID_HERE";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
  },
});

async function testR2Cleanup() {
  console.log("🧪 SESSION 56.7 - R2 Image Cleanup Test\n");

  try {
    // Step 1: Get current images
    console.log("📸 Step 1: Fetching current images...");
    const { data: currentImages } = await api.get(
      `/admin/properties/${PROPERTY_ID}/images`,
    );
    console.log(`✅ Current images: ${currentImages.data.length}`);
    if (currentImages.data.length > 0) {
      console.log("   Sample image:", currentImages.data[0].image_url);
    }
    console.log("");

    // Step 2: Create test images (1x1 pixel PNGs)
    console.log("🎨 Step 2: Creating test images...");
    const testImages = [];
    for (let i = 1; i <= 3; i++) {
      const testImagePath = path.join(process.cwd(), `test-image-${i}.png`);

      // Create minimal 1x1 PNG (71 bytes)
      const pngData = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x62, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      fs.writeFileSync(testImagePath, pngData);
      testImages.push(testImagePath);
      console.log(`   ✅ Created: test-image-${i}.png`);
    }
    console.log("");

    // Step 3: Upload new images
    console.log("📤 Step 3: Uploading new images...");
    const formData = new FormData();
    testImages.forEach((imagePath) => {
      formData.append("files", fs.createReadStream(imagePath));
    });

    const uploadResponse = await api.put(
      `/admin/properties/${PROPERTY_ID}/images`,
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    console.log(
      `✅ Upload successful: ${uploadResponse.data.data.length} images`,
    );
    console.log("");

    // Step 4: Verify old images deleted
    console.log("🔍 Step 4: Verifying old images were deleted...");
    const { data: newImages } = await api.get(
      `/admin/properties/${PROPERTY_ID}/images`,
    );
    console.log(`✅ Current images after upload: ${newImages.data.length}`);

    if (newImages.data.length === 3) {
      console.log("✅ SUCCESS! Only 3 images present (old ones deleted)");
    } else {
      console.log(
        `⚠️  WARNING: Expected 3 images, got ${newImages.data.length}`,
      );
    }
    console.log("");

    // Step 5: Check backend logs
    console.log("📋 Step 5: Check backend logs for:");
    console.log("   🗑️ Deleting old R2 images to prevent duplicates...");
    console.log("   ✅ Deleted X/Y old R2 images");
    console.log("   🔄 Action: REPLACED old images with new ones");
    console.log("");

    // Step 6: Cleanup test files
    console.log("🧹 Step 6: Cleaning up test files...");
    testImages.forEach((imagePath) => {
      fs.unlinkSync(imagePath);
      console.log(`   ✅ Deleted: ${path.basename(imagePath)}`);
    });
    console.log("");

    console.log("✅ TEST COMPLETE!");
    console.log("");
    console.log("📝 VERIFICATION CHECKLIST:");
    console.log('   [ ] Backend logs show "🗑️ Deleting old R2 images"');
    console.log('   [ ] Backend logs show "✅ Deleted X/Y old R2 images"');
    console.log("   [ ] Only 3 images in database");
    console.log("   [ ] Cloudflare dashboard shows only new images");
  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    if (error.response) {
      console.error("   Response:", error.response.data);
    }
  }
}

// Instructions
console.log("⚠️  SETUP REQUIRED:");
console.log("1. Edit this file and set:");
console.log("   - ADMIN_TOKEN (get from browser localStorage)");
console.log("   - PROPERTY_ID (any property with images)");
console.log("2. Run: node test-r2-cleanup.js");
console.log("3. Check backend logs during test");
console.log("4. Verify Cloudflare R2 dashboard");
console.log("");

if (
  ADMIN_TOKEN === "YOUR_ADMIN_TOKEN_HERE" ||
  PROPERTY_ID === "YOUR_PROPERTY_ID_HERE"
) {
  console.log("❌ Please set ADMIN_TOKEN and PROPERTY_ID in the script");
  process.exit(1);
}

testR2Cleanup();
