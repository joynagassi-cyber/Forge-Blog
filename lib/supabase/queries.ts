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

/** One row from the article_scores table — single dimension result. */
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

/**
 * Grouped scores: the latest full audit for each article,
 * keyed by article_id with all dimension scores in a map.
 */
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
  // ponytail: featured column not yet in DB; default to false until migration lands
  featured?: boolean;
};

// Supabase join shape — pillar/profile are joined; Supabase may return
// either a single object or an array depending on join multiplicity.
// ponytail: cast to unknown first to satisfy strict TypeScript without
// hand-rolling every column type.
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
  pillars?: { slug: string } | { slug: string }[] | null;
  profiles?: { display_name: string | null; bio: string | null } | { display_name: string | null; bio: string | null }[] | null;
};

const SELECT = `
  id, slug, locale, translation_group_id, working_title, title, dek, excerpt,
  content, status, read_time_minutes, published_at, last_updated_at,
  cover_image_url, cover_image_alt, scheduled_at,
  seo_title, meta_description, canonical_url, robots,
  pillars ( slug ),
  profiles ( display_name, bio )
` as const;

function normalize(raw: RawArticle, featured = false): ArticleRow {
  const pillars = Array.isArray(raw.pillars) ? raw.pillars[0] : raw.pillars;
  const profiles = Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles;
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
    pillar_slug: pillars?.slug ?? null,
    author_name: profiles?.display_name ?? null,
    author_bio: profiles?.bio ?? null,
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

/** Fetch all published articles for a locale, ordered by published_at desc. */
export async function getPublishedArticles(
  locale: Locale
): Promise<ArticleRow[] | null> {
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

  return (data as unknown as RawArticle[]).map((r, i) => normalize(r, i === 0));
}

/** Fetch a single published article by locale + slug. */
export async function getPublishedArticle(
  locale: Locale,
  slug: string
): Promise<ArticleRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      // PGRST116 = no row found (expected for 404)
      console.error("[supabase] getPublishedArticle:", error.message);
    }
    return null;
  }

  return normalize(data as unknown as RawArticle);
}

/**
 * Fetch the translation counterpart for an article.
 * Returns null when no counterpart exists (section 8.4).
 */
export async function getTranslationCounterpart(
  translationGroupId: string,
  targetLocale: Locale
): Promise<ArticleRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("translation_group_id", translationGroupId)
    .eq("locale", targetLocale)
    .eq("status", "published")
    .single();

  if (error) return null;
  return normalize(data as unknown as RawArticle);
}

/**
 * Fetch related published articles for the same pillar (excluding current).
 * Falls back to any pillar if not enough pillar-matches.
 */
export async function getRelatedArticles(
  currentId: string,
  pillarSlug: string | null,
  locale: Locale,
  limit = 3
): Promise<ArticleRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  // Attempt same-pillar matches first
  if (pillarSlug) {
    const pillarQuery = supabase
      .from("articles")
      .select(`${SELECT}, pillars!inner ( slug )`)
      .eq("locale", locale)
      .eq("status", "published")
      .eq("pillars.slug", pillarSlug)
      .neq("id", currentId)
      .order("published_at", { ascending: false })
      .limit(limit);

    const { data } = await pillarQuery;
    if (data && data.length >= limit) {
      return (data as RawArticle[]).map((r) => normalize(r));
    }
  }

  // Fallback: any published article excluding current
  const { data } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("locale", locale)
    .eq("status", "published")
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(limit);

  return (data as RawArticle[] ?? []).map((r) => normalize(r));
}

// ---------------------------------------------------------------------------
// Admin queries (authenticated — RLS enforces role restrictions)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Article scores (authenticated — RLS gated)
// ---------------------------------------------------------------------------

