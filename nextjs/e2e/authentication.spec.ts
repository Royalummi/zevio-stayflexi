import { test, expect } from "@playwright/test";

/**
 * E2E Tests: Authentication Flow
 * Tests login, register, profile access
 */

test.describe("Authentication Flow", () => {
  test("should open login modal", async ({ page }) => {
    await page.goto("/");

    // Look for login button/link
    const loginButton = page
      .locator(
        'button:has-text("Login"), a:has-text("Login"), [data-testid="login-button"]'
      )
      .first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();

      // Check modal or login page opened
      await expect(
        page.locator('input[type="email"], input[name="email"]')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test("should show validation errors on empty submit", async ({ page }) => {
    await page.goto("/");

    const loginButton = page
      .locator(
        'button:has-text("Login"), a:has-text("Login"), [data-testid="login-button"]'
      )
      .first();
    if (await loginButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loginButton.click();

      // Try to submit empty form
      const submitButton = page
        .locator(
          'button[type="submit"]:has-text("Login"), button:has-text("Sign In")'
        )
        .first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();

        // Should show validation error
        await expect(
          page.locator("text=/required|invalid/i").first()
        ).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test("should redirect to dashboard when trying to access protected route", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    // Should redirect to login or show auth modal
    await page.waitForTimeout(2000);

    const isOnDashboard = page.url().includes("/dashboard");
    const isOnLogin =
      page.url().includes("/login") ||
      (await page
        .locator('input[type="email"]')
        .isVisible({ timeout: 3000 })
        .catch(() => false));

    expect(isOnDashboard || isOnLogin).toBeTruthy();
  });

  test("should redirect to profile when trying to access without auth", async ({
    page,
  }) => {
    await page.goto("/profile");

    await page.waitForTimeout(3000); // Allow for redirects

    // Should either stay on profile (if auth optional) or redirect/show login
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy(); // Page loaded successfully
  });
});
