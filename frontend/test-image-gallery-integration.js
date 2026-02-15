import api from "./src/lib/api.js";

// Mock localStorage for Node.js environment
global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

console.log("🧪 Testing Admin Property Form with Image Gallery\n");

async function testAdminLogin() {
  console.log("1️⃣ Testing Admin Login...");
  try {
    const response = await api.post("/auth/login", {
      email: "admin@zevio.com",
      password: "Admin@123",
    });

    if (response.data.success) {
      const { accessToken } = response.data.data;
      // Store token for subsequent requests
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
      console.log("   ✅ Admin login successful");
      return true;
    }
  } catch (error) {
    console.error(
      "   ❌ Login failed:",
      error.response?.data?.message || error.message,
    );
    return false;
  }
}

async function testGetProperties() {
  console.log("\n2️⃣ Testing Get Properties List...");
  try {
    const response = await api.get("/admin/properties?page=1&limit=5");

    if (response.data.success) {
      const properties = response.data.data;
      console.log(`   ✅ Retrieved ${properties.length} properties`);

      if (properties.length > 0) {
        const sampleProperty = properties[0];
        console.log(`   📦 Sample Property: ${sampleProperty.title}`);
        console.log(`      ID: ${sampleProperty.id}`);
        console.log(
          `      Photos: ${sampleProperty.photos ? JSON.parse(sampleProperty.photos).length : 0} images`,
        );
        return sampleProperty.id;
      }
    }
    return null;
  } catch (error) {
    console.error(
      "   ❌ Get properties failed:",
      error.response?.data?.message || error.message,
    );
    return null;
  }
}

async function testGetPropertyDetails(propertyId) {
  console.log(`\n3️⃣ Testing Get Property Details (ID: ${propertyId})...`);
  try {
    const response = await api.get(`/admin/properties/${propertyId}`);

    if (response.data.success) {
      const property = response.data.data;
      console.log("   ✅ Property details retrieved successfully");
      console.log(`      Title: ${property.title}`);
      console.log(`      City: ${property.city_name || "N/A"}`);
      console.log(`      Vendor: ${property.vendor_name || "N/A"}`);
      console.log(
        `      Photos: ${property.images ? property.images.length : 0} images`,
      );
      console.log(
        `      Amenities: ${property.amenities ? property.amenities.length : 0}`,
      );
      console.log(
        `      Contacts: ${property.contacts ? property.contacts.length : 0}`,
      );

      // Validate photos format
      if (property.images && property.images.length > 0) {
        console.log("   📸 Sample Image URLs:");
        property.images.slice(0, 3).forEach((img, idx) => {
          console.log(`      ${idx + 1}. ${img.image_url.substring(0, 60)}...`);
        });
      }

      return property;
    }
  } catch (error) {
    console.error(
      "   ❌ Get property details failed:",
      error.response?.data?.message || error.message,
    );
    console.error("      Status:", error.response?.status);
    return null;
  }
}

async function testCreateProperty() {
  console.log("\n4️⃣ Testing Create New Property with Image Gallery...");
  try {
    // First, get dropdown data
    const [citiesRes, vendorsRes, typesRes] = await Promise.all([
      api.get("/admin/cities"),
      api.get("/admin/vendors"),
      api.get("/admin/property-types"),
    ]);

    const cities = citiesRes.data.data;
    const vendors = vendorsRes.data.data;
    const types = typesRes.data.data;

    console.log(`   📋 Available options:`);
    console.log(`      Cities: ${cities.length}`);
    console.log(`      Vendors: ${vendors.length}`);
    console.log(`      Property Types: ${types.length}`);

    if (cities.length === 0 || types.length === 0) {
      console.error("   ❌ No cities or property types available");
      return null;
    }

    // Create test property with image gallery
    const testPhotos = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    ];

    const payload = {
      title: `Test Property - Image Gallery ${Date.now()}`,
      description:
        "Testing new image gallery component with drag-and-drop functionality",
      vendor_id: vendors.length > 0 ? vendors[0].id : null,
      city_id: cities[0].id,
      property_type_id: types[0].id,
      address: "123 Test Street",
      area: "Test Area",
      city: cities[0].name,
      state: cities[0].state,
      pincode: "123456",
      bedrooms: 3,
      bathrooms: 2,
      max_guests: 6,
      price_per_night: 5000,
      gst_percentage: 18,
      status: "draft",
      photos: JSON.stringify(testPhotos),
      amenities: JSON.stringify(["WiFi", "AC", "Parking"]),
      house_rules: JSON.stringify({
        no_smoking: true,
        no_parties: true,
        pets_allowed: false,
      }),
      cancellation_policy: JSON.stringify({
        policy_type: "Flexible",
        free_cancellation_hours: 48,
      }),
    };

    const response = await api.post("/admin/properties", payload);

    if (response.data.success) {
      const newProperty = response.data.data;
      console.log("   ✅ Property created successfully!");
      console.log(`      ID: ${newProperty.id || newProperty.property_id}`);
      console.log(`      Photos added: ${testPhotos.length}`);
      return newProperty.id || newProperty.property_id;
    }
  } catch (error) {
    console.error(
      "   ❌ Create property failed:",
      error.response?.data?.message || error.message,
    );
    if (error.response?.data?.errors) {
      console.error("      Validation errors:", error.response.data.errors);
    }
    return null;
  }
}

