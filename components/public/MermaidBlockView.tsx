"use client";

import { useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";

// ---------------------------------------------------------------------------
// Singleton guard — mermaid.initialize is called only once
// ---------------------------------------------------------------------------
let initialized = false;

function ensureMermaidInitialized() {
  if (initialized) return;
  initialized = true;

  const isDark =
    typeof document !== "undefined" &&
    (document.documentElement.dataset.theme === "dark" ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      background: "transparent",
      primaryColor: isDark ? "#18181b" : "#f4f4f5",
      primaryTextColor: isDark ? "#f2f2f3" : "#111114",
      primaryBorderColor: isDark ? "#3f3f46" : "#d4d4d8",
      secondaryColor: isDark ? "#1f1f23" : "#ececee",
      secondaryTextColor: isDark ? "#9a9aa1" : "#5b5b63",
      secondaryBorderColor: isDark ? "#27272a" : "#e4e4e7",
      tertiaryColor: isDark ? "#0a0a0c" : "#fafafa",
      tertiaryTextColor: isDark ? "#71717a" : "#8b8b93",
      lineColor: isDark ? "#3f3f46" : "#d4d4d8",
      fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      fontSize: "14px",
      edgeLabelBackground: isDark ? "#18181b" : "#f4f4f5",
    },
    flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
    sequence: { showSequenceNumbers: false },
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Props = {
  definition: string;
  title?: string;
};

export function MermaidBlockView({ definition, title }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const uid = useId();

  useEffect(() => {
    if (!containerRef.current || !definition.trim()) return;
    let cancelled = false;

    ensureMermaidInitialized();

    async function render() {
      setLoading(true);
      setError(false);
      try {
        const existing = containerRef.current?.querySelector(".mermaid");
        if (existing) existing.remove();

        const el = document.createElement("div");
        el.className = "mermaid";
        el.textContent = definition;
        containerRef.current?.appendChild(el);

        await mermaid.run({ nodes: [el], suppressErrors: true });

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      }
    }

    void render();
    return () => { cancelled = true; };
  }, [definition]);

  if (!definition.trim()) return null;

  const diagramLabel = title ?? "Diagram";

  return (
    <figure className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 overflow-x-auto">
      {title && (
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
          {title}
        </figcaption>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <span className="ml-2 text-sm text-[var(--text-muted)]">
            Rendering {diagramLabel}…
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        className={`mermaid-wrapper ${loading ? "hidden" : ""}`}
        aria-label={diagramLabel}
        role="img"
        id={`mermaid-${uid}`}
      />

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 font-mono text-xs text-red-700" role="alert">
          <span className="block font-semibold mb-1">Diagram error — showing source:</span>
          <pre className="whitespace-pre-wrap">{definition}</pre>
        </div>
      )}
    </figure>
  );
}
