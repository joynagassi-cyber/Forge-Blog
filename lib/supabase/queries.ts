/**
 * Supabase query helpers for Forge-Blog (section 11 / 14.3).
 * All reads are RLS-protected — anon sees published only (section 14.5).
 * Returns null when Supabase is not configured (no env vars set).
 */

import type { ArticleContent } from "@/lib/blocks/types";
import type { Locale } from "@/lib/locale/resolve";
import { createClient } from "./server";

// ---------------------------------------------------------------------------
// Article score shape
// ---------------------------------------------------------------------------

export type ArticleScoreRow = {
  id: string;
  article_id: string;
  dimension: string;
  score: number;
  reasoning: string;
  top_fixes: string[];
  computed_at: string;
  audit_run_id: string;
};

export type ArticleScoreSummary = {
  article_id: string;
  audit_run_id: string;
  computed_at: string;
  scores: Record<string, number>;
  average: number;
};

// ---------------------------------------------------------------------------
// Shared article shape returned to the rest of the app
// ---------------------------------------------------------------------------

export type ArticleRow = {
  id: string;
  slug: string;
  locale: Locale;
  translation_group_id: string;
  working_title: string;
  title: string | null;
  dek: string | null;
  excerpt: string | null;
  content: ArticleContent;
  status: string;
  pillar_slug: string | null;
  author_name: string | null;
  author_bio: string | null;
  read_time_minutes: number;
  published_at: string | null;
  last_updated_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  scheduled_at: string | null;
  seo_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  robots: string | null;
  featured?: boolean;
};

/** Raw row from Supabase — after normalization. No joins. */
type RawArticle = Record<string, unknown> & {
  id: string;
  slug: string;
  locale: string;
  translation_group_id: string;
  working_title: string;
  title?: string | null;
  dek?: string | null;
  excerpt?: string | null;
  content?: unknown;
  status?: string;
  read_time_minutes?: number;
  published_at?: string | null;
  last_updated_at?: string | null;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  scheduled_at?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  canonical_url?: string | null;
  robots?: string | null;
};

// SELECT columns — NO joins (joins cause "multiple relationships" errors)
const SELECT = `
  id, slug, locale, translation_group_id, working_title, title, dek, excerpt,
  content, status, read_time_minutes, published_at, last_updated_at,
  cover_image_url, cover_image_alt, scheduled_at,
  seo_title, meta_description, canonical_url, robots
` as const;

function normalize(raw: RawArticle, pillarSlug: string | null = null, authorName: string | null = null, authorBio: string | null = null, featured = false): ArticleRow {
  return {
    id: raw.id,
    slug: raw.slug,
    locale: raw.locale as Locale,
    translation_group_id: raw.translation_group_id,
    working_title: raw.working_title,
    title: raw.title ?? null,
    dek: raw.dek ?? null,
    excerpt: raw.excerpt ?? null,
    content: (raw.content as ArticleContent) ?? { version: 1, sequence: [] },
    status: raw.status ?? "idea",
    pillar_slug: pillarSlug,
    author_name: authorName ?? "Forge Editorial",
    author_bio: authorBio ?? "",
    read_time_minutes: raw.read_time_minutes ?? 0,
    published_at: raw.published_at ?? null,
    last_updated_at: raw.last_updated_at ?? null,
    cover_image_url: raw.cover_image_url ?? null,
    cover_image_alt: raw.cover_image_alt ?? null,
    scheduled_at: raw.scheduled_at ?? null,
    seo_title: raw.seo_title ?? null,
    meta_description: raw.meta_description ?? null,
    canonical_url: raw.canonical_url ?? null,
    robots: raw.robots ?? null,
    featured,
  };
}

// ---------------------------------------------------------------------------
// Public queries (anon — published only via RLS)
// ---------------------------------------------------------------------------

export async function getPublishedArticles(locale: Locale): Promise<ArticleRow[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[supabase] getPublishedArticles:", error.message);
    return null;
  }

  if (!data || data.length === 0) return [];

  // Fetch pillar and profile info in separate calls to avoid join ambiguity
  const pillarMap: Record<string, { slug: string }> = {};
  const profileMap: Record<string, { display_name: string | null; bio: string | null }> = {};

  // Fetch all unique pillar slugs in one query
  const { data: pillars } = await supabase.from("article_pillars").select("article_id, pillars(slug)").in("article_id", data.map((r) => r.id)).maybeSingle() ?? { data: null };

  // Fetch all authors
  const { data: authors } = await supabase.from("profiles").select("id, display_name, bio").in("id", (data as any[]).map((r) => r.author_id ?? r.id)) ?? { data: null };

  if (pillars) {
    const p = pillars as Record<string, unknown> & { pillars?: { slug: string } };
    pillarMap[data[0].id] = p.pillars ? (Array.isArray(p.pillars) ? p.pillars[0] : p.pillars) : { slug: "" };
  }
  if (authors) {
    (authors as any[]).forEach(a => { profileMap[a.id] = { display_name: a.display_name ?? "Forge Editorial", bio: a.bio ?? "" }; });
  }

  return (data as any[]).map((r, i) => normalize(r, pillarMap[r.id]?.slug ?? null, profileMap[r.id]?.display_name ?? null, profileMap[r.id]?.bio ?? null, i === 0));
}
