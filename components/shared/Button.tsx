import { clsx } from "clsx";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

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
    const { href, ...anchorRest } = rest;
    return (
      <a href={href} className={classes} {...anchorRest}>
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
