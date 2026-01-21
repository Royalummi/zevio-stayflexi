import { test, expect } from "@playwright/test";

test.describe("Search Modal Experience", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8000");
    await page.waitForLoadState("networkidle");
  });

  test("should open modal when clicking destination field", async ({
    page,
  }) => {
    // Wait for SearchBar to load
    await page.waitForSelector('[data-testid="search-bar-container"]', {
      state: "visible",
    });

    // Click the field wrapper (not the input directly)
    const locationField = page.locator(".searchFieldModern").first();
    await locationField.click();

    // Wait for modal animations
    await page.waitForTimeout(800);

    // Verify overlay is visible
    const overlay = page.locator('[data-testid="search-modal-overlay"]');
    await expect(overlay).toBeVisible();

    // Verify SearchBar is in modal mode (fixed position)
    const searchBar = page.locator('[data-testid="search-bar-container"]');
    const position = await searchBar.evaluate(
      (el) => window.getComputedStyle(el).position,
    );
    expect(position).toBe("fixed");
  });

  test("should open modal when clicking dates field", async ({ page }) => {
    // Click dates field
    await page.click("text=Dates");

    // Wait for modal animations
    await page.waitForTimeout(500);

    // Verify overlay is visible
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Verify dates dropdown is visible
    const datesDropdown = page.locator(".datesDropdownModern");
    await expect(datesDropdown).toBeVisible();
  });

  test("should open modal when clicking guests field", async ({ page }) => {
    // Click guests field
    await page.click("text=Guests");

    // Wait for modal animations
    await page.waitForTimeout(500);

    // Verify overlay is visible
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Verify guests dropdown is visible
    const guestsDropdown = page.locator(".guestsDropdownModern");
    await expect(guestsDropdown).toBeVisible();
  });

  test("should close modal when clicking overlay", async ({ page }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify modal is open
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Click overlay
    await overlay.click();

    // Wait for close animation
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(overlay).not.toBeVisible();
  });

  test("should close modal when pressing ESC key", async ({ page }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify modal is open
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Press ESC key
    await page.keyboard.press("Escape");

    // Wait for close animation
    await page.waitForTimeout(500);

    // Verify modal is closed
    await expect(overlay).not.toBeVisible();
  });

  test("should close modal and navigate when clicking Search button", async ({
    page,
  }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify modal is open
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Type city name
    await page.fill('input[placeholder*="City"]', "Goa");
    await page.waitForTimeout(300);

    // Click a city from dropdown
    await page.click("text=Goa");
    await page.waitForTimeout(300);

    // Click Search button
    await page.click('button:has-text("Search")');

    // Wait for navigation
    await page.waitForTimeout(1000);

    // Verify modal is closed and navigation happened
    await expect(overlay).not.toBeVisible();
    expect(page.url()).toContain("/properties");
  });

  test("should maintain modal state when switching between fields", async ({
    page,
  }) => {
    // Open modal via destination
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify overlay visible
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Click dates field (should keep modal open)
    await page.click("text=Dates");
    await page.waitForTimeout(300);

    // Overlay should still be visible
    await expect(overlay).toBeVisible();

    // Click guests field (should keep modal open)
    await page.click("text=Guests");
    await page.waitForTimeout(300);

    // Overlay should still be visible
    await expect(overlay).toBeVisible();
  });

  test("should animate SearchBar to top when modal opens", async ({ page }) => {
    // Get initial position
    const searchBar = page.locator(".searchBarModern").first();
    const initialTop = await searchBar.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(600); // Wait for animation

    // Get modal position
    const modalTop = await searchBar.evaluate(
      (el) => el.getBoundingClientRect().top,
    );

    // Modal should be closer to top (20px from top)
    expect(modalTop).toBeLessThan(initialTop);
    expect(modalTop).toBeCloseTo(20, 10); // Within 10px of 20px
  });

  test("should display all dropdowns properly in modal mode", async ({
    page,
  }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Type city
    await page.fill('input[placeholder*="City"]', "Goa");
    await page.waitForTimeout(300);

    // Verify city dropdown visible
    const cityDropdown = page.locator(".dropdownModern");
    await expect(cityDropdown).toBeVisible();

    // Click dates
    await page.click("text=Dates");
    await page.waitForTimeout(300);

    // Verify dates dropdown visible
    const datesDropdown = page.locator(".datesDropdownModern");
    await expect(datesDropdown).toBeVisible();

    // Click guests
    await page.click("text=Guests");
    await page.waitForTimeout(300);

    // Verify guests dropdown visible
    const guestsDropdown = page.locator(".guestsDropdownModern");
    await expect(guestsDropdown).toBeVisible();
  });

  test("should work with property type toggle in modal", async ({ page }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify modal open
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // Switch to Service Apartments
    await page.click('button:has-text("Service Apartments")');
    await page.waitForTimeout(300);

    // Modal should still be open
    await expect(overlay).toBeVisible();

    // Dates field should now say "Duration"
    const durationText = page.locator("text=Duration");
    await expect(durationText).toBeVisible();
  });

  test("should handle rapid open/close interactions", async ({ page }) => {
    const overlay = page.locator(".searchOverlay");

    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(300);
    await expect(overlay).toBeVisible();

    // Close via ESC
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(overlay).not.toBeVisible();

    // Open again
    await page.click("text=Dates");
    await page.waitForTimeout(300);
    await expect(overlay).toBeVisible();

    // Close via overlay
    await overlay.click();
    await page.waitForTimeout(300);
    await expect(overlay).not.toBeVisible();

    // Open again
    await page.click("text=Guests");
    await page.waitForTimeout(300);
    await expect(overlay).toBeVisible();
  });

  test("should close all dropdowns when modal closes", async ({ page }) => {
    // Open modal and show dropdowns
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(300);
    await page.fill('input[placeholder*="City"]', "Goa");
    await page.waitForTimeout(300);

    // Verify dropdown visible
    const cityDropdown = page.locator(".dropdownModern");
    await expect(cityDropdown).toBeVisible();

    // Close modal via ESC
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Verify modal closed
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).not.toBeVisible();

    // Verify dropdown closed
    await expect(cityDropdown).not.toBeVisible();
  });

  test("should have proper z-index layering", async ({ page }) => {
    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Check z-index values
    const overlay = page.locator(".searchOverlay");
    const searchBar = page.locator(".searchBarModern").first();

    const overlayZIndex = await overlay.evaluate(
      (el) => window.getComputedStyle(el).zIndex,
    );
    const searchBarZIndex = await searchBar.evaluate(
      (el) => window.getComputedStyle(el).zIndex,
    );

    // Overlay should be 10000, SearchBar should be 10001
    expect(parseInt(overlayZIndex)).toBe(10000);
    expect(parseInt(searchBarZIndex)).toBe(10001);
  });

  test("should maintain responsive behavior in modal", async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Open modal
    await page.click('input[placeholder*="City"]');
    await page.waitForTimeout(500);

    // Verify modal works on mobile
    const overlay = page.locator(".searchOverlay");
    await expect(overlay).toBeVisible();

    // SearchBar should be at top
    const searchBar = page.locator(".searchBarModern").first();
    const modalTop = await searchBar.evaluate(
      (el) => el.getBoundingClientRect().top,
    );
    expect(modalTop).toBeCloseTo(20, 10);

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await expect(overlay).not.toBeVisible();
  });

  test("should have smooth spring animation", async ({ page }) => {
    // Open modal and measure animation duration
    const startTime = Date.now();
    await page.click('input[placeholder*="City"]');

    // Wait for SearchBar to reach fixed position
    const searchBar = page.locator(".searchBarModern").first();
    await searchBar.waitFor({ state: "visible" });

    // Wait for animation to complete
    await page.waitForTimeout(600);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Animation should complete within reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);

    // Verify final state
    const position = await searchBar.evaluate(
      (el) => window.getComputedStyle(el).position,
    );
    expect(position).toBe("fixed");
  });
});
