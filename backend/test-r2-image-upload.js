/**
 * Test R2 with Real Image Upload (like property images)
 */

import dotenv from "dotenv";
import { uploadToR2 } from "./src/utils/r2Storage.js";
import sharp from "sharp";

dotenv.config();

console.log("🧪 Testing R2 Image Upload (Real Scenario)\n");
console.log("=".repeat(60));

async function testImageUpload() {
  try {
    console.log("\n1️⃣  Creating test image with sharp...");

    // Create a simple test image (100x100 red square)
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    console.log(
      "   ✅ Test image created:",
      (testImage.length / 1024).toFixed(2),
      "KB",
    );

    console.log("\n2️⃣  Uploading to R2 with optimization...");
    const imageUrl = await uploadToR2(
      testImage,
      "test",
      "image-upload-test.webp",
    );

    console.log("   ✅ UPLOAD SUCCESSFUL!");
    console.log("   📸 Image URL:", imageUrl);
    console.log("\n✅ R2 Image Upload is WORKING!");
    console.log("   Your property images will upload to R2 successfully.");
    console.log("\n   👉 Open this URL to view the test image:");
    console.log("   ", imageUrl);
  } catch (error) {
    console.log("   ❌ Upload failed:", error.message);
    console.log("   Error details:", error);
  }
}

testImageUpload();
