// Focused refresh token rotation test
const https = require("https");
const crypto = require("crypto");

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

async function main() {
  // 1. Login
  console.log("1. Login...");
  const login = await post("/api/auth/login", {
    email: "admin@zevio.com",
    password: "password123",
  });
  if (!login.success) {
    console.log("Login FAILED:", login.message);
    return;
  }

  const rt1 = login.data.refreshToken;
  console.log(
    "   RT1 hash:",
    crypto.createHash("sha256").update(rt1).digest("hex").substring(0, 20) +
      "...",
  );

  // 2. First refresh - should work and give RT2
  console.log("2. Refresh with RT1...");
  const ref1 = await post("/api/auth/refresh", { refreshToken: rt1 });
  console.log(
    "   Result:",
    ref1.success ? "SUCCESS" : "FAIL - " + ref1.message,
  );

  if (!ref1.success) return;
  const rt2 = ref1.data.refreshToken;
  console.log(
    "   RT2 hash:",
    crypto.createHash("sha256").update(rt2).digest("hex").substring(0, 20) +
      "...",
  );
  console.log("   RT1 === RT2?", rt1 === rt2);

  // 3. Wait a moment, then try RT1 again - should FAIL
  console.log("3. Reuse RT1 (should fail)...");
  await new Promise((r) => setTimeout(r, 1000));
  const ref2 = await post("/api/auth/refresh", { refreshToken: rt1 });
  console.log(
    "   Result:",
    ref2.success ? "STILL WORKS (BAD!" : "REVOKED (CORRECT) - " + ref2.message,
  );

  // 4. Use RT2 - should work
  console.log("4. Use RT2...");
  const ref3 = await post("/api/auth/refresh", { refreshToken: rt2 });
  console.log(
    "   Result:",
    ref3.success ? "SUCCESS" : "FAIL - " + ref3.message,
  );

  if (ref3.success) {
    const rt3 = ref3.data.refreshToken;
    console.log("   RT3 received:", rt3 ? "YES" : "NO");

    // 5. RT2 should now be revoked
    console.log("5. Reuse RT2 (should fail)...");
    await new Promise((r) => setTimeout(r, 500));
    const ref4 = await post("/api/auth/refresh", { refreshToken: rt2 });
    console.log(
      "   Result:",
      ref4.success ? "STILL WORKS (BAD!)" : "REVOKED (CORRECT)",
    );
  }

  console.log("\nDone.");
}

main().catch(console.error);
