import { test, expect } from "@playwright/test";

/**
 * Visual regression tests capture screenshots and compare against baselines.
 * Run `npx playwright test --update-snapshots` to update baselines.
 *
 * These catch layout issues like:
 * - Bottom nav overlapping content
 * - Modals hidden behind other elements
 * - Broken spacing on mobile viewports
 */

const MOBILE = { width: 390, height: 844 }; // iPhone 14

test.describe("Visual regression - public pages", () => {
  test.use({ viewport: MOBILE });

  test("landing page - mobile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveScreenshot("landing-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("login page - mobile", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Sign in")).toBeVisible();
    await expect(page).toHaveScreenshot("login-mobile.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
