import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration for Zevio Next.js E2E Tests
 * Updated: Full User Flow Coverage
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // User flows must run sequentially to respect state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker — flows share browser state
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: "http://localhost:8000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "user-flows-chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /user-flow-.*\.spec\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /user-flow-.*\.spec\.ts/,
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:8000",
    reuseExistingServer: true, // Always reuse — don't restart if already running
    timeout: 120000,
  },
});
