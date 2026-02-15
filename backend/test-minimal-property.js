/**
 * Minimal Property Creation Test
 * Tests with only required fields to identify the issue
 */

import axios from "axios";

const API_BASE = "http://localhost:5000/api";

async function testMinimalProperty() {
  try {
    // Step 1: Login
    console.log("\n🔐 Logging in...");
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@zevio.com",
      password: "admin123",
    });

    const authToken = loginRes.data.data.accessToken;
    console.log("✅ Login successful\n");

    // Step 2: Fetch dropdown data
    console.log("📊 Fetching dropdown data...");
    const citiesRes = await axios.get(`${API_BASE}/admin/cities`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const vendorsRes = await axios.get(`${API_BASE}/admin/vendors`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const typesRes = await axios.get(`${API_BASE}/admin/property-types`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    const vendorId = vendorsRes.data.data[0].id;
    const cityId = citiesRes.data.data[0].id;
    const propertyTypeId = typesRes.data.data[0].id;

    console.log(`✅ Vendor: ${vendorId}`);
    console.log(`✅ City: ${cityId}`);
    console.log(`✅ Type: ${propertyTypeId}\n`);

    // Step 3: Create minimal property with only required fields
    console.log("📤 Creating property with minimal required fields...");

    const minimalProperty = {
      title: "Minimal Test Property",
      vendor_id: vendorId,
      city_id: cityId,
      property_type_id: propertyTypeId,
      price_per_night: 1000,
    };

    console.log("Request payload:", JSON.stringify(minimalProperty, null, 2));

    const response = await axios.post(
      `${API_BASE}/admin/properties`,
      minimalProperty,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("\n✅ Property created successfully!");
    console.log("Property ID:", response.data.data.id);

    // Cleanup
    await axios.delete(
      `${API_BASE}/admin/properties/${response.data.data.id}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    console.log("✅ Property deleted\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error(
        "Response Data:",
        JSON.stringify(error.response.data, null, 2),
      );

      // Try to get more detailed error from backend
      if (error.response.data?.error) {
        console.error("\nDetailed Error:", error.response.data.error);
      }
      if (error.response.data?.stack) {
        console.error("\nStack Trace:", error.response.data.stack);
      }
    }
  }
}

testMinimalProperty();
