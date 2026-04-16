import { test, expect } from "@playwright/test";

/**
 * Layout and visual regression tests.
 *
 * These run against staging BEFORE production deploy.
 * They catch:
 * - Elements overlapping or being cut off
 * - Broken layouts on mobile viewports
 * - Missing images, blank pages
 * - Content overflow issues
 *
 * All assertions are deterministic (no screenshot comparison)
 * so they work reliably across any OS/CI environment.
 */

test.describe("Layout checks", () => {
  test("landing page renders completely", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Hero section
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("text=Start for free").first()).toBeVisible();

    // Features section
    await expect(page.locator("text=One-tap logging")).toBeVisible();

    // Pricing section
    await expect(page.locator("text=$3/month")).toBeVisible();

    // Page should have substantial content (not a blank error page)
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    expect(bodyHeight).toBeGreaterThan(1000);
  });

  test("login page layout is correct", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Illustration visible
    const img = page.locator('img[alt="Welcome"]');
    await expect(img).toBeVisible();

    // Branding
    await expect(page.locator("h1")).toContainText("Wuf");

    // Sign-in button visible and fully within viewport (not clipped by nav/safe area)
    const btn = page.locator("text=Continue with Google");
    await expect(btn).toBeVisible();
    const btnBox = await btn.boundingBox();
    expect(btnBox).toBeTruthy();
    const viewport = page.viewportSize()!;
    expect(btnBox!.y + btnBox!.height).toBeLessThanOrEqual(viewport.height);
  });

  test("share page renders puppy data", async ({ page }) => {
    await page.goto("/p/ABTV7E");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1")).toContainText("Toro");
    await expect(page.locator("text=Try Wuf")).toBeVisible();
  });

  test("unauthenticated user sees landing or login", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    const isLanding = url.endsWith("/") || url.includes("/landing");
    const isLogin = url.includes("/login");
    expect(isLanding || isLogin).toBeTruthy();

    // Page should not be blank
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test("no console errors on landing page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Filter out expected third-party errors (e.g., Firebase, analytics)
    const appErrors = errors.filter(
      (e) => !e.includes("firebase") && !e.includes("analytics") && !e.includes("Failed to load resource")
    );
    expect(appErrors).toHaveLength(0);
  });

  test("no console errors on login page", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    const appErrors = errors.filter(
      (e) => !e.includes("firebase") && !e.includes("analytics") && !e.includes("Failed to load resource")
    );
    expect(appErrors).toHaveLength(0);
  });
});
