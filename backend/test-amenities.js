import axios from "axios";
import mysql from "mysql2/promise";

const API_BASE_URL = "http://localhost:5000/api";

const ADMIN_CREDENTIALS = {
  email: "admin@zevio.com",
  password: "admin123",
};

// Database connection for direct queries
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
};

let authToken = "";

async function loginAsAdmin() {
  console.log("🔐 Logging in as admin...");
  const response = await axios.post(
    `${API_BASE_URL}/auth/login`,
    ADMIN_CREDENTIALS,
  );
  authToken = response.data.data.accessToken;
  console.log("✅ Admin login successful\n");
}

async function fetchAmenities() {
  console.log("🎨 Fetching available amenities...");
  const response = await axios.get(`${API_BASE_URL}/admin/amenities`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`✅ Found ${response.data.data.amenities.length} amenities\n`);
  return response.data.data.amenities;
}

async function testPropertyWithAmenities() {
  try {
    await loginAsAdmin();

    // Use known amenity IDs from database (from Database.sql analysis)
    const selectedAmenities = [
      "5c1b9238-f3e6-11f0-8f27-00410e2b5e6e", // WiFi
      "5c1baec3-f3e6-11f0-8f27-00410e2b5e6e", // Workspace
      "5c1bb0ab-f3e6-11f0-8f27-00410e2b5e6e", // AC
      "5c1bb1bb-f3e6-11f0-8f27-00410e2b5e6e", // Parking
      "5c1bb300-f3e6-11f0-8f27-00410e2b5e6e", // Kitchen
    ];

    console.log(
      "📝 Selected amenities: WiFi, Workspace, AC, Parking, Kitchen\n",
    );

    // Fetch dropdown data
    console.log("📊 Fetching dropdown data...");
    const [citiesRes, vendorsRes, typesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/admin/cities`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      axios.get(`${API_BASE_URL}/admin/vendors`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
      axios.get(`${API_BASE_URL}/admin/property-types`, {
        headers: { Authorization: `Bearer ${authToken}` },
      }),
    ]);

    // Extract IDs directly from response
    const vendor_id = vendorsRes.data.data[0].id;
    const city_id = citiesRes.data.data[0].id;
    const property_type_id = typesRes.data.data[0].id;

    console.log("✅ Dropdown data fetched\n");

    // Create property with amenities
    console.log("🏠 Creating property WITH amenities...");
    const propertyData = {
      title: "Test Property with Amenities",
      vendor_id,
      city_id,
      property_type_id,
      price_per_night: 2000,
      bedrooms: 2,
      bathrooms: 2,
      max_guests: 4,
      description: "Test property with amenities to verify junction table",
      amenities: JSON.stringify(selectedAmenities), // Send as JSON string
    };

    console.log("Request payload:", JSON.stringify(propertyData, null, 2));

    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/properties`,
      propertyData,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );

    const propertyId = createResponse.data.data.id;
    console.log(`✅ Property created: ${propertyId}\n`);

    // Fetch property details to verify amenities were saved
    console.log("🔍 Fetching property details...");
    const detailsResponse = await axios.get(
      `${API_BASE_URL}/admin/properties/${propertyId}`,
      { headers: { Authorization: `Bearer ${authToken}` } },
    );

    const property = detailsResponse.data.data;
    console.log("✅ Property details fetched\n");

    // Check amenities in database directly
    console.log("📊 Verifying amenities in database...");

    // Query property_amenities junction table
    const connection = await mysql.createConnection(dbConfig);
    const [amenityRecords] = await connection.query(
      "SELECT pa.*, a.name FROM property_amenities pa LEFT JOIN amenities a ON pa.amenity_id = a.id WHERE pa.property_id = ?",
      [propertyId],
    );

    console.log(
      `✅ Found ${amenityRecords.length} amenity records in property_amenities table`,
    );

    if (amenityRecords.length !== selectedAmenities.length) {
      throw new Error(
        `Expected ${selectedAmenities.length} amenities but found ${amenityRecords.length}`,
      );
    }

    // Verify each amenity ID matches
    const insertedAmenityIds = amenityRecords.map((r) => r.amenity_id);
    const missingAmenities = selectedAmenities.filter(
      (id) => !insertedAmenityIds.includes(id),
    );

    if (missingAmenities.length > 0) {
      throw new Error(`Missing amenities: ${missingAmenities.join(", ")}`);
    }

    console.log("✅ All amenities correctly inserted:");
    amenityRecords.forEach((record) => {
      console.log(`   - ${record.name || record.amenity_id}`);
    });

    await connection.end();
    console.log("");

    // Cleanup
    console.log("\n🗑️  Deleting test property...");
    await axios.delete(`${API_BASE_URL}/admin/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    console.log("✅ Test property deleted\n");

    console.log("🎉 AMENITIES TEST PASSED!\n");
    console.log("✅ Property created with amenities");
    console.log("✅ Amenities inserted into junction table");
    console.log("✅ Property deleted successfully");
  } catch (error) {
    console.error("\n❌ TEST FAILED:", error.response?.data || error.message);
    process.exit(1);
  }
}

testPropertyWithAmenities();
