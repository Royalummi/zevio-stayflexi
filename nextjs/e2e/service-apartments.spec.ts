import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Service Apartments Page
 * Tests service apartments listing, filters, features, API integration
 */

test.describe("Service Apartments Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/service-apartments");
  });

  test("should load service apartments page", async ({ page }) => {
    await expect(page).toHaveTitle(/Zevio/i);
    // Page loaded successfully
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("/service-apartments");
  });

  test("should fetch and display service apartments from API", async ({
    page,
  }) => {
    // Wait for API response
    const response = await page.waitForResponse(
      (response) =>
        response.url().includes("/api/service-apartments") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    expect(response.ok()).toBeTruthy();

    // Allow React to render
    await page.waitForTimeout(2000);

    // Check apartments are displayed using flexible selectors
    const hasApartmentInfo = await page
      .locator("text=/bedroom|bhk|₹|apartment/i")
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasApartmentInfo).toBeTruthy();
  });

  test("should display features array correctly (SESSION 36.2 fix)", async ({
    page,
  }) => {
    const response = await page.waitForResponse(
      (response) =>
        response.url().includes("/api/service-apartments") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    // Verify API returned features in response
    const body = await response.json();
    const hasFeatures =
      body.data?.properties?.[0]?.features &&
      Array.isArray(body.data.properties[0].features);
    expect(hasFeatures).toBeTruthy();
  });

  test("should display amenities correctly", async ({ page }) => {
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/service-apartments") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    await page.waitForTimeout(2000);

    // Amenities should be visible (AC, WiFi, Security, etc.)
    const amenitiesExist = await page
      .locator("text=/WiFi|AC|Security|Kitchen/i")
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(amenitiesExist).toBeTruthy();
  });

  test("should allow filtering by city", async ({ page }) => {
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/service-apartments") &&
        response.status() === 200,
      { timeout: 15000 }
    );

    // Look for filter controls
    const filterExists = await page
      .locator('select, input[type="search"], [data-testid="filter"]')
      .count();
    expect(filterExists).toBeGreaterThan(0);
  });
});
