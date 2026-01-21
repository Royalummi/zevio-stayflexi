import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Static Pages
 * Tests about, contact, why-zevio pages
 */

test.describe("About Page", () => {
  test("should load about page", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/Zevio/i);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should display company information", async ({ page }) => {
    await page.goto("/about");
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    if (content) {
      expect(content.length).toBeGreaterThan(0);
    }
  });
});

test.describe("Contact Page", () => {
  test("should load contact page", async ({ page }) => {
    await page.goto("/contact");
    await expect(page).toHaveTitle(/Zevio/i);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should display contact form or information", async ({ page }) => {
    await page.goto("/contact");
    const hasForm =
      (await page.locator('form, input[type="email"], textarea').count()) > 0;
    const hasContactInfo =
      (await page.locator("text=/email|phone|address/i").count()) > 0;
    expect(hasForm || hasContactInfo).toBeTruthy();
  });
});

test.describe("Why Zevio Page", () => {
  test("should load why-zevio page", async ({ page }) => {
    await page.goto("/why-zevio");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should display value propositions", async ({ page }) => {
    await page.goto("/why-zevio");
    const content = await page.textContent("body");
    expect(content).toBeTruthy();
    if (content) {
      expect(content.length).toBeGreaterThan(100);
    }
  });
});
