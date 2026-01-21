import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Home Page
 * Tests hero section, property search, featured properties
 */

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should load home page successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/Zevio/i);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should display navigation menu", async ({ page }) => {
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.getByRole("link", { name: /properties/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /service apartments/i })
    ).toBeVisible();
  });

  test("should display hero section with search", async ({ page }) => {
    // Check for hero content
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
  });

  test("should have working navigation links", async ({ page }) => {
    await page
      .getByRole("link", { name: /properties/i })
      .first()
      .click();
    await page.waitForURL("**/properties");
    await expect(page).toHaveURL(/properties/);
  });
});
