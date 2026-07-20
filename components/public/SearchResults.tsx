"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { captureSearch } from "@/components/shared/PostHogProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchResultItem = {
  slug: string;
  title: string;
  excerpt: string;
  snippet: string;
  matchField: "title" | "excerpt" | "content";
  published_at: string;
  read_time_minutes: number;
  pillar_slug: string;
  cover_image_url: string | null;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  locale: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResults({ locale }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const performSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setSearched(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&locale=${locale}`);
        const data = await res.json() as { results?: SearchResultItem[]; count?: number };
        setResults(data.results ?? []);
        setSearched(true);

        // Track search event
        captureSearch({ query: q, results_count: data.count ?? 0, locale });
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, performSearch]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] pointer-events-none"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === "fr" ? "Rechercher des articles…" : "Search articles…"}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-1)] pl-10 pr-4 py-3 text-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          aria-label={locale === "fr" ? "Rechercher" : "Search"}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          </div>
        )}
      </div>

      {/* Results */}
      {searched && (
        <div>
          {results.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-lg text-[var(--text-secondary)]">
                {locale === "fr" ? "Aucun résultat trouvé" : "No results found"}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                {locale === "fr"
                  ? "Essayez des termes différents ou parcourez les articles par pilier."
                  : "Try different search terms or browse articles by pillar."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[var(--text-secondary)]">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              <div className="space-y-3">
                {results.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/${locale}/article/${r.slug}`}
                    className="block rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {r.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.cover_image_url}
                          alt=""
                          className="w-20 h-14 rounded object-cover shrink-0 border border-[var(--border)]"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">
                          {r.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                          {r.excerpt}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
                          <span>{r.read_time_minutes} min</span>
                          <span className="uppercase">{r.pillar_slug}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              r.matchField === "title"
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : r.matchField === "excerpt"
                                  ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                  : "bg-zinc-500/20 text-zinc-600 dark:text-zinc-400"
                            }`}
                          >
                            matched {r.matchField}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">
          {locale === "fr"
            ? "Commencez à taper pour rechercher des articles"
            : "Start typing to search articles"}
        </div>
      )}
    </div>
  );
}
