"use client";

/**
 * PostHog analytics provider (section 14.1).
 * Loads the PostHog JS snippet from CDN — no npm package required.
 * Tracks: pageview, nainoforge_cta_click, scyforge_cta_click, article_read_complete.
 *
 * Required env var: NEXT_PUBLIC_POSTHOG_KEY
 * Optional: NEXT_PUBLIC_POSTHOG_HOST (defaults to https://app.posthog.com)
 */

import { useEffect } from "react";

declare global {
  interface Window {
    posthog?: {
      init: (key: string, options: Record<string, unknown>) => void;
      capture: (event: string, props?: Record<string, unknown>) => void;
      identify: (id: string, props?: Record<string, unknown>) => void;
      reset: () => void;
    };
  }
}

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export function PostHogProvider() {
  useEffect(() => {
    if (!POSTHOG_KEY || window.posthog) return;

    // Minimal PostHog snippet — loads the full library async
    // (same approach as the official Next.js + PostHog docs)
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.posthog?.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: true,
        capture_pageleave: false,
        autocapture: false, // manual events only per §14.1
        persistence: "localStorage+cookie",
        loaded: (ph: typeof window.posthog) => {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[posthog] loaded in dev — events will be captured");
          }
          void ph;
        },
      });
    };
    script.src = `${POSTHOG_HOST}/static/array.js`;
    document.head.appendChild(script);
  }, []);

  return null;
}

// ---------------------------------------------------------------------------
// Typed event helpers — use these everywhere, never call posthog.capture raw
// ---------------------------------------------------------------------------

export type CtaProduct = "nainoforge" | "scyforge";

export function captureCtaClick(product: CtaProduct, props?: {
  article_slug?: string;
  article_locale?: string;
  cta_label?: string;
  href?: string;
}) {
  const event = product === "nainoforge"
    ? "nainoforge_cta_click"
    : "scyforge_cta_click";

  window.posthog?.capture(event, {
    product,
    ...props,
  });
}

export function captureArticleReadComplete(props: {
  article_slug: string;
  article_locale: string;
  article_title?: string;
  pillar_slug?: string;
  read_time_minutes?: number;
}) {
  window.posthog?.capture("article_read_complete", props);
}

export function capturePageView(props?: {
  path?: string;
  locale?: string;
}) {
  window.posthog?.capture("$pageview", props);
}
