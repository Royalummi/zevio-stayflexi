/**
 * Test R2 CORS Configuration
 *
 * This script tests if CORS is properly configured on your R2 bucket.
 * Run this after configuring CORS in Cloudflare dashboard.
 *
 * Node.js v18+ has native fetch API
 */

const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL ||
  "https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev";

// Test image URL (the one from your upload)
const TEST_IMAGE_URL =
  "https://pub-6c324d7c9f5e49859e5016309646ff83.r2.dev/properties/properties-b6a2a696-3178-4b78-a41f-a8dbffa11cdb.webp";

console.log("\n🧪 Testing R2 CORS Configuration\n");
console.log("=".repeat(60));

async function testCORS() {
  try {
    console.log("\n1️⃣  Testing HEAD request...");
    console.log(`   URL: ${TEST_IMAGE_URL}`);

    const headResponse = await fetch(TEST_IMAGE_URL, {
      method: "HEAD",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    console.log(`   Status: ${headResponse.status} ${headResponse.statusText}`);

    // Check CORS headers
    const corsHeaders = {
      "access-control-allow-origin": headResponse.headers.get(
        "access-control-allow-origin",
      ),
      "access-control-allow-methods": headResponse.headers.get(
        "access-control-allow-methods",
      ),
      "access-control-allow-headers": headResponse.headers.get(
        "access-control-allow-headers",
      ),
      "access-control-expose-headers": headResponse.headers.get(
        "access-control-expose-headers",
      ),
      "access-control-max-age": headResponse.headers.get(
        "access-control-max-age",
      ),
    };

    console.log("\n2️⃣  CORS Headers Received:");
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) {
        console.log(`   ✅ ${key}: ${value}`);
      } else {
        console.log(`   ❌ ${key}: NOT PRESENT`);
      }
    });

    // Test GET request
    console.log("\n3️⃣  Testing GET request...");
    const getResponse = await fetch(TEST_IMAGE_URL, {
      method: "GET",
      headers: {
        Origin: "http://localhost:3000",
      },
    });

    console.log(`   Status: ${getResponse.status} ${getResponse.statusText}`);
    console.log(`   Content-Type: ${getResponse.headers.get("content-type")}`);
    console.log(
      `   Content-Length: ${getResponse.headers.get("content-length")} bytes`,
    );

    // Overall result
    console.log("\n" + "=".repeat(60));

    const allowOrigin = corsHeaders["access-control-allow-origin"];

    if (
      allowOrigin &&
      (allowOrigin === "*" || allowOrigin.includes("localhost"))
    ) {
      console.log("\n✅ SUCCESS! CORS is properly configured!");
      console.log("\n📋 Next Steps:");
      console.log("   1. Refresh your React admin panel");
      console.log("   2. Clear browser cache (Ctrl + Shift + Delete)");
      console.log("   3. Try uploading an image again");
      console.log("   4. Images should now display without CORS errors ✨");
    } else {
      console.log("\n❌ CORS NOT CONFIGURED PROPERLY");
      console.log("\n📋 Required Actions:");
      console.log("   1. Go to Cloudflare Dashboard → R2 → zevio-images");
      console.log("   2. Click Settings tab");
      console.log('   3. Scroll to "CORS Policy" section');
      console.log("   4. Copy the configuration from r2-cors-config.json");
      console.log("   5. Save and wait 1-2 minutes");
      console.log("   6. Run this test again");
      console.log("\n   See R2_CORS_FIX_GUIDE.md for detailed instructions");
    }
  } catch (error) {
    console.error("\n❌ Error testing CORS:", error.message);
    console.log("\n💡 Possible Issues:");
    console.log("   - Image URL might be incorrect");
    console.log("   - R2 bucket might not be public");
    console.log("   - Network connectivity issue");
  }
}

// Run test
testCORS();
