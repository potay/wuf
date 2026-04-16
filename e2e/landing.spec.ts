import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("shows hero headline and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Your puppy");
    await expect(page.locator("text=Start for free").first()).toBeVisible();
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

  test("does not show app bottom navigation", async ({ page }) => {
    await page.goto("/");
    // The app's bottom nav has a "More" button. Landing page should not have it.
    await expect(page.getByRole("button", { name: "More" })).not.toBeVisible();
  });

  test("shows pricing section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=$3/month")).toBeVisible();
  });
});
