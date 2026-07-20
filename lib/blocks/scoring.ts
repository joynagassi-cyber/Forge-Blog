/**
 * Shared article scoring logic for SEO/AEO/GEO content health.
 * Used by both the admin overview dashboard and the per-article editor page.
 */

import type { ArticleContent } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArticleForScoring = {
  id: string;
  title: string;
  locale: string;
  status: string;
  content: ArticleContent;
  pillar_slug: string;
  published_at?: string | null;
};

export type ScoreMap = Record<string, number>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DIMENSION_ORDER = [
  "seo_readiness",
  "aeo_readiness",
  "geo_readiness",
  "editorial_quality",
  "readability",
  "search_intent_alignment",
  "accessibility",
  "internal_linking",
  "factual_confidence",
  "source_quality",
  "freshness",
  "conversion_readiness",
] as const;

export type ScoreDimension = (typeof DIMENSION_ORDER)[number];

export const DIMENSION_LABELS: Record<string, string> = {
  editorial_quality: "Editorial Quality",
  factual_confidence: "Factual Confidence",
  search_intent_alignment: "Search Intent",
  seo_readiness: "SEO Readiness",
  aeo_readiness: "AEO Readiness",
  geo_readiness: "GEO Readiness",
  accessibility: "Accessibility",
  readability: "Readability",
  internal_linking: "Internal Links",
  source_quality: "Source Quality",
  freshness: "Freshness",
  conversion_readiness: "Conversion",
};

export const DIMENSION_GROUP: Record<string, string> = {
  seo_readiness: "SEO",
  aeo_readiness: "AEO",
  geo_readiness: "GEO",
  editorial_quality: "Editorial",
  factual_confidence: "Editorial",
  search_intent_alignment: "SEO",
  accessibility: "Quality",
  readability: "Quality",
  internal_linking: "SEO",
  source_quality: "Editorial",
  freshness: "Quality",
  conversion_readiness: "Conversion",
};

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------

export function scoreBarColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

export function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

// ---------------------------------------------------------------------------
// Synthetic scoring
// ---------------------------------------------------------------------------