async function testUpdateProperty(propertyId) {
  console.log(
    `\n5️⃣ Testing Update Property with New Images (ID: ${propertyId})...`,
  );
  try {
    // Get current property
    const getResponse = await api.get(`/admin/properties/${propertyId}`);
    const property = getResponse.data.data;

    // Parse existing photos
    let currentPhotos = [];
    if (property.photos) {
      currentPhotos =
        typeof property.photos === "string"
          ? JSON.parse(property.photos)
          : property.photos;
    }

    console.log(`   📸 Current photos: ${currentPhotos.length}`);

    // Add 2 new photos
    const newPhotos = [
      ...currentPhotos,
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
      "https://images.unsplash.com/photo-1600563438938-a650cb2e68ea",
    ];

    const updatePayload = {
      title: property.title + " (Updated)",
      photos: JSON.stringify(newPhotos),
    };

    const response = await api.put(
      `/admin/properties/${propertyId}`,
      updatePayload,
    );

    if (response.data.success) {
      console.log("   ✅ Property updated successfully!");
      console.log(`      Photos before: ${currentPhotos.length}`);
      console.log(`      Photos after: ${newPhotos.length}`);
      return true;
    }
  } catch (error) {
    console.error(
      "   ❌ Update property failed:",
      error.response?.data?.message || error.message,
    );
    return false;
  }
}

async function runAllTests() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  SESSION 49: Image Gallery Integration Test Suite    ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  const results = {
    passed: 0,
    failed: 0,
    total: 5,
  };

  // Test 1: Login
  const loginSuccess = await testAdminLogin();
  loginSuccess ? results.passed++ : results.failed++;

  if (!loginSuccess) {
    console.log("\n❌ Login failed, stopping tests");
    return results;
  }

  // Test 2: Get Properties
  const propertyId = await testGetProperties();
  propertyId ? results.passed++ : results.failed++;

  // Test 3: Get Property Details
  if (propertyId) {
    const propertyDetails = await testGetPropertyDetails(propertyId);
    propertyDetails ? results.passed++ : results.failed++;
  } else {
    results.failed++;
  }

  // Test 4: Create Property
  const newPropertyId = await testCreateProperty();
  newPropertyId ? results.passed++ : results.failed++;

  // Test 5: Update Property (use newly created one or existing)
  const updateId = newPropertyId || propertyId;
  if (updateId) {
    const updateSuccess = await testUpdateProperty(updateId);
    updateSuccess ? results.passed++ : results.failed++;
  } else {
    results.failed++;
  }

  // Print results
  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║                   TEST RESULTS                         ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(
    `║  Total Tests: ${results.total}                                        ║`,
  );
  console.log(
    `║  Passed: ${results.passed}                                            ║`,
  );
  console.log(
    `║  Failed: ${results.failed}                                            ║`,
  );
  console.log(
    `║  Success Rate: ${((results.passed / results.total) * 100).toFixed(0)}%                                   ║`,
  );
  console.log("╚════════════════════════════════════════════════════════╝");

  if (results.passed === results.total) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Image Gallery integration is working perfectly!",
    );
  } else {
    console.log("\n⚠️  Some tests failed. Check the output above for details.");
  }
}

runAllTests().catch((error) => {
  console.error("\n💥 Test suite crashed:", error);
  process.exit(1);
});
