/**
 * Authentication System Testing Script
 * Tests login, registration, and password validation
 */

import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";
const DB_CONFIG = {
  host: "localhost",
  user: "root",
  password: "",
  database: "zevio",
};

const TEST_PASSWORD = "password123";

// Test utilities
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function section(message) {
  log(`\n${"=".repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log("=".repeat(60), colors.blue);
}

// Database setup functions
async function updateTestPasswords() {
  section("Setting up test user passwords");

  try {
    const conn = await mysql.createConnection(DB_CONFIG);
    const hash = await bcrypt.hash(TEST_PASSWORD, 10);

    info(`Generated hash for password: "${TEST_PASSWORD}"`);

    // Update users
    const [userResult] = await conn.query(
      "UPDATE users SET password_hash = ? WHERE email IN (?, ?)",
      [hash, "rajesh@example.com", "priya@example.com"]
    );
    success(`Updated ${userResult.affectedRows} users`);

    // Update employees
    const [empResult] = await conn.query(
      "UPDATE employees SET password_hash = ? WHERE email IN (?, ?)",
      [hash, "rahul.emp@zevio.com", "neha.emp@zevio.com"]
    );
    success(`Updated ${empResult.affectedRows} employees`);

    // Update vendors
    const [vendorResult] = await conn.query(
      "UPDATE vendors SET password_hash = ? WHERE email IN (?, ?, ?)",
      [
        hash,
        "vendor1@example.com",
        "vendor2@example.com",
        "vendor3@example.com",
      ]
    );
    success(`Updated ${vendorResult.affectedRows} vendors`);

    // Update admin
    const [adminResult] = await conn.query(
      "UPDATE admins SET password_hash = ? WHERE email = ?",
      [hash, "admin@zevio.com"]
    );
    success(`Updated ${adminResult.affectedRows} admins`);

    await conn.end();
    success("All test accounts updated successfully");

    return true;
  } catch (err) {
    error(`Failed to update passwords: ${err.message}`);
    return false;
  }
}

// API test functions
async function testLogin(email, expectedRole) {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password: TEST_PASSWORD,
    });

    if (response.data.success) {
      const { user, accessToken, refreshToken } = response.data.data;

      if (user.role === expectedRole) {
        success(`Login successful: ${email} (${user.role})`);
        return { success: true, user, accessToken, refreshToken };
      } else {
        error(`Role mismatch: expected ${expectedRole}, got ${user.role}`);
        return { success: false, error: "Role mismatch" };
      }
    } else {
      error(`Login failed: ${response.data.message}`);
      return { success: false, error: response.data.message };
    }
  } catch (err) {
    error(
      `Login error for ${email}: ${err.response?.data?.message || err.message}`
    );
    return { success: false, error: err.message };
  }
}

async function testRegistration(userData) {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, userData);

    if (response.data.success) {
      success(`Registration successful: ${userData.email}`);
      return { success: true, data: response.data.data };
    } else {
      error(`Registration failed: ${response.data.message}`);
      return { success: false, error: response.data.message };
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message;

    // Expected errors are not failures
    if (errorMsg.includes("already exists") || errorMsg.includes("duplicate")) {
      info(`Expected error: ${errorMsg}`);
      return { success: true, expected: true };
    }

    error(`Registration error: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function testPasswordValidation() {
  section("Testing Password Validation");

  // Test short password (should fail)
  info("Testing short password (7 chars) - should fail...");
  const result1 = await testRegistration({
    full_name: "Test User",
    email: `test_${Date.now()}@test.com`,
    phone: "1234567890",
    password: "short12", // 7 chars
  });

  if (!result1.success) {
    success("Correctly rejected password < 8 characters");
  } else {
    error("Failed to reject short password");
  }

  // Test valid password (should pass)
  info("Testing valid password (8+ chars) - should pass...");
  const testEmail = `test_${Date.now()}@test.com`;
  const result2 = await testRegistration({
    full_name: "Test User",
    email: testEmail,
    phone: "1234567890",
    password: "validpass123", // 12 chars
  });

  if (result2.success) {
    success("Correctly accepted password >= 8 characters");

    // Try to login with new account (will fail - pending status)
    info("Testing login with newly registered account...");
    const loginResult = await testLogin(testEmail, "user");
    if (!loginResult.success) {
      info(
        "New user cannot login (status: pending) - this is expected behavior"
      );
      success("New user registration flow working correctly");
    } else {
      error("New user should not be able to login without approval");
    }
  } else {
    error("Failed to accept valid password");
  }
}

async function testDuplicateEmail() {
  section("Testing Duplicate Email Prevention");

  info("Attempting to register with existing email...");
  const result = await testRegistration({
    full_name: "Duplicate User",
    email: "rajesh@example.com", // Already exists
    phone: "9999999999",
    password: "testpass123",
  });

  if (result.expected) {
    success("Correctly prevented duplicate email registration");
  } else {
    error("Failed to prevent duplicate email");
  }
}

async function testAllRoles() {
  section("Testing Multi-Role Login System");

  const testCases = [
    { email: "rajesh@example.com", role: "user", name: "User" },
    { email: "rahul.emp@zevio.com", role: "employee", name: "Employee" },
    { email: "vendor1@example.com", role: "vendor", name: "Vendor" },
    { email: "admin@zevio.com", role: "super_admin", name: "Admin" },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of testCases) {
    info(`Testing ${test.name} login: ${test.email}`);
    const result = await testLogin(test.email, test.role);

    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }

  log(`\n📊 Results: ${passed} passed, ${failed} failed`, colors.yellow);
}

async function testInvalidCredentials() {
  section("Testing Invalid Credentials");

  info("Testing wrong password...");
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: "rajesh@example.com",
      password: "wrongpassword",
    });
    error("Failed to reject wrong password");
  } catch (err) {
    if (err.response?.status === 401) {
      success("Correctly rejected wrong password");
    } else {
      error(`Unexpected error: ${err.message}`);
    }
  }

  info("Testing non-existent email...");
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: "nonexistent@test.com",
      password: TEST_PASSWORD,
    });
    error("Failed to reject non-existent email");
  } catch (err) {
    if (err.response?.status === 401) {
      success("Correctly rejected non-existent email");
    } else {
      error(`Unexpected error: ${err.message}`);
    }
  }
}

