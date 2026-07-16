"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

type Props = {
  slug: string;
  locale: string;
  pillar: string;
  title: string;
  readTimeMinutes: number;
};

export function ArticleViewTracker({ slug, locale, pillar, title, readTimeMinutes }: Props) {
  useEffect(() => {
    posthog.capture("article_viewed", {
      article_slug: slug,
      article_title: title,
      locale,
      pillar,
      read_time_minutes: readTimeMinutes,
    });
  }, [slug, locale, pillar, title, readTimeMinutes]);

  return null;
}
