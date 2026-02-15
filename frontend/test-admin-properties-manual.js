/**
 * Manual Test Script - Admin Properties API
 *
 * Run this in the browser console after logging in as admin
 */

async function testAdminPropertiesAPI() {
  console.log("🔍 Testing Admin Properties API...\n");

  try {
    // Test 1: Fetch properties
    console.log("📊 Test 1: Fetching properties...");
    const response = await fetch(
      "http://localhost:5000/api/admin/properties?limit=1000",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || JSON.parse(localStorage.getItem("auth-storage"))?.state?.accessToken}`,
        },
      },
    );

    console.log("Response status:", response.status);

    if (response.status !== 200) {
      console.error("❌ Failed with status:", response.status);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Success! Response:", data);

    if (data.data && data.data.properties) {
      console.log(`✅ Found ${data.data.properties.length} properties`);

      // Check first property structure
      if (data.data.properties.length > 0) {
        const firstProperty = data.data.properties[0];
        console.log("\n📝 First property structure:");
        console.log("  ID:", firstProperty.id);
        console.log("  Title:", firstProperty.title);
        console.log("  Price per night:", firstProperty.price_per_night);
        console.log("  GST percentage:", firstProperty.gst_percentage);
        console.log("  City:", firstProperty.city_name);
        console.log("  Vendor:", firstProperty.vendor_name);
        console.log("  Status:", firstProperty.status);
        console.log("  Thumbnail:", firstProperty.thumbnail ? "✓" : "✗");
        console.log("  Image count:", firstProperty.image_count);

        // Check for null pricing
        if (firstProperty.price_per_night === null) {
          console.warn(
            "⚠️ Warning: price_per_night is null - property has no pricing record",
          );
        }
      }
    }

    // Test 2: Fetch stats
    console.log("\n📊 Test 2: Fetching stats...");
    const statsResponse = await fetch(
      "http://localhost:5000/api/admin/properties/stats",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || JSON.parse(localStorage.getItem("auth-storage"))?.state?.accessToken}`,
        },
      },
    );

    const statsData = await statsResponse.json();
    console.log("✅ Stats:", statsData.data);

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testAdminPropertiesAPI();
