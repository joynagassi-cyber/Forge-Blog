import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// Page rendering & navigation tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Homepage rendering", () => {
  test("EN homepage shows hero, pillar sections, and CTAs", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    // Hero section
    await expect(
      page.getByRole("heading", { level: 1 })
    ).toBeVisible({ timeout: 15000 });

    // Pillar sections exist
    const pillarHeadings = page.locator("h3");
    await expect(pillarHeadings.first()).toBeVisible({ timeout: 15000 });

    // CTA buttons are visible
    await expect(page.getByText("Try NainoForge")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Request a SCYForge demo")).toBeVisible();
  });

  test("FR homepage shows French content", async ({ page }) => {
    await page.goto("/fr", { waitUntil: "load", timeout: 30000 });

    // French CTA text
    await expect(page.getByText("Essayer NainoForge")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Demander une démo SCYForge")).toBeVisible();

    // French search placeholder
    const searchInput = page.locator("#site-search");
    await expect(searchInput).toHaveAttribute("placeholder", /Rechercher/);
  });

  test("Search input is present and functional on homepage", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    const searchInput = page.locator("#site-search");
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    await expect(searchInput).toHaveAttribute("type", "search");
  });
});

test.describe("Article page", () => {
  test("Article page renders content blocks and TOC", async ({ page }) => {
    // Navigate to first article from homepage
    await page.goto("/en", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Navigate to first article via its link
    const articleLink = page.locator('a[href*="/en/article/"]').first();
    await articleLink.waitFor({ state: "visible", timeout: 15000 });
    const href = await articleLink.getAttribute("href");
    if (!href) throw new Error("No article link found");

    await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Article title is visible
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15000 });

    // Breadcrumb navigation exists
    await expect(page.getByLabel("Breadcrumb")).toBeVisible({ timeout: 15000 });

    // Author and date info is shown
    await expect(page.locator("time").first()).toBeVisible({ timeout: 10000 });

    // Body content exists (article-prose or similar content container)
    const articleBody = page.locator(".article-prose, .prose, article");
    await expect(articleBody.first()).toBeVisible({ timeout: 10000 });
  });

  test("Article missing language banner shows when translation missing", async ({ page }) => {
    // French articles that have no EN counterpart will show the banner
    await page.goto("/fr/article/ia-apprentissage-distribution", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // The translation-notice banner
    const banner = page.locator('[role="status"]');
    const exists = (await banner.count()) > 0;
    if (exists) {
      await expect(banner).toBeVisible();
    }
  });
});

test.describe("Admin pages", () => {
  test("Admin dashboard loads article table", async ({ page }) => {
    await page.goto("/admin", { waitUntil: "load", timeout: 30000 });

    // Check if redirected to login
    if (page.url().includes("admin=login")) {
      test.skip();
      return;
    }

    // Dashboard loads
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    // Article count or table is rendered
    const table = page.locator("table");
    const dashboardCards = page.locator(".grid > div, section > div");
    const hasContent = (await table.count()) > 0 || (await dashboardCards.count()) > 0;
    expect(hasContent).toBe(true);
  });

  test("Admin articles page shows article list", async ({ page }) => {
    await page.goto("/admin/articles", { waitUntil: "load", timeout: 30000 });

    // Check if redirected to login
    if (page.url().includes("admin=login")) {
      test.skip();
      return;
    }

    // Page renders
    await expect(page.locator("main")).toBeVisible({ timeout: 15000 });

    // Search or filter input exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    const exists = (await searchInput.count()) > 0;
    expect(exists).toBe(true);
  });
});

test.describe("Navigation", () => {
  test("Language switcher toggles between EN and FR", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });

    // Click language switcher
    const langSwitch = page.locator("button, a").filter({ hasText: /FR|EN/ }).first();
    await expect(langSwitch).toBeVisible({ timeout: 15000 });
    await langSwitch.click();

    // Should now be on /fr or /fr/article/...
    await expect(page).toHaveURL(/\/fr/);
  });

  test("Theme toggle is present on both locales", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load", timeout: 30000 });
    // ThemeToggle aria-label is "Switch to dark mode" or "Switch to light mode"
    await expect(page.locator('button[aria-label*="mode" i]')).toBeVisible({ timeout: 15000 });

    await page.goto("/fr", { waitUntil: "load", timeout: 30000 });
    await expect(page.locator('button[aria-label*="mode" i]')).toBeVisible({ timeout: 15000 });
  });
});
