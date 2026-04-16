import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero headline and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Your puppy");
    await expect(page.locator("text=Start for free")).toBeVisible();
  });

  test("shows feature cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=One-tap logging")).toBeVisible();
    await expect(page.locator("text=Crate training timer")).toBeVisible();
    await expect(page.locator("text=Smart insights")).toBeVisible();
  });

  test("CTA links to login", async ({ page }) => {
    await page.goto("/");
    const cta = page.locator("text=Start for free").first();
    await expect(cta).toHaveAttribute("href", "/login");
  });

  test("does not show bottom navigation", async ({ page }) => {
    await page.goto("/");
    // Bottom nav should not be visible on landing
    await expect(page.locator("text=Home").first()).not.toBeVisible();
  });
});