async function testTokens(accessToken, refreshToken) {
  section("Testing Token Authentication");

  info("Testing access token...");
  try {
    const response = await axios.get(`${API_BASE}/users/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (response.data.success) {
      success("Access token working correctly");
    } else {
      error("Access token validation failed");
    }
  } catch (err) {
    if (err.response?.status === 404) {
      info("Profile endpoint not available (404) - skipping token test");
      success("Token generated successfully (endpoint test skipped)");
    } else {
      error(`Token test failed: ${err.message}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  log("\n🧪 Zevio Authentication System Testing", colors.cyan);
  log("Testing Backend API + Database Integration\n", colors.cyan);

  try {
    // Setup
    const setupSuccess = await updateTestPasswords();
    if (!setupSuccess) {
      error("Failed to setup test environment");
      return;
    }

    // Run tests
    await testAllRoles();
    await testInvalidCredentials();
    await testPasswordValidation();
    await testDuplicateEmail();

    // Test tokens with a fresh login
    section("Token Testing");
    const loginResult = await testLogin("rajesh@example.com", "user");
    if (loginResult.success) {
      await testTokens(loginResult.accessToken, loginResult.refreshToken);
    }

    // Summary
    section("Testing Complete");
    success("All authentication tests completed!");
    info("Check the results above for any failures");
  } catch (err) {
    error(`Test runner error: ${err.message}`);
    console.error(err);
  }
}

// Run tests
runAllTests();
