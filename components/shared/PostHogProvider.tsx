"use client";

/**
 * PostHog analytics provider (section 14.1).
 * Loads PostHog JS from CDN — no npm package required.
 *
 * Tracks: pageview, scroll depth, CTA clicks, article reads,
 * pillar browse, search, A/B test exposure.
 *
 * Required env var: NEXT_PUBLIC_POSTHOG_KEY
 * Optional: NEXT_PUBLIC_POSTHOG_HOST (defaults to https://app.posthog.com)
 */

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    posthog?: PostHogInstance;
  }
}

export interface PostHogInstance {
  init: (key: string, options: Record<string, unknown>) => void;
  capture: (event: string, props?: Record<string, unknown>) => void;
  identify: (id: string, props?: Record<string, unknown>) => void;
  reset: (resetDeviceId?: boolean) => void;
  get_distinct_id: () => string;
  people: { set: (props: Record<string, unknown>) => void };
  featureFlags: {
    reload: () => void;
    isFeatureEnabled: (key: string) => boolean;
    getFeatureFlag: (key: string) => string | boolean | undefined;
    getFeatureFlagPayload: (key: string) => unknown;
  };
  onFeatureFlags: (callback: (flags: string[]) => void) => void;
}

export type CtaProduct = "nainoforge" | "scyforge";

export type PostHogUserProps = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  company?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function PostHogProvider() {
  const readyRef = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY || window.posthog) return;

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.src = `${POSTHOG_HOST}/static/array.js`;
    script.onload = () => {
      window.posthog?.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true, // automatic pageview capture (standard)
        capture_pageleave: false,
        autocapture: false, // manual events only per §14.1
        persistence: "localStorage+cookie",
        rageclick: false,
        // A/B testing support
        loaded: () => {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[posthog] loaded");
          }
          readyRef.current = true;
        },
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup not possible with external script
    };
  }, []);

  return null;
}

// ---------------------------------------------------------------------------
// Identify user (call after login/auth state is known)
// ---------------------------------------------------------------------------

export function identifyPostHogUser(props: PostHogUserProps) {
  if (!window.posthog) return;

  window.posthog.identify(props.id, {
    email: props.email,
    name: props.name,
    role: props.role,
    company: props.company,
  });

  if (props.company) {
    // Group analytics — useful for org-level dashboards
    window.posthog.capture("$groupidentify", {
      group_type: "company",
      group_key: props.company,
      properties: { name: props.company },
    });
  }
}

// ---------------------------------------------------------------------------
// Reset identity (call on logout)
// ---------------------------------------------------------------------------

export function resetPostHogUser(resetDeviceId = false) {
  window.posthog?.reset(resetDeviceId);
}

// ---------------------------------------------------------------------------
// Page view (call on route change — handles locale context)
// ---------------------------------------------------------------------------

export function capturePageView(props?: {
  path?: string;
  locale?: string;
  title?: string;
}) {
  window.posthog?.capture("$pageview", {
    path: props?.path ?? window.location.pathname,
    locale: props?.locale,
    title: props?.title,
    url: window.location.href,
    ...props,
  });
}

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

/** CTA click (conversion tracking for nainoforge / scyforge) */
export function captureCtaClick(
  product: CtaProduct,
  props?: {
    article_slug?: string;
    article_locale?: string;
    cta_label?: string;
    href?: string;
    pillar_slug?: string;
    variant?: string; // A/B test variant
  },
) {
  const event =
    product === "nainoforge" ? "nainoforge_cta_click" : "scyforge_cta_click";

  window.posthog?.capture(event, {
    product,
    ...props,
    timestamp: new Date().toISOString(),
  });
}

/** Article read complete (triggered when user reaches the end) */
export function captureArticleReadComplete(props: {
  article_slug: string;
  article_locale: string;
  article_title?: string;
  pillar_slug?: string;
  read_time_minutes?: number;
  scroll_depth_pct?: number;
}) {
  window.posthog?.capture("article_read_complete", {
    ...props,
    timestamp: new Date().toISOString(),
  });
}

/** Scroll depth milestones */
export function captureScrollDepth(props: {
  article_slug?: string;
  depth_pct: number;
  path: string;
}) {
  window.posthog?.capture("scroll_depth", props);
}

/** Pillar browse (user viewed articles in a pillar) */
export function capturePillarBrowse(props: {
  pillar_slug: string;
  pillar_name?: string;
  locale?: string;
}) {
  window.posthog?.capture("pillar_browse", props);
}

/** Search (full-text search query) */
export function captureSearch(props: {
  query: string;
  results_count?: number;
  locale?: string;
}) {
  window.posthog?.capture("search", props);
}

/** A/B test exposure — call when a variant is shown */
export function captureExperimentExposure(props: {
  experiment_key: string;
  variant: string;
  article_slug?: string;
}) {
  window.posthog?.capture("$experiment_started", {
    experiment_key: props.experiment_key,
    variant: props.variant,
    article_slug: props.article_slug,
  });
}