/** Fetch the latest audit scores for a single article, grouped by dimension. */
export async function getArticleScores(
  articleId: string
): Promise<ArticleScoreSummary | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("article_scores")
    .select("*")
    .eq("article_id", articleId)
    .order("computed_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[supabase] getArticleScores:", error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  const rows = data as unknown as ArticleScoreRow[];
  const latestRun = rows[0].audit_run_id;
  const runRows = rows.filter((r) => r.audit_run_id === latestRun);

  const scores: Record<string, number> = {};
  let total = 0;
  for (const r of runRows) {
    scores[r.dimension] = r.score;
    total += r.score;
  }

  return {
    article_id: articleId,
    audit_run_id: latestRun,
    computed_at: runRows[0].computed_at,
    scores,
    average: runRows.length > 0 ? Math.round(total / runRows.length) : 0,
  };
}

/** Fetch the latest audit scores for ALL articles visible to the user. */
export async function getAllArticleScores(): Promise<
  Map<string, ArticleScoreSummary>
> {
  const supabase = await createClient();
  if (!supabase) return new Map();

  const { data, error } = await supabase
    .from("article_scores")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(1000);

  if (error) {
    console.error("[supabase] getAllArticleScores:", error.message);
    return new Map();
  }

  if (!data || data.length === 0) return new Map();

  const rows = data as unknown as ArticleScoreRow[];

  // Group by article_id, keep only the most recent audit_run per article
  const latestPerArticle = new Map<string, ArticleScoreRow[]>();
  for (const r of rows) {
    const existing = latestPerArticle.get(r.article_id);
    if (!existing) {
      latestPerArticle.set(r.article_id, [r]);
    } else {
      // Only keep rows from the most recent audit run
      const existingRun = existing[0].audit_run_id;
      if (r.audit_run_id === existingRun) {
        existing.push(r);
      }
    }
  }

  const result = new Map<string, ArticleScoreSummary>();
  for (const [articleId, runRows] of latestPerArticle) {
    const scores: Record<string, number> = {};
    let total = 0;
    for (const r of runRows) {
      scores[r.dimension] = r.score;
      total += r.score;
    }
    result.set(articleId, {
      article_id: articleId,
      audit_run_id: runRows[0].audit_run_id,
      computed_at: runRows[0].computed_at,
      scores,
      average: runRows.length > 0 ? Math.round(total / runRows.length) : 0,
    });
  }

  return result;
}

/** Fetch ALL articles visible to the current user (any status, per RLS). */
export async function getAdminArticles(): Promise<ArticleRow[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[supabase] getAdminArticles:", error.message);
    return null;
  }

  return (data as RawArticle[]).map((r) => normalize(r));
}

/** Fetch a single article by id (any status, per RLS). */
export async function getAdminArticle(id: string): Promise<ArticleRow | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("articles")
    .select(SELECT)
    .eq("id", id)
    .single();

  if (error) return null;
  return normalize(data as unknown as RawArticle);
}

/** Fetch the latest revisions for an article. */
export type RevisionRow = {
  id: string;
  article_id: string;
  content: unknown;
  title: string | null;
  status: string | null;
  change_summary: string | null;
  created_at: string;
};

export async function getArticleRevisions(
  articleId: string,
  limit = 20
): Promise<RevisionRow[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("revisions")
    .select("id, article_id, content, title, status, change_summary, created_at")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[supabase] getArticleRevisions:", error.message);
    return null;
  }

  return data as unknown as RevisionRow[];
}

/** Fetch review comments for an article. */
export type ReviewCommentRow = {
  id: string;
  article_id: string;
  author_id: string | null;
  body: string;
  block_id: string | null;
  resolved: boolean;
  created_at: string;
};

export async function getArticleReviewComments(
  articleId: string
): Promise<ReviewCommentRow[] | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("review_comments")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[supabase] getArticleReviewComments:", error.message);
    return null;
  }

  return data as unknown as ReviewCommentRow[];
}

/** Update only the content column for a live article (RLS-gated). */
export async function updateArticleContent(
  id: string,
  content: ArticleContent
): Promise<boolean> {
  const supabase = await createClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from("articles")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[supabase] updateArticleContent:", error.message);
    return false;
  }
  return true;
}
