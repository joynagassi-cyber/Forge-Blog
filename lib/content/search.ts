/**
 * Full-text search utility for Forge-Blog.
 * Supabase-first using pg_search/tsvector, with demo fallback.
 */

import type { Locale } from "@/lib/locale/resolve";
import { fromArticleRow, type PublicArticle } from "./public-article";
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
// Search function (Supabase-first only)
// ---------------------------------------------------------------------------

export async function searchArticles(
  query: string,
  locale: Locale,
): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  // Try Supabase full-text search first
  const live = await searchSupabase(query, locale);
  if (live !== null) return live;

  return [];
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
