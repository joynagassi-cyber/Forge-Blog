"use client";

import posthog from "posthog-js";
import { Button } from "@/components/shared/Button";

type Props = {
  href: string;
  label: string;
  product: string;
  articleSlug: string;
  locale: string;
};

export function ConversionCtaButton({ href, label, product, articleSlug, locale }: Props) {
  function handleClick() {
    posthog.capture("article_cta_clicked", {
      product,
      article_slug: articleSlug,
      locale,
      cta_label: label,
      cta_href: href,
    });
  }

  return (
    <Button href={href} shimmer size="lg" onClick={handleClick}>
      {label}
    </Button>
  );
}
