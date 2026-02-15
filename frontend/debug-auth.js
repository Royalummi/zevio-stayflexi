// Authentication and API Error Testing Script
// Run this in the browser console after opening http://localhost:3001

console.log("🔍 Starting Authentication & API Diagnostics...\n");

// Test 1: Check Storage Structure
console.log("=".repeat(50));
console.log("TEST 1: Storage Structure");
console.log("=".repeat(50));

try {
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    console.log("✅ Zustand Storage Found:");
    console.log(
      "  - Access Token:",
      parsed.state?.accessToken
        ? `${parsed.state.accessToken.substring(0, 20)}...`
        : "❌ MISSING",
    );
    console.log(
      "  - Refresh Token:",
      parsed.state?.refreshToken
        ? `${parsed.state.refreshToken.substring(0, 20)}...`
        : "❌ MISSING",
    );
    console.log(
      "  - User:",
      parsed.state?.user ? `✅ ${parsed.state.user.email}` : "❌ MISSING",
    );
    console.log(
      "  - Is Authenticated:",
      parsed.state?.isAuthenticated ? "✅ true" : "❌ false",
    );
  } else {
    console.log("❌ No auth-storage found - User needs to login");
  }

  const directToken = localStorage.getItem("accessToken");
  console.log("\nDirect localStorage:");
  console.log(
    "  - accessToken:",
    directToken ? `✅ ${directToken.substring(0, 20)}...` : "❌ MISSING",
  );
  console.log(
    "  - refreshToken:",
    localStorage.getItem("refreshToken") ? "✅ Present" : "❌ MISSING",
  );
} catch (error) {
  console.error("❌ Error parsing storage:", error);
}

// Test 2: Check API Interceptor
console.log("\n" + "=".repeat(50));
console.log("TEST 2: API Interceptor Token Retrieval");
console.log("=".repeat(50));

try {
  // Simulate what the interceptor does
  let token = null;
  const authStorage = localStorage.getItem("auth-storage");
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.accessToken;
    } catch (e) {
      console.error("Error parsing auth storage:", e);
    }
  }

  if (!token) {
    token = localStorage.getItem("accessToken");
  }

  if (token) {
    console.log("✅ Token Retrieved Successfully");
    console.log("  - Token Preview:", `${token.substring(0, 30)}...`);
    console.log("  - Token Length:", token.length);

    // Decode JWT (basic - just payload)
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log("  - Token Payload:");
        console.log("    - User ID:", payload.id);
        console.log("    - Role:", payload.role);
        console.log(
          "    - Issued At:",
          new Date(payload.iat * 1000).toLocaleString(),
        );
        console.log(
          "    - Expires At:",
          new Date(payload.exp * 1000).toLocaleString(),
        );

        const now = Date.now() / 1000;
        if (payload.exp < now) {
          console.log("    - Status: ❌ EXPIRED");
        } else {
          const minutesLeft = Math.floor((payload.exp - now) / 60);
          console.log(
            `    - Status: ✅ Valid (${minutesLeft} minutes remaining)`,
          );
        }
      }
    } catch (e) {
      console.log("  - Could not decode token payload");
    }
  } else {
    console.log("❌ No token found - User needs to login");
  }
} catch (error) {
  console.error("❌ Error in token check:", error);
}

// Test 3: Test API Connection
console.log("\n" + "=".repeat(50));
console.log("TEST 3: API Connection Test");
console.log("=".repeat(50));

async function testAPIConnection() {
  try {
    // Get token
    let token = null;
    const authStorage = localStorage.getItem("auth-storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      token = parsed.state?.accessToken;
    }
    if (!token) {
      token = localStorage.getItem("accessToken");
    }

    if (!token) {
      console.log("❌ Cannot test API - No token available");
      return;
    }

    console.log("Testing /api/admin/properties/stats...");
    const statsResponse = await fetch(
      "http://localhost:5000/api/admin/properties/stats",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log("✅ Stats API Success:");
      console.log("  - Status:", statsResponse.status);
      console.log("  - Data:", statsData.data);
    } else {
      console.log("❌ Stats API Failed:");
      console.log("  - Status:", statsResponse.status);
      const errorData = await statsResponse.json();
      console.log("  - Error:", errorData);
    }

    console.log("\nTesting /api/admin/properties?limit=10...");
    const propertiesResponse = await fetch(
      "http://localhost:5000/api/admin/properties?limit=10",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (propertiesResponse.ok) {
      const propertiesData = await propertiesResponse.json();
      console.log("✅ Properties API Success:");
      console.log("  - Status:", propertiesResponse.status);
      console.log(
        "  - Total Properties:",
        propertiesData.data.pagination.total,
      );
      console.log(
        "  - Properties Returned:",
        propertiesData.data.properties.length,
      );
    } else {
      console.log("❌ Properties API Failed:");
      console.log("  - Status:", propertiesResponse.status);
      const errorData = await propertiesResponse.json();
      console.log("  - Error:", errorData);
    }
  } catch (error) {
    console.error("❌ API Test Failed:", error.message);
  }
}

testAPIConnection();

// Test 4: Console Warning Check
console.log("\n" + "=".repeat(50));
console.log("TEST 4: Console Warnings Monitor");
console.log("=".repeat(50));
console.log("Monitoring console for next 5 seconds...");

const originalWarn = console.warn;
const originalError = console.error;
const warnings = [];
const errors = [];

console.warn = function (...args) {
  warnings.push(args.join(" "));
  originalWarn.apply(console, args);
};

console.error = function (...args) {
  const message = args.join(" ");
  if (!message.includes("Error fetching") && !message.includes("Retrying")) {
    errors.push(message);
  }
  originalError.apply(console, args);
};

setTimeout(() => {
  console.warn = originalWarn;
  console.error = originalError;

  console.log("\n" + "=".repeat(50));
  console.log("MONITORING RESULTS");
  console.log("=".repeat(50));

  if (warnings.length === 0 && errors.length === 0) {
    console.log("✅ No warnings or errors detected!");
  } else {
    if (warnings.length > 0) {
      console.log("⚠️ Warnings detected:");
      warnings.forEach((w) => console.log("  -", w));
    }
    if (errors.length > 0) {
      console.log("❌ Errors detected:");
      errors.forEach((e) => console.log("  -", e));
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("FINAL REPORT");
  console.log("=".repeat(50));
  console.log("Run this script again after any changes to verify fixes.");
  console.log("\nTo test specific scenarios:");
  console.log("1. Logout and login again");
  console.log("2. Refresh the page");
  console.log("3. Navigate to different admin pages");
  console.log("4. Check for any setState warnings");
}, 5000);

console.log("\n✅ Diagnostics script loaded. Results will appear above.");
console.log(
  "💡 Tip: Keep DevTools Console open to monitor real-time warnings.",
);
