import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Branding regression tests
// Verify Forge-Blog branding consistency across all public pages
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Branding — Forge-Blog", () => {
  test("EN homepage has Forge-Blog in title, header logo, and structured data", async ({
    page,
  }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    // 1. Document title contains "Forge-Blog" (from root layout template)
    await expect(page).toHaveTitle(/Forge-Blog/, { timeout: 15000 });

    // 2. Header contains the logo with the wordmark "Forge-Blog"
    const logoLink = page.locator('a[aria-label="Forge-Blog — Home"]');
    await expect(logoLink).toBeVisible({ timeout: 15000 });

    // 3. The visible text "Forge-Blog" exists in the header
    await expect(logoLink).toContainText("Forge-Blog");

    // 4. Page renders at least one article card
    const articleCards = page.locator(
      'a[href*="/en/article/"]'
    );
    await expect(articleCards.first()).toBeVisible({ timeout: 15000 });

    // 5. Structured data JSON-LD is present
    const jsonld = page.locator('script[type="application/ld+json"]');
    await expect(jsonld.first()).toBeAttached({ timeout: 10000 });

    // 6. Footer contains "Forge-Blog"
    await expect(page.locator("footer")).toContainText("Forge-Blog");
  });

  test("FR homepage has same branding as EN", async ({ page }) => {
    await page.goto("/fr", { waitUntil: "load", timeout: 30000 });

    await expect(page).toHaveTitle(/Forge-Blog/, { timeout: 15000 });

    const logoLink = page.locator('a[aria-label="Forge-Blog — Home"]');
    await expect(logoLink).toBeVisible({ timeout: 15000 });
    await expect(logoLink).toContainText("Forge-Blog");

    // French articles exist
    const articleCards = page.locator(
      'a[href*="/fr/article/"]'
    );
    await expect(articleCards.first()).toBeVisible({ timeout: 15000 });

    await expect(page.locator("footer")).toContainText("Forge-Blog");
  });

  test("Admin sidebar displays Forge-Blog", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "load", timeout: 30000 });

    // Check if we were redirected to login (Supabase auth gate)
    const currentUrl = page.url();
    if (currentUrl.includes("admin=login")) {
      // Supabase is configured but not authenticated — skip this test
      test.skip();
      return;
    }

    // Admin page loads
    await expect(page).toHaveTitle(/Forge-Blog/, { timeout: 15000 });

    // Sidebar contains "Forge-Blog"
    const sidebar = page.locator("aside").filter({ hasText: "Forge-Blog" });
    await expect(sidebar).toBeVisible({ timeout: 15000 });
  });

  test("Favicon and manifest are linked", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    // Check favicon link exists
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveAttribute("href", "/icons/icon.svg");

    // Check manifest link exists
    const manifest = page.locator('link[rel="manifest"]');
    await expect(manifest).toHaveAttribute("href", "/manifest.json");
  });

  test("SVG logo icon is accessible", async ({ page }) => {
    await page.goto("/icons/icon.svg", { waitUntil: "load", timeout: 30000 });
    // SVG should render (check that we get a non-error response)
    await expect(page.locator("svg")).toBeVisible({ timeout: 10000 });
  });

  test("Skip-to-content link is first focusable element", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeVisible({ timeout: 10000 });

    // Tab to the skip link
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
  });
});
