"use client";

import { useMemo } from "react";
import { validateArticleContent } from "@/lib/blocks/validate";
import {
  DIMENSION_LABELS,
  DIMENSION_GROUP,
  computeArticleScores,
  scoreBarColor,
  scoreTextColor,
} from "@/lib/blocks/scoring";
import type { ArticleForScoring } from "@/lib/blocks/scoring";

type Props = {
  article: ArticleForScoring;
};

export function ArticleScoreSummary({ article }: Props) {
  const { scores, average } = useMemo(
    () => computeArticleScores(article as ArticleForScoring),
    [article]
  );

  const issues = useMemo(
    () => validateArticleContent(article.content),
    [article.content]
  );

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  // Top 6 most relevant dimensions for the editor view
  const keyDims = ["seo_readiness", "aeo_readiness", "geo_readiness", "editorial_quality", "readability", "conversion_readiness"];

  return (
    <div className="space-y-4">
      {/* Overall + validation summary */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold shrink-0"
            style={{
              background: `conic-gradient(${scoreBarColor(average)} ${average}%, var(--surface-2) ${average}%)`,
            }}
          >
            <span className="w-9 h-9 rounded-full bg-[var(--bg)] flex items-center justify-center">
              {average}
            </span>
          </div>
          <div>
            <div className="text-xs font-medium">Overall Score</div>
            <div className="text-[10px] text-[var(--text-muted)]">Synthetic estimate</div>
          </div>
        </div>

        <div className="flex gap-3 text-xs">
          <div>
            <span className={errors.length > 0 ? "text-red-500 font-semibold" : "text-[var(--text-muted)]"}>
              {errors.length} errors
            </span>
          </div>
          <div>
            <span className={warnings.length > 0 ? "text-amber-500 font-semibold" : "text-[var(--text-muted)]"}>
              {warnings.length} warnings
            </span>
          </div>
        </div>
      </div>

      {/* Key dimension scores */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {keyDims.map((dim) => {
          const score = scores[dim] ?? 0;
          return (
            <div
              key={dim}
              className="rounded border border-[var(--border)] bg-[var(--surface-1)] p-2"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate">
                  {(DIMENSION_LABELS[dim] ?? dim).replace(" Readiness", "")}
                </span>
                <span className={`text-[11px] font-bold tabular-nums ${scoreTextColor(score)}`}>
                  {score}
                </span>
              </div>
              <div className="h-1 rounded-full bg-[var(--surface-2)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${score}%`, background: scoreBarColor(score) }}
                />
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-0.5 uppercase tracking-wide">
                {DIMENSION_GROUP[dim] ?? ""}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation issues */}
      {issues.length > 0 && (
        <div className="space-y-1">
          {issues.slice(0, 4).map((i) => (
            <div
              key={i.code + (i.path ?? "")}
              className="flex items-start gap-1.5 text-[11px]"
            >
              <span
                className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                  i.severity === "error" ? "bg-red-500" : "bg-amber-500"
                }`}
              />
              <span
                className={
                  i.severity === "error"
                    ? "text-red-500"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {i.message}
              </span>
            </div>
          ))}
          {issues.length > 4 && (
            <p className="text-[10px] text-[var(--text-muted)] pl-3">
              +{issues.length - 4} more issues
            </p>
          )}
        </div>
      )}
    </div>
  );
}
