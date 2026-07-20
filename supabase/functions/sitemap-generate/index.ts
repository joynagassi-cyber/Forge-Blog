/**
 * Edge Function: sitemap-generate (section 8.5 / 14.4)
 *
 * GET: returns locale-segmented sitemap XML with hreflang alternates.
 * Should be triggered on publish webhook or on a schedule.
 * Reads all published articles from Supabase.
 */
// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://forge-blog.io";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Fetch all published articles with translation group info
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, slug, locale, translation_group_id, published_at, last_updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group articles by translation_group_id to resolve hreflang alternates
  const groups = new Map<string, any[]>();
  for (const a of articles ?? []) {
    const group = groups.get(a.translation_group_id) ?? [];
    group.push(a);
    groups.set(a.translation_group_id, group);
  }

  // Static pages (home pages per locale)
  const staticUrls = [
    {
      loc: SITE_URL + "/en",
      alternates: [
        { hreflang: "en", href: SITE_URL + "/en" },
        { hreflang: "fr", href: SITE_URL + "/fr" },
        { hreflang: "x-default", href: SITE_URL + "/en" },
      ],
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: "daily",
      priority: "1.0",
    },
    {
      loc: SITE_URL + "/fr",
      alternates: [
        { hreflang: "en", href: SITE_URL + "/en" },
        { hreflang: "fr", href: SITE_URL + "/fr" },
        { hreflang: "x-default", href: SITE_URL + "/en" },
      ],
      lastmod: new Date().toISOString().slice(0, 10),
      changefreq: "daily",
      priority: "1.0",
    },
  ];

  // Article URLs
  const articleUrls: any[] = [];
  for (const group of groups.values()) {
    const enVersion = group.find((a) => a.locale === "en");
    const frVersion = group.find((a) => a.locale === "fr");

    for (const article of group) {
      const loc = xmlEscape(SITE_URL + "/" + article.locale + "/article/" + article.slug);
      const lastmod = (article.last_updated_at ?? article.published_at ?? "")
        .slice(0, 10);

      const alternates = [
        ...(enVersion
          ? [{ hreflang: "en", href: xmlEscape(SITE_URL + "/en/article/" + enVersion.slug) }]
          : []),
        ...(frVersion
          ? [{ hreflang: "fr", href: xmlEscape(SITE_URL + "/fr/article/" + frVersion.slug) }]
          : []),
        // x-default always points to the English canonical (section 8.2)
        {
          hreflang: "x-default",
          href: xmlEscape(SITE_URL + "/en/article/" + (enVersion ?? article).slug),
        },
      ];

      articleUrls.push({ loc, alternates, lastmod, changefreq: "monthly", priority: "0.8" });
    }
  }

  const allUrls = [...staticUrls, ...articleUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
${(u.alternates as any[])
  .map(
    (a) =>
      `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}"/>`
  )
  .join("\n")}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
});
