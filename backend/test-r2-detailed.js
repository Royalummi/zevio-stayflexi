/**
 * Enhanced R2 Configuration Test with Detailed Debugging
 */

import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

dotenv.config();

console.log("🔍 DETAILED R2 CREDENTIALS DEBUG\n");
console.log("=".repeat(60));

// Check raw environment variables
console.log("\n📋 Raw Environment Variables:");
console.log("   R2_ENDPOINT:", process.env.R2_ENDPOINT);
console.log(
  "   R2_ACCESS_KEY_ID length:",
  process.env.R2_ACCESS_KEY_ID?.length || 0,
);
console.log("   R2_ACCESS_KEY_ID value:", process.env.R2_ACCESS_KEY_ID);
console.log(
  "   R2_SECRET_ACCESS_KEY length:",
  process.env.R2_SECRET_ACCESS_KEY?.length || 0,
);
console.log(
  "   R2_SECRET_ACCESS_KEY (first 10 chars):",
  process.env.R2_SECRET_ACCESS_KEY?.substring(0, 10) + "...",
);
console.log("   R2_BUCKET_NAME:", process.env.R2_BUCKET_NAME);
console.log("   R2_PUBLIC_URL:", process.env.R2_PUBLIC_URL);

// Validate credential format
console.log("\n🔍 Credential Validation:");
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accessKeyId) {
  console.log("   ❌ Access Key ID is missing!");
} else if (accessKeyId.length < 20) {
  console.log(
    "   ⚠️  Access Key ID seems too short:",
    accessKeyId.length,
    "chars",
  );
  console.log("      (Expected: 32+ characters for R2)");
} else {
  console.log(
    "   ✅ Access Key ID length looks good:",
    accessKeyId.length,
    "chars",
  );
}

if (!secretAccessKey) {
  console.log("   ❌ Secret Access Key is missing!");
} else if (secretAccessKey.length < 40) {
  console.log(
    "   ⚠️  Secret Access Key seems too short:",
    secretAccessKey.length,
    "chars",
  );
  console.log("      (Expected: 64 characters for R2)");
} else {
  console.log(
    "   ✅ Secret Access Key length looks good:",
    secretAccessKey.length,
    "chars",
  );
}

// Check for common issues
console.log("\n🔍 Common Issues Check:");
if (accessKeyId?.includes(" ") || secretAccessKey?.includes(" ")) {
  console.log("   ⚠️  WARNING: Credentials contain spaces!");
}
if (accessKeyId?.startsWith('"') || accessKeyId?.endsWith('"')) {
  console.log("   ⚠️  WARNING: Access Key has quotes around it!");
  console.log("      Remove quotes from .env file");
}
if (secretAccessKey?.startsWith('"') || secretAccessKey?.endsWith('"')) {
  console.log("   ⚠️  WARNING: Secret Key has quotes around it!");
  console.log("      Remove quotes from .env file");
}

// Try creating S3Client
console.log("\n🔧 Attempting to Create S3 Client:");
try {
  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
  });
  console.log("   ✅ S3Client created successfully");

  // Try a simple operation
  console.log("\n📤 Testing Upload to R2:");
  console.log("   Creating test buffer...");

  const testBuffer = Buffer.from("Test file from Zevio backend");
  const testKey = "test/credential-test-" + Date.now() + ".txt";

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: testKey,
    Body: testBuffer,
    ContentType: "text/plain",
  });

  console.log("   Uploading to:", testKey);
  const response = await client.send(command);
  console.log("   ✅ UPLOAD SUCCESSFUL!");
  console.log("   Response:", JSON.stringify(response, null, 2));
  console.log("\n✅ R2 Configuration is WORKING!");
  console.log(
    "   Test file uploaded:",
    `${process.env.R2_PUBLIC_URL}/${testKey}`,
  );
} catch (error) {
  console.log("   ❌ S3Client Error:", error.name);
  console.log("   Message:", error.message);

  if (error.name === "CredentialsProviderError") {
    console.log("\n⚠️  CREDENTIALS PROVIDER ERROR");
    console.log("   This means the AWS SDK cannot validate your credentials.");
    console.log("   \nPossible causes:");
    console.log("   1. Access Key ID or Secret Access Key format is incorrect");
    console.log(
      "   2. Credentials were copied incorrectly (extra characters, truncated)",
    );
    console.log("   3. Token was deleted/revoked in Cloudflare dashboard");
    console.log("   \n💡 Solution:");
    console.log("   Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens");
    console.log("   Delete old token and create a NEW token");
    console.log(
      "   Copy the credentials EXACTLY as shown (no extra spaces/quotes)",
    );
  }

  if (error.$metadata) {
    console.log("\n   Error Metadata:", error.$metadata);
  }

  console.log("\n   Full error:", error);
}

console.log("\n" + "=".repeat(60));
