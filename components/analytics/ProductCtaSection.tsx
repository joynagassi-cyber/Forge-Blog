"use client";

import posthog from "posthog-js";
import { Button } from "@/components/shared/Button";

type Cta = {
  href: string;
  label: string;
  product: string;
  variant?: "primary" | "secondary";
  shimmer?: boolean;
};

type Props = {
  ctas: Cta[];
};

export function ProductCtaSection({ ctas }: Props) {
  function handleClick(product: string, href: string, label: string) {
    posthog.capture("product_cta_clicked", {
      product,
      cta_href: href,
      cta_label: label,
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ctas.map(({ href, label, product, variant = "primary", shimmer = false }) => (
        <Button
          key={product}
          href={href}
          variant={variant}
          shimmer={shimmer}
          onClick={() => handleClick(product, href, label)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
