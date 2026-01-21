import axios from "axios";

async function testCalculatePrice() {
  try {
    const payload = {
      property_id: "27c960ac-f31f-11f0-8f27-00410e2b5e6e", // Modern 2BHK Koramangala
      check_in: "2026-01-25",
      check_out: "2026-01-29", // 4 nights to meet minimum stay
      is_corporate: false,
    };

    console.log("Testing calculate-price API...");
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      "http://localhost:5000/api/service-apartments/calculate-price",
      payload,
    );

    console.log("\n✅ SUCCESS!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log("\n❌ ERROR!");
    console.log("Status:", error.response?.status);
    console.log("Message:", error.response?.data);
    console.log("Full error:", error.message);
  }
}

testCalculatePrice();
