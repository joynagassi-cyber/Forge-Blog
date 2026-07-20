/**
 * GET /api/rss?locale=en
 * Returns an RSS 2.0 feed of published articles.
 */

import { fromArticleRow, type PublicArticle } from "@/lib/content/public-article";
import type { Locale } from "@/lib/locale/resolve";
import { getPublishedArticles } from "@/lib/supabase/queries";
import { NextRequest } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

async function fetchArticles(locale: Locale): Promise<PublicArticle[]> {
  const live = await getPublishedArticles(locale);
  if (live && live.length > 0) {
    return live.map(fromArticleRow);
  }
  return [];
}

function escapeCdata(s: string): string {
  return s.replace(/\]\]>/g, "]]]]><![CDATA[");
}

export async function GET(req: NextRequest) {
  const localeRaw = req.nextUrl.searchParams.get("locale") ?? "en";
  const locale = (localeRaw === "fr" ? "fr" : "en") as Locale;
  const title = "Forge-Blog — Articles";
  const desc = locale === "fr"
    ? "Articles sur les sciences cognitives et l'apprentissage"
    : "Articles on cognitive science and learning";

  const articles = await fetchArticles(locale);

  const items = articles.map((a) => `
  <item>
    <title><![CDATA[${escapeCdata(a.title)}]]></title>
    <link>${SITE_URL}/${locale}/article/${a.slug}</link>
    <guid isPermaLink="true">${SITE_URL}/${locale}/article/${a.slug}</guid>
    <description><![CDATA[${escapeCdata(a.excerpt || a.dek)}]]></description>
    <author>${a.author}</author>
    <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
    <category>${a.pillar_slug}</category>
    ${a.cover_image_url ? `<enclosure url="${a.cover_image_url}" type="image/jpeg" length="0" />` : ""}
  </item>`).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${title}</title>
    <link>${SITE_URL}/${locale}</link>
    <description>${desc}</description>
    <language>${locale}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss?locale=${locale}" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
