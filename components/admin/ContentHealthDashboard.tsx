"use client";

import { useMemo } from "react";
import type { ArticleContent } from "@/lib/blocks/types";
import { validateArticleContent } from "@/lib/blocks/validate";
import type { ValidationIssue } from "@/lib/blocks/validate";
import {
  DIMENSION_ORDER,
  DIMENSION_LABELS,
  DIMENSION_GROUP,
  computeArticleScores,
  computeAggregateScores,
  scoreBarColor,
  scoreTextColor,
} from "@/lib/blocks/scoring";
import type { ArticleForScoring, ScoreMap } from "@/lib/blocks/scoring";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  articles: ArticleForScoring[];
  liveScores?: Map<string, { scores: ScoreMap; average: number }> | null;
  isLive: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContentHealthDashboard({ articles, liveScores, isLive }: Props) {
  // Validation issues per article
  const validationMap = useMemo(() => {
    const map = new Map<string, ValidationIssue[]>();
    for (const a of articles) {
      map.set(a.id, validateArticleContent(a.content));
    }
    return map;
  }, [articles]);

  // Aggregate validation stats
  const validationStats = useMemo(() => {
    let totalErrors = 0;
    let totalWarnings = 0;
    let articlesWithErrors = 0;
    let articlesWithWarnings = 0;

    for (const [, issues] of validationMap) {
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings = issues.filter((i) => i.severity === "warning").length;
      totalErrors += errors;
      totalWarnings += warnings;
      if (errors > 0) articlesWithErrors++;
      if (warnings > 0) articlesWithWarnings++;
    }

    return { totalErrors, totalWarnings, articlesWithErrors, articlesWithWarnings };
  }, [validationMap]);

  // Demo scores (computed from content via shared scoring module)
  const demoAvgScores = useMemo(() => computeAggregateScores(articles), [articles]);

  // Individual article scores
  const individualScores = useMemo(
    () =>
      articles.map((a) => {
        const { scores, average } = computeArticleScores(a);
        return {
          id: a.id,
          title: a.title,
          locale: a.locale,
          scores,
          avg: average,
        };
      }),
    [articles]
  );

  // Aggregate live scores if available
  const liveAvgScores = useMemo(() => {
    if (!liveScores || liveScores.size === 0) return null;
    const totals: Record<string, number[]> = {};
    for (const dim of DIMENSION_ORDER) totals[dim] = [];

    for (const [, summary] of liveScores) {
      for (const dim of DIMENSION_ORDER) {
        if (summary.scores[dim] !== undefined) {
          totals[dim].push(summary.scores[dim]);
        }
      }
    }

    const result: ScoreMap = {};
    for (const dim of DIMENSION_ORDER) {
      const vals = totals[dim];
      result[dim] = vals.length > 0
        ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
        : 0;
    }
    return result;
  }, [liveScores]);

  const scores = isLive && liveAvgScores ? liveAvgScores : demoAvgScores;
  const overallAvg = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).filter(Boolean).length
  );

  // Group articles by health tier
  const healthTiers = useMemo(() => {
    const healthy: string[] = [];
    const warning: string[] = [];
    const critical: string[] = [];

    for (const a of articles) {
      const issues = validationMap.get(a.id) ?? [];
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings_count = issues.filter((i) => i.severity === "warning").length;
      if (errors > 0) critical.push(a.title);
      else if (warnings_count > 0) warning.push(a.title);
      else healthy.push(a.title);
    }

    return { healthy, warning, critical };
  }, [articles, validationMap]);

  // Find top warnings across all articles
  const topWarnings = useMemo(() => {
    const counts = new Map<string, { count: number; severity: string; code: string; example?: string }>();
    for (const [articleId, issues] of validationMap) {
      const article = articles.find((a) => a.id === articleId);
      for (const issue of issues) {
        const existing = counts.get(issue.code);
        if (existing) {
          existing.count++;
        } else {
          counts.set(issue.code, {
            count: 1,
            severity: issue.severity,
            code: issue.code,
            example: article ? `"${article.title.slice(0, 40)}…"` : undefined,
          });
        }
      }
    }
    return Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [validationMap, articles]);

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Overall health score */}
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              background: `conic-gradient(${scoreBarColor(overallAvg)} ${overallAvg}%, var(--surface-2) ${overallAvg}%)`,
            }}
          >
            <span className="w-16 h-16 rounded-full bg-[var(--bg)] flex items-center justify-center">
              {overallAvg}
            </span>
          </div>
          <div>
            <div className="font-semibold text-sm">Content Health Score</div>
            <div className="text-xs text-[var(--text-secondary)] mt-0.5">
              {isLive ? "Live AI audit scores" : "Synthetic score (demo)"}
            </div>
          </div>
        </div>

        {/* Health tiers */}
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>{healthTiers.healthy.length} healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span>{healthTiers.warning.length} warnings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span>{healthTiers.critical.length} critical</span>
          </div>
        </div>

        <div className="text-xs text-[var(--text-muted)] ml-auto">
          {validationStats.totalErrors} errors · {validationStats.totalWarnings} warnings
        </div>
      </div>

      {/* Dimension scores grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DIMENSION_ORDER.map((dim) => {
          const score = scores[dim] ?? 0;
          return (
            <div
              key={dim}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {DIMENSION_LABELS[dim] ?? dim}
                </span>
                <span className={`text-xs font-bold tabular-nums ${scoreTextColor(score)}`}>
                  {score}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${score}%`,
                    background: scoreBarColor(score),
                  }}
                />
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-wide">
                {DIMENSION_GROUP[dim] ?? ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top validation warnings */}
      {topWarnings.length > 0 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Top validation issues
          </h3>
          <ul className="space-y-1.5">
            {topWarnings.map((w) => (
              <li key={w.code} className="flex items-center gap-2 text-xs">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 font-medium ${
                    w.severity === "error"
                      ? "bg-red-500/15 text-red-600 dark:text-red-400"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {w.severity}
                </span>
                <span className="text-[var(--text-secondary)] flex-1">
                  {w.code.replace(/_/g, " ")}
                </span>
                <span className="text-[var(--text-muted)] tabular-nums">{w.count}x</span>
                {w.example && (
                  <span className="text-[var(--text-muted)] truncate max-w-[150px] hidden lg:inline">
                    {w.example}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-article score detail (collapsible) */}
      <details className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium hover:bg-[var(--surface-2)] rounded-lg transition-colors">
          Per-article scores ({individualScores.length} articles)
        </summary>
        <div className="px-4 pb-4 overflow-x-auto">
          <table className="w-full text-xs mt-2">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 pr-3 font-semibold text-[var(--text-secondary)]">Title</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">Avg</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">SEO</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">AEO</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">GEO</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">Ed.</th>
                <th className="text-center py-2 px-2 font-semibold text-[var(--text-secondary)]">Read.</th>
              </tr>
            </thead>
            <tbody>
              {individualScores.map((a) => (
                <tr key={a.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2 pr-3 text-[var(--text-primary)] truncate max-w-[180px]">
                    {a.title}
                  </td>
                  {[
                    { key: "avg", value: a.avg },
                    { key: "seo_readiness", value: a.scores.seo_readiness },
                    { key: "aeo_readiness", value: a.scores.aeo_readiness },
                    { key: "geo_readiness", value: a.scores.geo_readiness },
                    { key: "editorial_quality", value: a.scores.editorial_quality },
                    { key: "readability", value: a.scores.readability },
                  ].map(({ key, value }) => (
                    <td
                      key={key}
                      className={`py-2 px-2 text-center tabular-nums font-medium ${scoreTextColor(value)}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
