import axios from "axios";
import jwt from "jsonwebtoken";

const API_URL = "http://localhost:5000/api";

async function debugVendorAuth() {
  console.log("\n🔍 Debugging Vendor Authentication\n");
  console.log("=".repeat(70));

  try {
    // Step 1: Login
    console.log("\n1️⃣  Logging in as vendor1@example.com...");

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: "vendor1@example.com",
      password: "password123",
    });

    const { user, accessToken } = loginResponse.data.data;

    console.log("✅ Login Response:");
    console.log(JSON.stringify(loginResponse.data.data.user, null, 2));

    // Step 2: Decode JWT
    console.log("\n2️⃣  Decoding JWT Token...");
    const decoded = jwt.decode(accessToken);

    console.log("✅ Decoded JWT Payload:");
    console.log(JSON.stringify(decoded, null, 2));

    // Step 3: Check what authorize() expects
    console.log("\n3️⃣  Checking Authorization...");
    console.log(`   Token has role: "${decoded.role}"`);
    console.log(`   Route expects: ["vendor"]`);
    console.log(`   Match: ${decoded.role === "vendor" ? "✅ YES" : "❌ NO"}`);

    // Step 4: Test Dashboard Call
    console.log("\n4️⃣  Calling Vendor Dashboard API...");

    try {
      const dashboardResponse = await axios.get(`${API_URL}/vendor/dashboard`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("✅ Dashboard API Success!");
      console.log(JSON.stringify(dashboardResponse.data.data, null, 2));
    } catch (apiError) {
      console.error("❌ Dashboard API Failed!");
      console.error("Status:", apiError.response?.status);
      console.error("Message:", apiError.response?.data?.message);

      // Additional debugging
      console.log("\n🔧 Debug Info:");
      console.log(
        "   Full Error Response:",
        JSON.stringify(apiError.response?.data, null, 2),
      );
      console.log("   Request Headers:", apiError.config?.headers);
    }

    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error during login:");
    console.error(error.response?.data || error.message);
  }
}

debugVendorAuth();
