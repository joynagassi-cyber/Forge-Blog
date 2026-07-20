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
      translation_group_id: a.translation_group_id,
    }));
  }
  return DEMO_ARTICLES.filter((a) => a.locale === locale).map((a) => ({
    slug: a.slug,
    updatedAt: a.updated_at ?? a.published_at,
    translation_group_id: a.translation_group_id,
  }));
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  const [enArticles, frArticles] = await Promise.all([
    getArticles("en"),
    getArticles("fr"),
  ]);

  // Build article map by translation_group_id for hreflang resolution
  const translationMap = new Map<string, { en?: string; fr?: string; enUpdated: string; frUpdated?: string }>();
  for (const a of enArticles) {
    const existing = translationMap.get(a.translation_group_id) ?? { enUpdated: a.updatedAt };
    existing.en = a.slug;
    existing.enUpdated = a.updatedAt;
    translationMap.set(a.translation_group_id, existing);
  }
  for (const a of frArticles) {
    const existing = translationMap.get(a.translation_group_id) ?? { enUpdated: "" };
    existing.fr = a.slug;
    existing.frUpdated = a.updatedAt;
    translationMap.set(a.translation_group_id, existing);
  }

  // Static pages
  const staticLocales = [
    { locale: "en", href: `${SITE_URL}/en`, lastmod: new Date().toISOString().slice(0, 10) },
    { locale: "fr", href: `${SITE_URL}/fr`, lastmod: new Date().toISOString().slice(0, 10) },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

  // Home pages with hreflang alternates
  for (const staticPage of staticLocales) {
    const alternates = staticLocales
      .map((alt) => `      <xhtml:link rel="alternate" hreflang="${alt.locale}" href="${escapeXml(alt.href)}"/>`)
      .join("\n");

    xml += `  <url>
    <loc>${escapeXml(staticPage.href)}</loc>
    <lastmod>${staticPage.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${SITE_URL}/en`)}"/>
  </url>
`;
  }

  // Article pages with hreflang alternates
  for (const [groupId, slugs] of translationMap) {
    const en = slugs.en;
    const fr = slugs.fr;

    // Generate entry for each locale version
    const locales = [
      { locale: "en" as const, slug: en, updated: slugs.enUpdated },
      ...(fr ? [{ locale: "fr" as const, slug: fr, updated: slugs.frUpdated ?? slugs.enUpdated }] : []),
    ];

    for (const { locale, slug, updated } of locales) {
      if (!slug) continue;

      const url = `${SITE_URL}/${locale}/article/${slug}`;
      const alternates: string[] = [];

      // Build hreflang alternates for all available translations
      if (en) {
        alternates.push(`      <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${SITE_URL}/en/article/${en}`)}"/>`);
      }
      if (fr) {
        alternates.push(`      <xhtml:link rel="alternate" hreflang="fr" href="${escapeXml(`${SITE_URL}/fr/article/${fr}`)}"/>`);
      }

      const xDefaultHref = escapeXml(`${SITE_URL}/en/article/${en ?? slug}`);

      xml += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(updated.slice(0, 10))}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates.join("\n")}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xDefaultHref}"/>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
