/**
 * Test R2 Configuration
 * Quick script to verify Cloudflare R2 is properly configured
 *
 * Usage: node test-r2-config.js
 */

import dotenv from "dotenv";
import { isR2Configured, uploadToR2 } from "./src/utils/r2Storage.js";
import fs from "fs/promises";
import path from "path";

dotenv.config();

console.log("🧪 Testing Cloudflare R2 Configuration\n");
console.log("=".repeat(60));

// Check environment variables
console.log("\n1️⃣  Checking Environment Variables:");
console.log(
  "   R2_ENDPOINT:",
  process.env.R2_ENDPOINT ? "✅ Set" : "❌ Missing",
);
console.log(
  "   R2_ACCESS_KEY_ID:",
  process.env.R2_ACCESS_KEY_ID ? "✅ Set" : "❌ Missing",
);
console.log(
  "   R2_SECRET_ACCESS_KEY:",
  process.env.R2_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Missing",
);
console.log(
  "   R2_BUCKET_NAME:",
  process.env.R2_BUCKET_NAME ? "✅ Set" : "❌ Missing",
);
console.log(
  "   R2_PUBLIC_URL:",
  process.env.R2_PUBLIC_URL ? "✅ Set" : "❌ Missing",
);

// Check if R2 is configured
const configured = isR2Configured();
console.log("\n2️⃣  R2 Configuration Status:");
console.log(
  "   ",
  configured ? "✅ R2 is CONFIGURED" : "❌ R2 is NOT configured",
);

if (!configured) {
  console.log("\n⚠️  R2 is not configured. Follow these steps:");
  console.log("   1. Create R2 bucket at: https://dash.cloudflare.com");
  console.log("   2. Generate API credentials");
  console.log("   3. Update backend/.env with R2 configuration");
  console.log("   4. Refer to R2_SETUP_GUIDE.md for detailed instructions");
  console.log(
    "\n   Backend will use local storage fallback until R2 is configured.",
  );
  process.exit(0);
}

// Test upload (optional - creates test file)
console.log("\n3️⃣  Testing R2 Upload:");
console.log("   Creating test image...");

async function testUpload() {
  try {
    // Create a simple test buffer (red 100x100 pixel image)
    const testImageBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC",
      "base64",
    );

    console.log("   Uploading test image to R2...");
    const testUrl = await uploadToR2(
      testImageBuffer,
      "test",
      "config-test.webp",
      {
        maxWidth: 100,
        maxHeight: 100,
        quality: 85,
      },
    );

    console.log("   ✅ Upload successful!");
    console.log("   📸 Test image URL:", testUrl);
    console.log("\n   👉 Open this URL in browser to verify:");
    console.log("   ", testUrl);

    console.log("\n✅ R2 Configuration Test PASSED!");
    console.log("   Your backend is ready to use Cloudflare R2.");
    console.log(
      "   Images will now be uploaded to R2 instead of local storage.",
    );
  } catch (error) {
    console.log("   ❌ Upload failed:", error.message);
    console.log("\n⚠️  Possible issues:");
    console.log("   • Check API credentials are correct");
    console.log("   • Verify bucket name matches exactly");
    console.log("   • Ensure API token has Write permissions");
    console.log("   • Check internet connection");
    console.log("\n   Refer to R2_SETUP_GUIDE.md for troubleshooting.");
  }
}

testUpload().catch(console.error);