// ---------------------------------------------------------------------------
// Scroll Depth Tracker — renders nothing, tracks scroll on mount
// ---------------------------------------------------------------------------

type ScrollTrackerProps = {
  articleSlug?: string;
  /** Minimum interval between scroll events (ms) */
  throttleMs?: number;
};

export function ScrollDepthTracker({
  articleSlug,
  throttleMs = 1000,
}: ScrollTrackerProps) {
  const lastSent = useRef<number>(0);
  const maxDepthSent = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const depth = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (depth <= maxDepthSent.current) return;

      const now = Date.now();
      if (now - lastSent.current < throttleMs) return;

      // Track milestones: 25%, 50%, 75%, 90%, 100%
      const milestones = [25, 50, 75, 90, 100];
      const hit = milestones.find((m) => depth >= m && maxDepthSent.current < m);
      if (!hit) return;

      lastSent.current = now;
      maxDepthSent.current = hit;

      captureScrollDepth({
        article_slug: articleSlug,
        depth_pct: hit,
        path: window.location.pathname,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [articleSlug, throttleMs]);

  return null;
}

// ---------------------------------------------------------------------------
// Read Completion Tracker — detects when reader reaches the article footer
// ---------------------------------------------------------------------------

type ReadCompletionTrackerProps = {
  articleSlug: string;
  articleLocale: string;
  articleTitle?: string;
  pillarSlug?: string;
  readTimeMinutes?: number;
  /** CSS selector for the element that marks article end */
  endMarkerSelector?: string;
};

export function ReadCompletionTracker({
  articleSlug,
  articleLocale,
  articleTitle,
  pillarSlug,
  readTimeMinutes,
  endMarkerSelector = "[data-article-end]",
}: ReadCompletionTrackerProps) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;

    const endMarker = document.querySelector(endMarkerSelector);
    if (!endMarker) {
      // Fallback: track when user scrolls to 90% of page
      const onScroll = () => {
        const scrollTop = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        if (scrollTop / docHeight >= 0.9 && !sentRef.current) {
          sentRef.current = true;
          captureArticleReadComplete({
            article_slug: articleSlug,
            article_locale: articleLocale,
            article_title: articleTitle,
            pillar_slug: pillarSlug,
            read_time_minutes: readTimeMinutes,
            scroll_depth_pct: 90,
          });
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !sentRef.current) {
          sentRef.current = true;
          captureArticleReadComplete({
            article_slug: articleSlug,
            article_locale: articleLocale,
            article_title: articleTitle,
            pillar_slug: pillarSlug,
            read_time_minutes: readTimeMinutes,
          });
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(endMarker);
    return () => observer.disconnect();
  }, [
    articleSlug,
    articleLocale,
    articleTitle,
    pillarSlug,
    readTimeMinutes,
    endMarkerSelector,
  ]);

  return null;
}

// ---------------------------------------------------------------------------
// A/B test variant resolver — deterministic from article id
// ---------------------------------------------------------------------------

export type AbTestKey =
  | "cta_headline"
  | "cta_color"
  | "article_layout"
  | "header_style";

type VariantMap = Record<string, string>;

/**
 * Deterministic A/B test variant assignment based on article id.
 * Ensures the same article always gets the same variant for a given test.
 */
const TEST_VARIANTS: Record<AbTestKey, VariantMap> = {
  cta_headline: {
    control: "Default headline",
    variant_a: "Benefit-driven headline",
    variant_b: "Question headline",
    variant_c: "Urgency headline",
  },
  cta_color: {
    control: "Violet (default)",
    variant_a: "Accent border",
    variant_b: "Ghost style",
  },
  article_layout: {
    control: "Standard (1 col)",
    variant_a: "Wide body",
    variant_b: "Side note column",
  },
  header_style: {
    control: "Standard header",
    variant_a: "Minimal header",
  },
};

export function getAbTestVariant(
  testKey: AbTestKey,
  articleId: string,
): string {
  const variants = Object.keys(TEST_VARIANTS[testKey] ?? { control: "control" });
  if (variants.length <= 1) return "control";

  // Deterministic hash from articleId
  let hash = 0;
  for (let i = 0; i < articleId.length; i++) {
    hash = (hash * 31 + articleId.charCodeAt(i)) & 0xffff;
  }

  const idx = Math.abs(hash) % variants.length;
  return variants[idx];
}

/** Check if a specific variant is active for a test */
export function isAbVariant(
  testKey: AbTestKey,
  variant: string,
  articleId: string,
): boolean {
  return getAbTestVariant(testKey, articleId) === variant;
}

// ---------------------------------------------------------------------------
// Group analytics
// ---------------------------------------------------------------------------

export function captureGroupEvent(
  groupType: string,
  groupKey: string,
  props?: Record<string, unknown>,
) {
  window.posthog?.capture("$groupidentify", {
    group_type: groupType,
    group_key: groupKey,
    properties: props,
  });
}
