import axios from "axios";

const API_URL = "http://localhost:5000/api";

async function testVendorAuth() {
  console.log("🧪 Testing Vendor Authentication & Dashboard Access\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Vendor Login
    console.log("\n📝 Test 1: Vendor Login");
    console.log("POST /api/auth/login");
    console.log("Email: vendor1@example.com");
    console.log("Password: password123\n");

    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: "vendor1@example.com",
      password: "password123",
    });

    const { user, accessToken } = loginResponse.data.data;

    console.log("✅ Login Successful!");
    console.log(`   User: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Token: ${accessToken.substring(0, 30)}...`);

    // Test 2: Dashboard Stats
    console.log("\n📊 Test 2: Vendor Dashboard Stats");
    console.log("GET /api/vendor/dashboard\n");

    const dashboardResponse = await axios.get(`${API_URL}/vendor/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const stats = dashboardResponse.data.data;

    console.log("✅ Dashboard Data Retrieved!");
    console.log(`   Total Properties: ${stats.total_properties}`);
    console.log(`   Active Properties: ${stats.active_properties}`);
    console.log(`   Active Bookings: ${stats.active_bookings}`);
    console.log(`   Total Revenue: ₹${stats.total_revenue}`);
    console.log(`   Pending Settlements: ₹${stats.pending_settlements}`);

    // Test 3: Properties List
    console.log("\n🏠 Test 3: Vendor Properties");
    console.log("GET /api/vendor/properties?limit=5\n");

    const propertiesResponse = await axios.get(
      `${API_URL}/vendor/properties?limit=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const properties = propertiesResponse.data.data.properties;

    console.log("✅ Properties Retrieved!");
    console.log(`   Found ${properties.length} properties`);
    properties.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title} (${p.status})`);
    });

    console.log("\n" + "=".repeat(60));
    console.log(
      "✅ ALL TESTS PASSED! Vendor authentication working perfectly!",
    );
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.response?.data || error.message);
    console.error("\nStatus Code:", error.response?.status);
    console.error("Response:", JSON.stringify(error.response?.data, null, 2));
    process.exit(1);
  }
}

testVendorAuth();
