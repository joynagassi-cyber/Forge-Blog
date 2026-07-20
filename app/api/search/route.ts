/**
 * GET /api/search?q=...&locale=en
 * Full-text search API that returns matching published articles.
 */

import { searchArticles } from "@/lib/content/search";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/locale/resolve";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const localeRaw = req.nextUrl.searchParams.get("locale") ?? "en";

  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }

  if (!(SUPPORTED_LOCALES as readonly string[]).includes(localeRaw)) {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const locale = localeRaw as Locale;

  try {
    const results = await searchArticles(q, locale);
    return NextResponse.json({
      query: q,
      locale,
      count: results.length,
      results: results.map((r) => ({
        slug: r.article.slug,
        title: r.article.title,
        excerpt: r.article.excerpt,
        snippet: r.snippet,
        matchField: r.matchField,
        published_at: r.article.published_at,
        read_time_minutes: r.article.read_time_minutes,
        pillar_slug: r.article.pillar_slug,
        cover_image_url: r.article.cover_image_url,
      })),
    });
  } catch (err) {
    console.error("[search] Error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
