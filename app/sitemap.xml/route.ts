import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import { getPublishedArticles } from "@/lib/supabase/queries";
import type { Locale } from "@/lib/locale/resolve";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

async function getArticles(locale: Locale) {
  const live = await getPublishedArticles(locale);
  if (live && live.length > 0) {
    return live.map((a) => ({
      slug: a.slug,
      updatedAt: a.last_updated_at ?? a.published_at ?? new Date().toISOString(),
    }));
  }
  return DEMO_ARTICLES.filter((a) => a.locale === locale).map((a) => ({
    slug: a.slug,
    updatedAt: a.updated_at ?? a.published_at,
  }));
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const [enArticles, frArticles] = await Promise.all([
    getArticles("en"),
    getArticles("fr"),
  ]);

  const base = [
    { url: `${SITE_URL}/en`, lastModified: new Date().toISOString(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/fr`, lastModified: new Date().toISOString(), changeFrequency: "daily", priority: 1 },
  ] as const;

  const entries = [
    ...base,
    ...enArticles.map((a) => ({
      url: `${SITE_URL}/en/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...frArticles.map((a) => ({
      url: `${SITE_URL}/fr/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${escapeXml(e.url)}</loc>
    <lastmod>${escapeXml(e.lastModified)}</lastmod>
    <changefreq>${escapeXml(e.changeFrequency)}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
