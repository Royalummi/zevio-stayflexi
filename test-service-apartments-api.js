// Test Service Apartments API
const axios = require("axios");

async function testServiceApartmentsAPI() {
  try {
    console.log("🧪 Testing Service Apartments API...\n");

    const response = await axios.get(
      "http://localhost:5000/api/service-apartments?limit=1"
    );

    if (response.data.success) {
      const property = response.data.data.properties[0];

      console.log("✅ API Response Successful!\n");
      console.log("Property Details:");
      console.log("================");
      console.log("ID:", property.id);
      console.log("Title:", property.title);
      console.log("City:", property.city);
      console.log("\nAmenities (array):", property.amenities);
      console.log("\nFeatures (array):", property.features);
      console.log("\n📊 Complete Response:");
      console.log(JSON.stringify(property, null, 2));

      // Check if features array exists
      if (property.features && Array.isArray(property.features)) {
        console.log("\n✅ Features array is present and properly formatted!");
        console.log("   Features count:", property.features.length);
      } else {
        console.log("\n❌ Features array missing or malformed!");
      }
    }
  } catch (error) {
    console.error("❌ API Test Failed:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

testServiceApartmentsAPI();
