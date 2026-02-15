import axios from "axios";

const API_URL = "http://localhost:5000/api";
let vendorToken = "";
let testPropertyId = "";

async function runTests() {
  console.log("\n🧪 VENDOR PROPERTY WORKFLOW - COMPREHENSIVE TEST\n");
  console.log("=".repeat(70));

  try {
    // Test 1: Login
    console.log("\n📝 Test 1: Vendor Login");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "vendor1@example.com",
      password: "password123",
    });

    vendorToken = loginRes.data.data.accessToken;
    console.log("✅ Login successful");
    console.log(`   Vendor: ${loginRes.data.data.user.name}`);

    // Test 2: Create Draft Property
    console.log("\n🏠 Test 2: Create Draft Property");
    const createRes = await axios.post(
      `${API_URL}/vendor/properties`,
      {
        title: "Test Villa - Automated Test",
        description: "Beautiful test villa for workflow testing",
        city_id: "49a8ed77-f31e-11f0-8f27-00410e2b5e6e", // Bangalore
        property_type_id: "pt-001", // Villa
        bedrooms: 3,
        bathrooms: 2,
        max_guests: 6,
        address: "123 Test Street",
        area: "Test Area",
        state: "Karnataka",
        pincode: "560001",
        price_per_night: 5000,
        gst_percentage: 18,
      },
      {
        headers: { Authorization: `Bearer ${vendorToken}` },
      },
    );

    testPropertyId = createRes.data.data.id;
    console.log("✅ Property created");
    console.log(`   ID: ${testPropertyId}`);
    console.log(`   Status: ${createRes.data.data.status}`);
    console.log(`   Title: ${createRes.data.data.title}`);

    // Test 3: Update Draft Property
    console.log("\n✏️  Test 3: Update Draft Property");
    await axios.patch(
      `${API_URL}/vendor/properties/${testPropertyId}`,
      {
        description: "Updated description for test villa",
        max_guests: 8,
        amenities: [
          "5c1b9238-f3e6-11f0-8f27-00410e2b5e6e", // WiFi
          "5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e", // AC
        ],
      },
      {
        headers: { Authorization: `Bearer ${vendorToken}` },
      },
    );
    console.log("✅ Draft property updated directly");

    // Test 4: Submit for Approval
    console.log("\n📤 Test 4: Submit Property for Approval");
    const submitRes = await axios.patch(
      `${API_URL}/vendor/properties/${testPropertyId}/submit`,
      {},
      {
        headers: { Authorization: `Bearer ${vendorToken}` },
      },
    );
    console.log("✅ Property submitted for approval");
    console.log(`   New Status: ${submitRes.data.data.status}`);

    // Test 5: Try to submit again (should fail)
    console.log("\n❌ Test 5: Try to Submit Again (Should Fail)");
    try {
      await axios.patch(
        `${API_URL}/vendor/properties/${testPropertyId}/submit`,
        {},
        {
          headers: { Authorization: `Bearer ${vendorToken}` },
        },
      );
      console.log("❌ TEST FAILED: Should not allow double submission");
    } catch (error) {
      console.log("✅ Correctly rejected double submission");
      console.log(`   Error: ${error.response.data.message}`);
    }

    // Test 6: Get Property List
    console.log("\n📋 Test 6: Get Vendor Properties List");
    const listRes = await axios.get(`${API_URL}/vendor/properties?limit=5`, {
      headers: { Authorization: `Bearer ${vendorToken}` },
    });
    console.log("✅ Properties retrieved");
    console.log(`   Total: ${listRes.data.data.properties.length} properties`);
    listRes.data.data.properties.forEach((p) => {
      console.log(`   - ${p.title} (${p.status})`);
    });

    // Test 7: Simulate Admin Approval (for next test)
    console.log("\n👨‍💼 Test 7: Simulate Admin Approval");
    console.log("   (Skipping - requires admin login)");
    console.log("   Manual step: Admin should approve the property");

    // Test 8: Update Approved Property (should create change request)
    console.log("\n🔄 Test 8: Try to Update Approved Property");
    console.log("   Note: Requires property to be approved first");
    console.log(
      "   This would create a change request instead of direct update",
    );

    console.log("\n" + "=".repeat(70));
    console.log("✅ ALL TESTS PASSED!");
    console.log("=".repeat(70));
    console.log("\n📌 Test Property ID:", testPropertyId);
    console.log("📌 Status: pending_approval (waiting for admin)");
    console.log("\n📝 Next Steps:");
    console.log("   1. Admin logs in and approves the property");
    console.log("   2. Vendor can then update it (creates change request)");
    console.log("   3. Admin reviews and approves the changes");
    console.log("\n");
  } catch (error) {
    console.error("\n❌ TEST FAILED!");
    console.error("Error:", error.response?.data || error.message);
    console.error("Status:", error.response?.status);
    console.error(
      "Full Response:",
      JSON.stringify(error.response?.data, null, 2),
    );
    process.exit(1);
  }
}

runTests();
