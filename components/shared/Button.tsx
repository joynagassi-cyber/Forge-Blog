"use client";

import { clsx } from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  shimmer?: boolean;
  children: ReactNode;
  className?: string;
};

type Props =
  | (Common &
      ButtonHTMLAttributes<HTMLButtonElement> & {
        href?: undefined;
      })
  | (Common &
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        href: string;
      });

const base =
  "inline-flex items-center justify-center rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:bg-[var(--accent-active)] shadow-sm",
  secondary:
    "bg-[var(--surface-1)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-2)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3.5 text-base gap-2",
};

/**
 * Button — supports both <button> and <a>.
 * When href + onClick are both provided on the anchor variant,
 * the component prevents default navigation, calls the event handler,
 * then navigates after a brief delay to allow async side effects
 * (analytics, PostHog, etc.) to flush.
 */
export function Button({
  variant = "primary",
  size = "md",
  shimmer = false,
  className,
  children,
  ...rest
}: Props) {
  const classes = clsx(
    base,
    variants[variant],
    sizes[size],
    variant === "primary" && shimmer && "btn-shimmer",
    className
  );

  if ("href" in rest && rest.href) {
    const { href, onClick: originalOnClick, ...anchorRest } = rest;

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
      // Let the handler's own preventDefault take priority
      // Respect modifier keys (new tab/window) — never intercept those
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;

      // Call custom onClick first (analytics, etc.)
      originalOnClick?.(e);

      // If the handler called preventDefault, stop
      if (e.defaultPrevented) return;

      // Prevent default navigation and use a small delay to let
      // analytics side effects (PostHog, sendBeacon) flush
      e.preventDefault();
      setTimeout(() => {
        window.location.href = href;
      }, 150);
    };

    return (
      <a href={href} className={classes} onClick={handleClick} {...anchorRest}>
        {children}
      </a>
    );
  }

  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type="button" className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
