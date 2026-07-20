import { test, expect } from "@playwright/test";

// ─────────────────────────────────────────────────────────────────────────────
// API route tests
// ─────────────────────────────────────────────────────────────────────────────

test.describe("RSS feed", () => {
  test("GET /api/rss?locale=en returns valid RSS XML", async ({ request }) => {
    const res = await request.get("/api/rss?locale=en");
    expect(res.ok()).toBe(true);
    expect(res.headers()["content-type"]).toContain("xml");

    const body = await res.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("<item>");
    expect(body).toContain("Forge-Blog");
    expect(body).toContain("</rss>");
  });

  test("GET /api/rss?locale=fr returns French RSS", async ({ request }) => {
    const res = await request.get("/api/rss?locale=fr");
    expect(res.ok()).toBe(true);

    const body = await res.text();
    expect(body).toContain('<?xml version="1.0"');
    expect(body).toContain("<rss");
    expect(body).toContain("<channel>");
    expect(body).toContain("<item>");
    expect(body).toContain("Forge-Blog");
  });

  test("GET /api/rss without locale defaults to English", async ({ request }) => {
    // The route defaults to 'en' when no locale is provided
    const res = await request.get("/api/rss");
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain("<language>en</language>");
  });

  test("GET /api/rss with unknown locale defaults to English", async ({ request }) => {
    // The route falls back to 'en' for any locale that isn't exactly 'fr'
    const res = await request.get("/api/rss?locale=invalid");
    expect(res.ok()).toBe(true);
    const body = await res.text();
    expect(body).toContain("<language>en</language>");
  });
});

test.describe("Search API", () => {
  test("GET /api/search?q=forgetting&locale=en returns results", async ({ request }) => {
    const res = await request.get("/api/search?q=forgetting&locale=en");
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThanOrEqual(1);
    expect(data.count).toBeGreaterThanOrEqual(1);

    // Check result shape
    const first = data.results[0];
    expect(first).toHaveProperty("title");
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("excerpt");
    expect(first).toHaveProperty("locale", "en");
  });

  test("GET /api/search?q=forgetting&locale=fr returns French results", async ({ request }) => {
    const res = await request.get("/api/search?q=oubli&locale=fr");
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThanOrEqual(1);

    const first = data.results[0];
    expect(first).toHaveProperty("locale", "fr");
  });

  test("GET /api/search without q returns empty results", async ({ request }) => {
    const res = await request.get("/api/search?locale=en");
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results).toHaveLength(0);
  });

  test("GET /api/search with no results returns empty array", async ({ request }) => {
    const res = await request.get(
      "/api/search?q=xyznonexistentkeyword&locale=en"
    );
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results).toHaveLength(0);
    expect(data.count).toBe(0);
  });
});

test.describe("Newsletter API", () => {
  test("POST /api/newsletter/subscribe with valid email succeeds", async ({ request }) => {
    const res = await request.post("/api/newsletter/subscribe", {
      data: { email: "test@example.com", locale: "en" },
    });
    expect(res.ok()).toBe(true);

    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  test("POST /api/newsletter/subscribe with invalid email returns 400", async ({ request }) => {
    const res = await request.post("/api/newsletter/subscribe", {
      data: { email: "notanemail", locale: "en" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/newsletter/subscribe without email returns 400", async ({ request }) => {
    const res = await request.post("/api/newsletter/subscribe", {
      data: { locale: "en" },
    });
    expect(res.status()).toBe(400);
  });
});
