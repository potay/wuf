import { test, expect } from "@playwright/test";

test.describe("Public share page", () => {
  // Use Toro's known invite code
  const INVITE_CODE = "ABTV7E";

  test("shows puppy name and stats", async ({ page }) => {
    await page.goto(`/p/${INVITE_CODE}`);
    await expect(page.locator("h1")).toContainText("Toro");
    await expect(page.locator("text=Try Wuf")).toBeVisible();
  });

  test("does not show bottom navigation", async ({ page }) => {
    await page.goto(`/p/${INVITE_CODE}`);
    await expect(page.locator("nav")).not.toBeVisible();
  });

  test("returns 404 for invalid invite code", async ({ page }) => {
    const response = await page.goto("/p/INVALID");
    expect(response?.status()).toBe(404);
  });
});
