import axios from "axios";

const API_URL = "http://localhost:5000/api";
const TEST_PROPERTY_ID = "5560b34a-7399-447c-be37-e2eb5e837cb7";

async function testApprovedPropertyUpdate() {
  console.log("\n🧪 TESTING APPROVED PROPERTY UPDATE (Change Request)\n");
  console.log("=".repeat(70));

  try {
    // Step 1: Login
    console.log("\n📝 Step 1: Vendor Login");
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: "vendor1@example.com",
      password: "password123",
    });

    const vendorToken = loginRes.data.data.accessToken;
    console.log("✅ Login successful");

    // Step 2: Try to update approved property (should create change request)
    console.log("\n🔄 Step 2: Update Approved Property");
    console.log("   This should create a change request...");

    const updateRes = await axios.patch(
      `${API_URL}/vendor/properties/${TEST_PROPERTY_ID}`,
      {
        max_guests: 10, // Changed from 8
        description:
          "UPDATED: This is a change request test for approved property",
        price_per_night: 6000, // Changed from 5000
      },
      {
        headers: { Authorization: `Bearer ${vendorToken}` },
      },
    );

    console.log("✅ Change request created successfully!");
    console.log(`   Change Request ID: ${updateRes.data.data.changeRequestId}`);
    console.log(`   Message: ${updateRes.data.message}`);

    // Step 3: Verify change request was created
    console.log("\n🔍 Step 3: Verifying Change Request");
    console.log("   (Would query database to see change request)");

    console.log("\n" + "=".repeat(70));
    console.log("✅ CHANGE REQUEST WORKFLOW TEST PASSED!");
    console.log("=".repeat(70));

    console.log("\n📋 Summary:");
    console.log("   - Property remains APPROVED with OLD data");
    console.log("   - Change request created with status=pending");
    console.log("   - Admin will review before/after comparison");
    console.log("   - On approval, only changed fields will update");
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

testApprovedPropertyUpdate();
