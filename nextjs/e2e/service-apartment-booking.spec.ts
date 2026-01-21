import { test, expect } from "@playwright/test";

test.describe("Service Apartment Booking Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to service apartments page
    await page.goto("http://localhost:8000/service-apartments");
    await page.waitForLoadState("networkidle");
  });

  test("should load service apartments listing page", async ({ page }) => {
    // Check if page title is visible
    await expect(
      page.getByRole("heading", { name: /service apartments/i }),
    ).toBeVisible();
  });

  test("should open service apartment detail page", async ({ page }) => {
    // Wait for property cards to load
    await page.waitForSelector('[class*="propertyCard"]', { timeout: 10000 });

    // Click first property card
    const firstProperty = page.locator('[class*="propertyCard"]').first();
    await firstProperty.click();

    // Wait for detail page to load
    await page.waitForLoadState("networkidle");

    // Verify detail page elements
    await expect(page.locator('[class*="propertyHeader"]')).toBeVisible();
    await expect(page.locator('[class*="bookingCard"]')).toBeVisible();
  });

  test("should select dates and calculate price without errors", async ({
    page,
  }) => {
    // Click first property
    await page.waitForSelector('[class*="propertyCard"]', { timeout: 10000 });
    const firstProperty = page.locator('[class*="propertyCard"]').first();
    await firstProperty.click();

    await page.waitForLoadState("networkidle");

    // Wait for booking card
    await page.waitForSelector('[class*="bookingCard"]', { timeout: 5000 });

    // Select check-in date
    const checkInInput = page.locator('input[placeholder="Select check-in"]');
    await checkInInput.click();

    // Wait for datepicker to open
    await page.waitForSelector(".react-datepicker", { timeout: 3000 });

    // Select tomorrow as check-in
    const tomorrow = page
      .locator(
        ".react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)",
      )
      .first();
    await tomorrow.click();

    // Select check-out date (2 days later)
    const checkOutInput = page.locator('input[placeholder="Select check-out"]');
    await checkOutInput.click();

    await page.waitForSelector(".react-datepicker", { timeout: 3000 });

    // Select a future date
    const futureDate = page
      .locator(
        ".react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)",
      )
      .nth(2);
    await futureDate.click();

    // Wait for price calculation
    await page.waitForTimeout(2000);

    // Check if price breakdown is visible
    const priceBreakdown = page.locator('[class*="priceBreakdown"]');
    if (await priceBreakdown.isVisible()) {
      // Verify no console errors related to toLocaleString
      const errors: string[] = [];
      page.on("pageerror", (error) => {
        errors.push(error.message);
      });

      // Wait a bit to catch any errors
      await page.waitForTimeout(1000);

      // Check for toLocaleString errors
      const hasToLocaleStringError = errors.some(
        (err) =>
          err.includes("toLocaleString") ||
          err.includes("Cannot read properties of undefined"),
      );

      expect(hasToLocaleStringError).toBe(false);
    }
  });

  test("should handle reserve button click", async ({ page }) => {
    // Click first property
    await page.waitForSelector('[class*="propertyCard"]', { timeout: 10000 });
    const firstProperty = page.locator('[class*="propertyCard"]').first();
    await firstProperty.click();

    await page.waitForLoadState("networkidle");

    // Select dates
    const checkInInput = page.locator('input[placeholder="Select check-in"]');
    await checkInInput.click();
    await page.waitForSelector(".react-datepicker");
    const tomorrow = page
      .locator(
        ".react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)",
      )
      .first();
    await tomorrow.click();

    const checkOutInput = page.locator('input[placeholder="Select check-out"]');
    await checkOutInput.click();
    await page.waitForSelector(".react-datepicker");
    const futureDate = page
      .locator(
        ".react-datepicker__day:not(.react-datepicker__day--disabled):not(.react-datepicker__day--outside-month)",
      )
      .nth(2);
    await futureDate.click();

    // Wait for price calculation
    await page.waitForTimeout(2000);

    // Click reserve button
    const reserveButton = page.locator("button", { hasText: /reserve now/i });
    await reserveButton.click();

    // Should navigate to booking review page
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/booking-review");
  });

  test("should test share and wishlist buttons", async ({ page }) => {
    // Click first property
    await page.waitForSelector('[class*="propertyCard"]', { timeout: 10000 });
    const firstProperty = page.locator('[class*="propertyCard"]').first();
    await firstProperty.click();

    await page.waitForLoadState("networkidle");

    // Test share button
    const shareButton = page.locator("button", { hasText: /share/i });
    await expect(shareButton).toBeVisible();

    // Test wishlist button
    const wishlistButton = page.locator("button", { hasText: /wishlist/i });
    await expect(wishlistButton).toBeVisible();
  });

  test("should navigate back to listings", async ({ page }) => {
    // Click first property
    await page.waitForSelector('[class*="propertyCard"]', { timeout: 10000 });
    const firstProperty = page.locator('[class*="propertyCard"]').first();
    await firstProperty.click();

    await page.waitForLoadState("networkidle");

    // Click back button
    const backButton = page.locator("button", { hasText: /back/i });
    await backButton.click();

    // Should be back on listings page
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("/service-apartments");
  });
});
