"use client";

import { useEffect, useId, useRef, useState } from "react";

// Dynamic import — mermaid (~3MB) loaded at runtime, never bundled in server handler
async function loadMermaidModule(): Promise<typeof import("mermaid").default> {
  const mod = await import("mermaid");
  return (mod.default || mod) as typeof import("mermaid").default;
}

export function MermaidBlockView({ definition, title }: { definition: string; title?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const uid = useId();

  useEffect(() => {
    if (!containerRef.current || !definition.trim()) return;
    let cancelled = false;

    async function initAndRender() {
      try {
        const mermaid = await loadMermaidModule();

        // Singleton init — first call wins
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: {
            background: "transparent",
            primaryColor: "#f4f4f5",
            primaryTextColor: "#111114",
            primaryBorderColor: "#d4d4d8",
            secondaryColor: "#ececee",
            secondaryTextColor: "#5b5b63",
            secondaryBorderColor: "#e4e4e7",
            tertiaryColor: "#fafafa",
            tertiaryTextColor: "#8b8b93",
            lineColor: "#d4d4d8",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "14px",
            edgeLabelBackground: "#f4f4f5",
          },
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
        });

        if (cancelled) return;
        setLoading(true);
        setError(false);

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

    void initAndRender();
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