/** Compute a synthetic score (0–100) from article content and metadata. */
export function computeSyntheticScore(dimension: string, article: ArticleForScoring): number {
  const seq = article.content?.sequence ?? [];
  const bodyEntry = seq.find((b) => b.type === "body_blocks");
  const blocks = (bodyEntry && bodyEntry.type === "body_blocks" ? bodyEntry.blocks : []) || [];
  const hero = seq.find((b) => b.type === "hero_meta");
  const heroMeta = hero && hero.type === "hero_meta" ? hero : null;

  const h2Count = blocks.filter((b) => b.type === "h2").length;
  const h3Count = blocks.filter((b) => b.type === "h3").length;
  const paraCount = blocks.filter((b) => b.type === "paragraph").length;
  const imageCount = blocks.filter((b) => b.type === "image").length;
  const tableCount = blocks.filter((b) => b.type === "table").length;
  const codeCount = blocks.filter((b) => b.type === "code").length;
  const quoteCount = blocks.filter((b) => b.type === "quote").length;
  const calloutCount = blocks.filter((b) => b.type === "callout").length;
  const totalBlocks = blocks.length;

  switch (dimension) {
    case "seo_readiness": {
      let s = 30;
      if (heroMeta?.title) s += 15;
      if (article.published_at) s += 10;
      if (h2Count >= 3) s += 15;
      if (h3Count >= 2) s += 10;
      if (imageCount > 0) s += 10;
      if (heroMeta?.dek) s += 10;
      return Math.min(100, s);
    }
    case "aeo_readiness": {
      let s = 25;
      if (h2Count >= 2) s += 10;
      if (calloutCount > 0) s += 15;
      if (imageCount > 0) s += 10;
      if (tableCount > 0) s += 10;
      if (paraCount >= 5) s += 10;
      if (quoteCount > 0) s += 10;
      if (totalBlocks >= 10) s += 10;
      return Math.min(100, s);
    }
    case "geo_readiness": {
      let s = 20;
      if (calloutCount > 0) s += 15;
      if (tableCount > 0) s += 15;
      if (h2Count >= 2) s += 10;
      if (heroMeta?.dek) s += 10;
      if (codeCount > 0) s += 10;
      if (totalBlocks >= 8) s += 10;
      if (imageCount > 0) s += 10;
      return Math.min(100, s);
    }
    case "editorial_quality": {
      let s = 40;
      if (h2Count >= 2) s += 10;
      if (h3Count >= 1) s += 5;
      if (quoteCount > 0) s += 10;
      if (calloutCount > 0) s += 10;
      if (tableCount > 0) s += 5;
      if (totalBlocks >= 5) s += 10;
      if (imageCount > 0) s += 5;
      if (codeCount > 0) s += 5;
      return Math.min(100, s);
    }
    case "readability": {
      let s = 50;
      if (h2Count >= 2) s += 10;
      if (h3Count >= 1) s += 5;
      if (paraCount >= 3) s += 10;
      if (calloutCount > 0) s += 5;
      if (tableCount > 0) s += 5;
      if (totalBlocks >= 5) s += 10;
      if (codeCount <= 3) s += 5;
      return Math.min(100, s);
    }
    case "search_intent_alignment": {
      let s = 30;
      if (heroMeta?.title && heroMeta?.dek) s += 15;
      if (h2Count >= 2) s += 15;
      if (tableCount > 0) s += 10;
      if (imageCount > 0) s += 10;
      if (calloutCount > 0) s += 10;
      if (paraCount >= 4) s += 10;
      return Math.min(100, s);
    }
    case "accessibility": {
      let s = 40;
      const imagesWithAlt = blocks.filter((b) => b.type === "image" && (b as any).alt);
      if (imagesWithAlt.length === imageCount && imageCount > 0) s += 20;
      else if (imageCount > 0) s += 5;
      if (h2Count + h3Count >= 3) s += 15;
      if (codeCount > 0) s += 5;
      if (tableCount > 0 && tableCount <= 2) s += 10;
      if (totalBlocks >= 5) s += 10;
      return Math.min(100, s);
    }
    case "internal_linking": {
      const bookmarkCount = blocks.filter((b) => b.type === "bookmark").length;
      let s = 20;
      if (bookmarkCount > 0) s += 25;
      if (calloutCount > 0) s += 10;
      if (h2Count >= 3) s += 15;
      if (totalBlocks >= 8) s += 10;
      if (imageCount > 0) s += 10;
      if (tableCount > 0) s += 10;
      return Math.min(100, s);
    }
    case "factual_confidence": {
      let s = 50;
      const verifyCallouts = blocks.filter((b) => b.type === "callout" && (b as any).variant === "verify");
      if (verifyCallouts.length > 0) s += 20;
      if (quoteCount > 0) s += 10;
      if (tableCount > 0) s += 10;
      if (totalBlocks >= 5) s += 10;
      return Math.min(100, s);
    }
    case "source_quality": {
      let s = 30;
      if (calloutCount > 0) s += 15;
      if (quoteCount > 0) s += 10;
      if (tableCount > 0) s += 10;
      if (codeCount > 0) s += 10;
      if (h2Count >= 2) s += 10;
      if (totalBlocks >= 5) s += 5;
      if (heroMeta?.authorBio) s += 10;
      return Math.min(100, s);
    }
    case "freshness": {
      if (!article.published_at) return 30;
      const days = (Date.now() - new Date(article.published_at).getTime()) / 86400000;
      if (days < 30) return 95;
      if (days < 90) return 80;
      if (days < 180) return 65;
      if (days < 365) return 50;
      return 30;
    }
    case "conversion_readiness": {
      const convBlock = seq.find((b) => b.type === "conversion_block");
      const bridgeBlocks = blocks.filter((b) => b.type === "product_bridge_inline");
      let s = 20;
      if (convBlock && convBlock.type === "conversion_block" && convBlock.ctaLabel) s += 20;
      if (bridgeBlocks.length > 0) s += 15;
      if (totalBlocks >= 5) s += 10;
      if (heroMeta?.title) s += 10;
      if (h2Count >= 2) s += 10;
      if (imageCount > 0) s += 10;
      if (calloutCount > 0) s += 5;
      return Math.min(100, s);
    }
    default:
      return 50;
  }
}

/** Compute synthetic scores for a single article across all dimensions. */
export function computeArticleScores(article: ArticleForScoring): {
  scores: ScoreMap;
  average: number;
} {
  const scores: ScoreMap = {};
  let total = 0;
  for (const dim of DIMENSION_ORDER) {
    const s = computeSyntheticScore(dim, article);
    scores[dim] = s;
    total += s;
  }
  return { scores, average: Math.round(total / DIMENSION_ORDER.length) };
}

/** Compute aggregate synthetic scores across multiple articles. */
export function computeAggregateScores(articles: ArticleForScoring[]): ScoreMap {
  const averages: Record<string, number[]> = {};
  for (const dim of DIMENSION_ORDER) {
    averages[dim] = [];
  }
  for (const article of articles) {
    const { scores } = computeArticleScores(article);
    for (const dim of DIMENSION_ORDER) {
      averages[dim].push(scores[dim]);
    }
  }
  const result: ScoreMap = {};
  for (const dim of DIMENSION_ORDER) {
    const vals = averages[dim];
    result[dim] = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  }
  return result;
}
