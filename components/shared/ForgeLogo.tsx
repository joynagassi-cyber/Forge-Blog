import Link from "next/link";

type Props = {
  locale: string;
  /** Size variant */
  variant?: "header" | "footer";
};

/**
 * Forge-Blog logo — icon (anvil + spark) + wordmark.
 * Pure SVG, no external assets, no HTTP requests.
 */
export function ForgeLogo({ locale, variant = "header" }: Props) {
  const iconSize = variant === "footer" ? 28 : 32;
  const textSize = variant === "footer" ? "text-sm" : "text-lg";

  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-center gap-2.5 font-semibold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors group`}
      aria-label="Forge-Blog — Home"
    >
      {/* Icon: anvil + spark forming the F */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id="logo-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
        </defs>
        {/* Background circle */}
        <circle cx="256" cy="256" r="240" fill="url(#logo-glow)" />
        {/* Enclume — vertical stroke */}
        <rect x="186" y="140" width="48" height="232" rx="12" fill="#ffffff" />
        {/* Étincelle — horizontal arc */}
        <path
          d="M186 212 C186 212 234 200 280 212 C326 224 340 260 340 260"
          fill="none"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Spark particles */}
        <circle cx="320" cy="180" r="6" fill="#c4b5fd" opacity="0.8" />
        <circle cx="340" cy="200" r="4" fill="#a78bfa" opacity="0.6" />
        <circle cx="160" cy="340" r="5" fill="#c4b5fd" opacity="0.5" />
        {/* Warm spark — amber particle */}
        <circle cx="210" cy="160" r="4.5" fill="#d4a843" opacity="0.7" />
        {/* Subtle inner glow */}
        <circle
          cx="256" cy="256" r="230"
          fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.08"
        />
      </svg>

      {/* Wordmark */}
      <span className={`${textSize} tracking-tight`}>
        Forge<span className="text-[var(--accent)]">-</span>Blog
      </span>
    </Link>
  );
}
