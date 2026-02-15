const axios = require("axios");

const API_BASE_URL = "http://localhost:5000/api";
let authToken = "";

async function loginAsAdmin() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/admin/login`, {
      email: "admin@zevio.com",
      password: "Admin@123",
    });

    authToken = response.data.data.accessToken;
    console.log("✅ Admin login successful\n");
  } catch (error) {
    console.error("❌ Login failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

async function debugAPIs() {
  await loginAsAdmin();

  // Test cities API
  console.log("Testing /api/admin/cities...");
  try {
    const citiesRes = await axios.get(`${API_BASE_URL}/admin/cities`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Cities response:", JSON.stringify(citiesRes.data, null, 2));
  } catch (error) {
    console.error("Cities error:", error.response?.data || error.message);
  }

  console.log("\n\nTesting /api/admin/vendors...");
  try {
    const vendorsRes = await axios.get(`${API_BASE_URL}/admin/vendors`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Vendors response:", JSON.stringify(vendorsRes.data, null, 2));
  } catch (error) {
    console.error("Vendors error:", error.response?.data || error.message);
  }

  console.log("\n\nTesting /api/admin/property-types...");
  try {
    const typesRes = await axios.get(`${API_BASE_URL}/admin/property-types`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("Types response:", JSON.stringify(typesRes.data, null, 2));
  } catch (error) {
    console.error("Types error:", error.response?.data || error.message);
  }
}

debugAPIs();
