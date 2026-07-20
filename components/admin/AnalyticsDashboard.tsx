"use client";

import { useMemo } from "react";
import type { ArticleContent } from "@/lib/blocks/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsArticle = {
  id: string;
  title: string;
  locale: string;
  status: string;
  pillar_slug: string;
  published_at?: string | null;
  read_time_minutes: number;
  content?: ArticleContent;
};

export type ArticleMetrics = {
  id: string;
  title: string;
  locale: string;
  status: string;
  views: number;
  reads: number;
  readRate: number;
  ctaClicks: number;
  conversionRate: number;
  avgTimeOnPage: number;
  pillar_slug: string;
};

// ---------------------------------------------------------------------------
// Synthetic metrics generation (replaced by real PostHog / analytics in prod)
// ---------------------------------------------------------------------------

function generateSyntheticMetrics(articles: AnalyticsArticle[]): ArticleMetrics[] {
  return articles.map((a, i) => {
    // Deterministic pseudo-random based on article id
    const hash = a.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rand = (min: number, max: number) =>
      min + ((hash * (i + 1) * 7) % (max - min + 1));

    const views = rand(50, 2500);
    const reads = Math.round(views * (0.35 + (hash % 30) / 100));
    const ctaClicks = Math.round(reads * (0.03 + (hash % 10) / 100));

    return {
      id: a.id,
      title: a.title,
      locale: a.locale,
      status: a.status,
      pillar_slug: a.pillar_slug,
      views,
      reads,
      readRate: Math.round((reads / views) * 100),
      ctaClicks,
      conversionRate: views > 0 ? Math.round((ctaClicks / views) * 10000) / 100 : 0,
      avgTimeOnPage: rand(90, 480),
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  articles: AnalyticsArticle[];
  isLive?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnalyticsDashboard({ articles, isLive = false }: Props) {
  const metrics = useMemo(() => generateSyntheticMetrics(articles), [articles]);

  // Aggregate stats
  const aggregate = useMemo(() => {
    const totalViews = metrics.reduce((s, m) => s + m.views, 0);
    const totalReads = metrics.reduce((s, m) => s + m.reads, 0);
    const totalCtaClicks = metrics.reduce((s, m) => s + m.ctaClicks, 0);
    return {
      totalViews,
      totalReads,
      avgReadRate: totalViews > 0 ? Math.round((totalReads / totalViews) * 100) : 0,
      totalCtaClicks,
      avgConversionRate: totalViews > 0
        ? Math.round((totalCtaClicks / totalViews) * 10000) / 100
        : 0,
      totalArticles: metrics.length,
    };
  }, [metrics]);

  // Top performers
  const topByViews = useMemo(
    () => [...metrics].sort((a, b) => b.views - a.views).slice(0, 5),
    [metrics]
  );

  const topByConversion = useMemo(
    () => [...metrics].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5),
    [metrics]
  );

  // Performance by pillar
  const pillarPerformance = useMemo(() => {
    const map = new Map<string, { views: number; reads: number; clicks: number; count: number }>();
    for (const m of metrics) {
      const key = m.pillar_slug || "uncategorized";
      const existing = map.get(key) ?? { views: 0, reads: 0, clicks: 0, count: 0 };
      existing.views += m.views;
      existing.reads += m.reads;
      existing.clicks += m.ctaClicks;
      existing.count += 1;
      map.set(key, existing);
    }
    return Array.from(map.entries())
      .map(([slug, data]) => ({
        slug,
        views: data.views,
        reads: data.reads,
        readRate: data.views > 0 ? Math.round((data.reads / data.views) * 100) : 0,
        articles: data.count,
      }))
      .sort((a, b) => b.views - a.views);
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Source badge */}
      <div className="text-xs text-[var(--text-muted)]">
        {isLive
          ? "Live analytics from PostHog"
          : "Synthetic demo metrics — connect PostHog for real data"}
      </div>

      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Total views", value: aggregate.totalViews.toLocaleString(), suffix: "" },
          { label: "Total reads", value: aggregate.totalReads.toLocaleString(), suffix: "" },
          { label: "Avg read rate", value: aggregate.avgReadRate, suffix: "%" },
          { label: "CTA clicks", value: aggregate.totalCtaClicks.toLocaleString(), suffix: "" },
          { label: "Avg conversion", value: aggregate.avgConversionRate, suffix: "%" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
          >
            <div className="text-lg font-semibold tabular-nums">
              {kpi.value}{kpi.suffix}
            </div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Top performers grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top by views */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <h3 className="font-semibold text-sm mb-3">Top by views</h3>
          <div className="space-y-2">
            {topByViews.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[var(--text-muted)] tabular-nums w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="truncate">{m.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {m.views.toLocaleString()}
                  </span>
                  <span className="text-[var(--text-muted)]">{m.readRate}%</span>
                </div>
              </div>
            ))}
            {topByViews.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No data yet.</p>
            )}
          </div>
        </div>

        {/* Top by conversion */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <h3 className="font-semibold text-sm mb-3">Top by conversion rate</h3>
          <div className="space-y-2">
            {topByConversion.map((m, i) => (
              <div
                key={m.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[var(--text-muted)] tabular-nums w-4 shrink-0">
                    {i + 1}.
                  </span>
                  <span className="truncate">{m.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <span className="tabular-nums text-[var(--text-secondary)]">
                    {m.conversionRate}%
                  </span>
                  <span className="text-[var(--text-muted)]">{m.ctaClicks} clicks</span>
                </div>
              </div>
            ))}
            {topByConversion.length === 0 && (
              <p className="text-xs text-[var(--text-muted)]">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance by pillar */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
        <h3 className="font-semibold text-sm mb-3">Performance by pillar</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-secondary)]">Pillar</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Articles</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Views</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Reads</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Read rate</th>
              </tr>
            </thead>
            <tbody>
              {pillarPerformance.map((p) => (
                <tr key={p.slug} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--text-primary)]">{p.slug}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.articles}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.views.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.reads.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-medium">
                    <span className={p.readRate >= 50 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                      {p.readRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-article metrics table (collapsible) */}
      <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium hover:bg-[var(--surface-2)] rounded-lg transition-colors">
          Detailed per-article metrics ({metrics.length} articles)
        </summary>
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-secondary)]">Title</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Views</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Reads</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Read%</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">CTA</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Conv%</th>
                <th className="text-right py-2 px-2 font-semibold text-[var(--text-secondary)]">Avg time</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--text-primary)] truncate max-w-[200px]">{m.title}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{m.views.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{m.reads.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{m.readRate}%</td>
                  <td className="py-2 px-2 text-right tabular-nums">{m.ctaClicks}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{m.conversionRate}%</td>
                  <td className="py-2 px-2 text-right tabular-nums text-[var(--text-muted)]">
                    {formatDuration(m.avgTimeOnPage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
