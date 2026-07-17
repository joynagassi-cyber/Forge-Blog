/**
 * Unified public-facing article shape.
 * Both Supabase (ArticleRow) and demo data (DemoArticle) are normalized here
 * so page components never reference the data source directly.
 */

import type { ArticleContent } from "@/lib/blocks/types";
import type { Locale } from "@/lib/locale/resolve";
import type { ArticleRow } from "@/lib/supabase/queries";
import type { DemoArticle } from "./demo-articles";

export type PublicArticle = {
  id: string;
  slug: string;
  locale: Locale;
  translation_group_id: string;
  title: string;
  dek: string;
  excerpt: string;
  pillar_slug: string;
  author: string;
  author_bio: string;
  published_at: string;
  updated_at: string | null;
  read_time_minutes: number;
  /** CSS gradient string used as cover placeholder when no cover_image_url. */
  cover_gradient: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  featured: boolean;
  content: ArticleContent;
};

// Stable gradient palette for articles that have no cover image
const GRADIENTS = [
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #2d3a4a 100%)",
  "linear-gradient(135deg, #1c1c2e 0%, #2d2d44 50%, #1a1a30 100%)",
  "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #2e1a0a 100%)",
  "linear-gradient(135deg, #0d2137 0%, #0f3d2b 50%, #1a3d2b 100%)",
];

function deterministicGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
  }
  return GRADIENTS[h % GRADIENTS.length];
}

export function fromDemoArticle(a: DemoArticle): PublicArticle {
  return {
    id: a.id,
    slug: a.slug,
    locale: a.locale,
    translation_group_id: a.translation_group_id,
    title: a.title,
    dek: a.dek,
    excerpt: a.excerpt,
    pillar_slug: a.pillar_slug,
    author: a.author,
    author_bio: a.author_bio,
    published_at: a.published_at,
    updated_at: a.updated_at ?? null,
    read_time_minutes: a.read_time_minutes,
    cover_gradient: a.cover_gradient,
    cover_image_url: null,
    cover_image_alt: null,
    featured: a.featured ?? false,
    content: a.content,
  };
}

export function fromArticleRow(row: ArticleRow): PublicArticle {
  const hero = row.content?.sequence?.find((b) => b.type === "hero_meta");
  const dek =
    row.dek ??
    (hero && hero.type === "hero_meta" ? hero.dek : "") ??
    "";

  return {
    id: row.id,
    slug: row.slug,
    locale: row.locale,
    translation_group_id: row.translation_group_id,
    title: row.title ?? row.working_title,
    dek,
    excerpt: row.excerpt ?? dek.slice(0, 160),
    pillar_slug: row.pillar_slug ?? "",
    author: row.author_name ?? "Forge Editorial",
    author_bio: row.author_bio ?? "",
    published_at: row.published_at ?? new Date().toISOString(),
    updated_at: row.last_updated_at ?? null,
    read_time_minutes: row.read_time_minutes,
    cover_gradient: row.cover_image_url
      ? ""
      : deterministicGradient(row.slug),
    cover_image_url: row.cover_image_url,
    cover_image_alt: row.cover_image_alt,
    featured: row.featured ?? false,
    content: row.content,
  };
}
