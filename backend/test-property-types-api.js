import axios from "axios";

const API_BASE = "http://localhost:5000/api";

async function testPropertyTypesAPI() {
  console.log("🧪 Testing Property Types API...\n");

  try {
    // Login as admin
    console.log("1. Logging in as admin...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@zevio.com",
      password: "admin123",
    });

    const token = loginResponse.data.data.accessToken;
    console.log("✅ Login successful\n");

    // Fetch property types
    console.log("2. Fetching property types from API...");
    const response = await axios.get(`${API_BASE}/admin/property-types`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const propertyTypes = response.data.data;

    console.log(`\n=== API RESPONSE ===`);
    console.log(`Status: ${response.status}`);
    console.log(`Count: ${propertyTypes.length}`);
    console.log(`\nProperty Types:\n`);

    propertyTypes.forEach((type, index) => {
      console.log(`${index + 1}. ${type.name}`);
      console.log(`   ID: ${type.id}`);
      console.log(`   Slug: ${type.slug}`);
      console.log(`   Stay Type: ${type.stay_type}`);
      console.log("");
    });

    if (propertyTypes.length === 2) {
      console.log(
        "✅ SUCCESS: API returns exactly 2 property types (correct!)",
      );
    } else {
      console.log(
        `❌ FAIL: Expected 2 property types, but got ${propertyTypes.length}`,
      );
      console.log(
        "   The cache might still be stale. Try restarting the backend again.",
      );
    }
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

testPropertyTypesAPI();
