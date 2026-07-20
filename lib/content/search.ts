/**
 * Full-text search utility for Forge-Blog.
 * Supabase-first using pg_search/tsvector, with demo fallback.
 */

import type { Locale } from "@/lib/locale/resolve";
import { DEMO_ARTICLES } from "./demo-articles";
import { fromArticleRow, fromDemoArticle, type PublicArticle } from "./public-article";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------

export type SearchResult = {
  article: PublicArticle;
  /** Where the query matched: "title" | "excerpt" | "content" */
  matchField: string;
  /** Snippet of surrounding text for display */
  snippet: string;
};

// ---------------------------------------------------------------------------
// Search function (Supabase-first, demo fallback)
// ---------------------------------------------------------------------------

export async function searchArticles(
  query: string,
  locale: Locale,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Try Supabase full-text search first
  const live = await searchSupabase(query, locale);
  if (live !== null) return live;

  // Demo fallback
  return searchDemo(query, locale);
}

// ---------------------------------------------------------------------------
// Supabase full-text search (requires pg_search extension or tsvector column)
// ---------------------------------------------------------------------------

async function searchSupabase(
  query: string,
  locale: Locale,
): Promise<SearchResult[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  // Full-text search using PostgreSQL tsvector via the `content` jsonb column
  // We search across: title, working_title, excerpt, content->sequence blocks
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, slug, locale, translation_group_id, working_title, title, dek, excerpt,
      content, status, read_time_minutes, published_at, last_updated_at,
      cover_image_url, cover_image_alt,
      pillars ( slug ),
      profiles ( display_name, bio )
    `)
    .eq("locale", locale)
    .eq("status", "published")
    .or(
      `title.ilike.%${query}%,` +
      `working_title.ilike.%${query}%,` +
      `excerpt.ilike.%${query}%,` +
      `dek.ilike.%${query}%`
    )
    .order("published_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[search] Supabase error:", error.message);
    return null;
  }

  if (!data || data.length === 0) return [];

  return (data as any[]).map((row) => {
    const article = fromArticleRow({
      ...row,
      author_name: row.profiles?.display_name ?? null,
      author_bio: row.profiles?.bio ?? null,
      pillar_slug: row.pillars?.slug ?? null,
    });

    // Build snippet
    const snippet = buildSnippet(article, query);

    return {
      article,
      matchField: snippet.matchField,
      snippet: snippet.text,
    };
  });
}

// ---------------------------------------------------------------------------
// Demo fallback (client-side filter)
// ---------------------------------------------------------------------------

function searchDemo(query: string, locale: Locale): SearchResult[] {
  const q = query.toLowerCase().trim();
  const results: SearchResult[] = [];

  for (const demo of DEMO_ARTICLES) {
    if (demo.locale !== locale) continue;

    const title = demo.title.toLowerCase();
    const excerpt = demo.excerpt.toLowerCase();
    const contentText = demo.content.sequence
      .filter((b) => b.type === "body_blocks")
      .flatMap((b) => (b.type === "body_blocks" ? b.blocks : []))
      .map((blk) => {
        if ("spans" in blk) return (blk as any).spans?.map((s: any) => s.text).join(" ") ?? "";
        if ("text" in blk) return blk.text ?? "";
        if ("code" in blk) return blk.code ?? "";
        return "";
      })
      .join(" ")
      .toLowerCase();

    const matchTitle = title.includes(q);
    const matchExcerpt = excerpt.includes(q);
    const matchContent = contentText.includes(q);

    if (!matchTitle && !matchExcerpt && !matchContent) continue;

    const matchField = matchTitle ? "title" : matchExcerpt ? "excerpt" : "content";

    // Build snippet
    let snippet = excerpt;
    if (matchField === "content") {
      const idx = contentText.indexOf(q);
      const start = Math.max(0, idx - 60);
      const end = Math.min(contentText.length, idx + q.length + 60);
      snippet = (start > 0 ? "…" : "") + contentText.slice(start, end) + (end < contentText.length ? "…" : "");
    }

    results.push({
      article: fromDemoArticle(demo),
      matchField,
      snippet,
    });
  }

  return results.slice(0, 20);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSnippet(article: any, query: string): { text: string; matchField: string } {
  const q = query.toLowerCase();

  // Check title match first
  if ((article.title ?? "").toLowerCase().includes(q)) {
    return { text: article.excerpt ?? article.dek ?? "", matchField: "title" };
  }

  // Check excerpt
  if ((article.excerpt ?? "").toLowerCase().includes(q)) {
    return { text: article.excerpt, matchField: "excerpt" };
  }

  // Extract content snippet
  const body = article.content?.sequence?.find((b: any) => b.type === "body_blocks");
  if (body) {
    const text = body.blocks
      ?.map((blk: any) => {
        if ("spans" in blk) return blk.spans?.map((s: any) => s.text).join(" ") ?? "";
        if ("text" in blk) return blk.text ?? "";
        return "";
      })
      .join(" ") ?? "";
    const idx = text.toLowerCase().indexOf(q);
    if (idx >= 0) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + q.length + 60);
      const snippet = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
      return { text: snippet, matchField: "content" };
    }
  }

  return { text: article.excerpt ?? "", matchField: "excerpt" };
}

/** Convert a search snippet to HTML with highlighted query terms */
export function highlightSnippet(snippet: string, query: string): string {
  if (!query.trim()) return snippet;
  const escaped = snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return escaped.replace(regex, "<mark class=\"search-highlight\">$1</mark>");
}
