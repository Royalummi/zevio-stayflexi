// Quick test: try login with known passwords
const https = require("https");

const API = "https://api.zevio.in";

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(API + path);
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body });
          }
        });
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API + path);
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve({ raw: body.substring(0, 200) });
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  // Test passwords for admin
  const adminPasswords = [
    "admin123",
    "password123",
    "Admin@123",
    "Admin123!",
    "super_admin",
  ];

  console.log("=== ADMIN LOGIN TESTS ===");
  for (const pw of adminPasswords) {
    const r = await post("/api/auth/login", {
      email: "admin@zevio.com",
      password: pw,
    });
    console.log(
      `  admin@zevio.com / ${pw}: ${r.success ? "SUCCESS (" + r.data.user.role + ")" : r.message}`,
    );
    if (r.success) {
      // Save tokens for further testing
      const at = r.data.accessToken;
      const rt = r.data.refreshToken;

      console.log(`  AccessToken: ${at.substring(0, 40)}...`);
      console.log(`  RefreshToken: ${rt.substring(0, 40)}...`);

      // Test refresh token
      console.log("\n=== REFRESH TOKEN TEST ===");
      const refreshResp = await post("/api/auth/refresh", { refreshToken: rt });
      console.log(
        `  Refresh: ${refreshResp.success ? "SUCCESS" : "FAILED - " + refreshResp.message}`,
      );

      if (refreshResp.success) {
        const newAt = refreshResp.data.accessToken;
        const newRt = refreshResp.data.refreshToken;
        console.log(
          `  New AccessToken: ${newAt ? newAt.substring(0, 40) + "..." : "NOT RETURNED"}`,
        );
        console.log(
          `  New RefreshToken: ${newRt ? newRt.substring(0, 40) + "..." : "NOT RETURNED!"}`,
        );

        // Test old token is revoked
        console.log("\n=== OLD TOKEN REVOCATION TEST ===");
        const oldResp = await post("/api/auth/refresh", { refreshToken: rt });
        console.log(
          `  Old token reuse: ${oldResp.success ? "STILL WORKS (BAD!)" : "REVOKED (CORRECT) - " + oldResp.message}`,
        );

        // Test new token works
        console.log("\n=== NEW TOKEN WORKS TEST ===");
        if (newRt) {
          const newResp = await post("/api/auth/refresh", {
            refreshToken: newRt,
          });
          console.log(
            `  New token refresh: ${newResp.success ? "WORKS (CORRECT)" : "FAILED - " + newResp.message}`,
          );

          // Use the latest token for authenticated tests
          const finalAt = newResp.success ? newResp.data.accessToken : newAt;

          // Test admin endpoints
          console.log("\n=== ADMIN AUTHENTICATED ENDPOINTS ===");
          const endpoints = [
            "/api/admin/properties",
            "/api/admin/banners",
            "/api/admin/reviews",
            "/api/admin/coupons",
          ];
          for (const ep of endpoints) {
            const r = await get(ep, finalAt);
            console.log(
              `  GET ${ep}: ${r.success ? "OK" : "FAIL - " + r.message}`,
            );
          }

          // Test original_price in properties response
          console.log("\n=== ORIGINAL_PRICE CHECK ===");
          const propsResp = await get("/api/admin/properties", finalAt);
          if (propsResp.success) {
            const props = propsResp.data.properties || propsResp.data;
            console.log(`  Total properties: ${props.length}`);
            for (const p of props.slice(0, 5)) {
              console.log(
                `  ${p.title}: price=${p.price_per_night}, original_price=${p.original_price}, status=${p.status}`,
              );
            }
          }
        }
      }

      break; // Found working password
    }
  }

  // Test vendor login
  console.log("\n=== VENDOR LOGIN TESTS ===");
  const vendorPasswords = ["vendor123", "password123", "Vendor@123"];
  for (const pw of vendorPasswords) {
    const r = await post("/api/auth/login", {
      email: "kruthiksatish9@gmail.com",
      password: pw,
    });
    console.log(
      `  kruthiksatish9@gmail.com / ${pw}: ${r.success ? "SUCCESS (" + r.data.user.role + ")" : r.message}`,
    );
    if (r.success) {
      const vat = r.data.accessToken;

      console.log("\n=== VENDOR AUTHENTICATED ENDPOINTS ===");
      const vResp = await get("/api/vendor/properties", vat);
      console.log(
        `  GET /api/vendor/properties: ${vResp.success ? "OK - " + (vResp.data.properties || vResp.data).length + " properties" : "FAIL - " + vResp.message}`,
      );

      // Check original_price in vendor properties
      if (vResp.success) {
        const vProps = vResp.data.properties || vResp.data;
        for (const p of vProps.slice(0, 3)) {
          console.log(
            `  ${p.title}: price=${p.price_per_night}, original_price=${p.original_price}`,
          );
        }
      }
      break;
    }
  }

  console.log("\n=== ALL TESTS COMPLETE ===");
}

main().catch(console.error);
