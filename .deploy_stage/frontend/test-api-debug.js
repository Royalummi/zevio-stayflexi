// Test script to debug API errors
// Run this after logging into the admin panel

(async function debugAPI() {
  console.log("🔍 Starting API Debug...");

  // Get token from storage
  let token = null;
  try {
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.accessToken;
    }
    if (!token) {
      token = localStorage.getItem("accessToken");
    }

    if (!token) {
      console.error("❌ No token found. Please login first.");
      return;
    }

    console.log("✅ Token found:", token.substring(0, 30) + "...");
  } catch (e) {
    console.error("❌ Error getting token:", e);
    return;
  }

  // Test the properties API
  console.log("\n📡 Testing /api/admin/properties...");
  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/properties?limit=10",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("📊 Response status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success!");
      console.log("   Total properties:", data.data.pagination.total);
      console.log("   Properties returned:", data.data.properties.length);
      console.log("   First property:", data.data.properties[0]?.title);
    } else {
      const errorData = await response.json();
      console.error("❌ API Error:");
      console.error("   Status:", response.status);
      console.error("   Message:", errorData.message);
      console.error("   Full error:", errorData);
    }
  } catch (error) {
    console.error("❌ Fetch failed:", error.message);
  }

  console.log("\n✅ Debug complete. Check backend console for detailed logs.");
})();
