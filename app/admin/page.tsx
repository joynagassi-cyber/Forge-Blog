import { DEMO_ARTICLES } from "@/lib/content/demo-articles";
import Link from "next/link";

const statuses = [
  { key: "published", label: "Published", className: "status-published" },
  { key: "drafting", label: "Drafting", className: "status-attention" },
  { key: "in_review", label: "In review", className: "status-info" },
  { key: "idea", label: "Ideas", className: "status-info" },
];

export default function AdminOverviewPage() {
  const published = DEMO_ARTICLES.filter((a) => a.locale === "en").length;
  const total = DEMO_ARTICLES.length;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Overview
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            What changed · What needs attention · What is scheduled · What is
            performing · What should happen next
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm btn-shimmer"
        >
          Create article
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Demo articles", value: total },
          { label: "EN published (demo)", value: published },
          { label: "FR counterparts", value: DEMO_ARTICLES.filter((a) => a.locale === "fr").length },
          { label: "SEO warnings", value: 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="text-2xl font-semibold tabular-nums">
              {card.value}
            </div>
            <div className="text-sm text-[var(--text-secondary)] mt-1">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h2 className="font-semibold mb-3">Status distribution</h2>
          <ul className="space-y-2 text-sm">
            {statuses.map((s) => (
              <li key={s.key} className="flex justify-between">
                <span className={s.className}>{s.label}</span>
                <span className="text-[var(--text-muted)] tabular-nums">
                  {s.key === "published" ? published : 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
          <h2 className="font-semibold mb-3">Prioritized action queue</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-[var(--text-secondary)]">
            <li>Connect Supabase (URL + anon key in .env.local)</li>
            <li>Run migrations in supabase/migrations</li>
            <li>Configure AI providers under Settings</li>
            <li>Translate remaining EN-only demo articles to FR</li>
          </ol>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <h2 className="font-semibold mb-3">Content health</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Performance metrics show &quot;No data available&quot; until PostHog
          and Search Console are connected. Never invent metrics.
        </p>
        <div className="mt-3 text-sm text-[var(--text-muted)]">
          No data available · Connect PostHog via NEXT_PUBLIC_POSTHOG_KEY
        </div>
      </section>
    </div>
  );
}
