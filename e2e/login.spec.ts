import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test("shows branding and sign-in button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Wuf");
    await expect(page.locator("text=Continue with Google")).toBeVisible();
  });

  test("does not show app bottom navigation", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "More" })).not.toBeVisible();
  });

  test("shows Toro illustration", async ({ page }) => {
    await page.goto("/login");
    const img = page.locator('img[alt="Welcome"]');
    await expect(img).toBeVisible();
  });
});
