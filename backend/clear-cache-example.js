import axios from "axios";

const API_BASE = "http://localhost:5000/api";

async function clearCacheExample() {
  console.log("🧹 Cache Management Utility\n");
  console.log(
    "This utility demonstrates how to clear backend cache when you make changes to database.\n",
  );

  try {
    // Login as admin
    console.log("1. Logging in as admin...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@zevio.com",
      password: "admin123",
    });

    const token = loginResponse.data.data.accessToken;
    console.log("✅ Login successful\n");

    // Clear all cache
    console.log("2. Clearing all cache (cities, vendors, property types)...");
    const clearAllResponse = await axios.post(
      `${API_BASE}/admin/cache/clear?type=all`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    console.log(`✅ ${clearAllResponse.data.message}\n`);

    // Verify property types are fresh
    console.log(
      "3. Fetching property types (should be fresh from database)...",
    );
    const propertyTypesResponse = await axios.get(
      `${API_BASE}/admin/property-types`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const propertyTypes = propertyTypesResponse.data.data;
    console.log(`✅ Retrieved ${propertyTypes.length} property types:`);
    propertyTypes.forEach((type, index) => {
      console.log(`   ${index + 1}. ${type.name} (${type.slug})`);
    });

    console.log("\n📝 Usage Examples:");
    console.log(
      "   - Clear all cache:           POST /api/admin/cache/clear?type=all",
    );
    console.log(
      "   - Clear cities only:         POST /api/admin/cache/clear?type=cities",
    );
    console.log(
      "   - Clear vendors only:        POST /api/admin/cache/clear?type=vendors",
    );
    console.log(
      "   - Clear property types only: POST /api/admin/cache/clear?type=propertyTypes",
    );

    console.log("\n💡 When to use:");
    console.log("   - After adding/removing cities in database");
    console.log("   - After adding/removing vendors");
    console.log("   - After changing property types (like you just did)");
    console.log("   - When you want fresh data without restarting the server");
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

clearCacheExample();
