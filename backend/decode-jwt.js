import jwt from "jsonwebtoken";

const token = process.argv[2];

if (!token) {
  console.log("Usage: node decode-jwt.js <token>");
  process.exit(1);
}

try {
  const decoded = jwt.decode(token);
  console.log("\n🔓 Decoded JWT Token:");
  console.log(JSON.stringify(decoded, null, 2));
  console.log("\n✅ Token decoded successfully\n");
} catch (error) {
  console.error("❌ Failed to decode token:", error.message);
  process.exit(1);
}
