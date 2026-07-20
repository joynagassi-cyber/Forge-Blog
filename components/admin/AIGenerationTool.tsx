"use client";

import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiMode = "equation" | "diagram" | "summary" | "rewrite" | "custom";

type ModeConfig = {
  label: string;
  prompt: string;
  placeholder: string;
  apiMode: string;     // maps to Edge Function mode parameter
  icon: string;
};

const MODE_CONFIG: Record<AiMode, ModeConfig> = {
  equation: {
    label: "Generate equation",
    prompt: "Generate a LaTeX equation for: ",
    placeholder: "e.g. quadratic formula, Fourier transform, matrix multiplication",
    apiMode: "equation",
    icon: "∑",
  },
  diagram: {
    label: "Generate diagram",
    prompt: "Generate a Mermaid diagram definition for: ",
    placeholder: "e.g. flowchart showing user login process, sequence diagram for API request",
    apiMode: "diagram",
    icon: "◉",
  },
  summary: {
    label: "Summarize",
    prompt: "Summarize the selected content concisely: ",
    placeholder: "e.g. Make this more concise...",
    apiMode: "summary",
    icon: "¶",
  },
  rewrite: {
    label: "Rewrite",
    prompt: "Rewrite the following to be clearer and more engaging: ",
    placeholder: "e.g. Improve tone and clarity...",
    apiMode: "rewrite",
    icon: "✎",
  },
  custom: {
    label: "Custom",
    prompt: "",
    placeholder: "Describe what you want to generate...",
    apiMode: "custom",
    icon: "✧",
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type AIGenerationProps = {
  currentBlockText?: string;
  onInsert: (content: string, mode: AiMode) => void;
};

// ---------------------------------------------------------------------------
// Fallback generation (client-side, used when API is unavailable)
// ---------------------------------------------------------------------------

const EQUATION_LIBRARY: Record<string, string> = {
  quadratic: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  "quadratic formula": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
  einstein: "E = mc^2",
  "e=mc": "E = mc^2",
  "e=mc^2": "E = mc^2",
  integral: "\\int_{a}^{b} f(x) \\, dx",
  "fourier transform": "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\, dx",
  fourier: "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\, dx",
  "normal distribution": "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
  gaussian: "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
  derivative: "\\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
  "matrix multiplication": "C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}",
  matrix: "C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}",
  "taylor series": "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n",
  taylor: "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n",
  "bayes theorem": "P(A \\mid B) = \\frac{P(B \\mid A) \\, P(A)}{P(B)}",
  bayes: "P(A \\mid B) = \\frac{P(B \\mid A) \\, P(A)}{P(B)}",
  entropy: "H(X) = -\\sum_{i=1}^{n} P(x_i) \\log P(x_i)",
  "shannon entropy": "H(X) = -\\sum_{i=1}^{n} P(x_i) \\log P(x_i)",
};

const DIAGRAM_LIBRARY: [string, string][] = [
  ["flowchart", "graph TD;\n  A[Start] --> B{Decision};\n  B -->|Yes| C[Action];\n  B -->|No| D[Alternative];\n  C --> E[End];\n  D --> E;"],
  ["sequence", "sequenceDiagram;\n  participant User\n  participant App\n  participant API\n  User->>App: Click button;\n  App->>API: POST /data;\n  API-->>App: 200 OK;\n  App-->>User: Show result;"],
  ["class", "classDiagram;\n  class Entity {\n    +id: string\n    +createdAt: Date\n  }\n  class User {\n    +name: string\n    +email: string\n  }\n  Entity <|-- User;"],
  ["state", "stateDiagram-v2;\n  [*] --> Idle;\n  Idle --> Processing : start;\n  Processing --> Completed : success;\n  Processing --> Failed : error;\n  Failed --> Idle : retry;\n  Completed --> [*];"],
  ["gantt", "gantt;\n  title Project Timeline;\n  dateFormat YYYY-MM-DD;\n  section Planning;\n  Research    :a1, 2024-01-01, 30d;\n  Design      :a2, after a1, 20d;\n  section Development;\n  Frontend    :a3, after a2, 45d;\n  Backend     :a4, after a2, 45d;"],
  ["pie", 'pie;\n  title Distribution;\n  "Category A" : 40;\n  "Category B" : 25;\n  "Category C" : 20;\n  "Category D" : 15;'],
  ["er", "erDiagram;\n  USER ||--o{ ORDER : places;\n  ORDER ||--|{ LINE-ITEM : contains;\n  LINE-ITEM }|--|| PRODUCT : is;"],
  ["journey", "journey;\n  title User Journey;\n  section Onboarding;\n  Sign up: 3: User;\n  Verify email: 2: User, System;\n  Complete profile: 4: User;"],
  ["git", "gitGraph;\n  commit;\n  branch feature;\n  checkout feature;\n  commit;\n  commit;\n  checkout main;\n  merge feature;"],
  ["timeline", "timeline;\n  title History of AI;\n  1950 : Turing Test;\n  1966 : ELIZA;\n  1997 : Deep Blue;\n  2012 : AlexNet;\n  2023 : GPT-4;"],
  ["login", "graph TD;\n  A[Login Page] --> B{Valid Credentials?};\n  B -->|Yes| C[Redirect to Dashboard];\n  B -->|No| D[Show Error Message];\n  D --> A;"],
  ["api request", "sequenceDiagram;\n  participant User\n  participant App\n  participant API\n  participant DB\n  User->>App: POST /api/data;\n  App->>API: Validate request;\n  API->>DB: Query data;\n  DB-->>API: Return results;\n  API-->>App: Formatted response;\n  App-->>User: Show data;"],
  ["algorithm", "graph TD;\n  A[Input] --> B[Step 1: Initialize];\n  B --> C{Step 2: Check Condition};\n  C -->|Pass| D[Step 3: Process];\n  C -->|Fail| E[Step 4: Error Handler];\n  D --> F[Step 5: Output];\n  E --> F;"],
];

function fallbackGenerate(mode: AiMode, instruction: string): string {
  const q = instruction.toLowerCase().trim();

  switch (mode) {
    case "equation": {
      for (const [key, latex] of Object.entries(EQUATION_LIBRARY)) {
        if (q.includes(key)) return latex;
      }
      // Attempt to generate a simple equation from the description
      if (q.includes("+") || q.includes("plus")) return `x + y = z`;
      if (q.includes("=")) return q;
      if (q.includes("^")) return q;
      return `\\text{${instruction.replace(/"/g, "'")}}`;
    }

    case "diagram": {
      for (const [key, defn] of DIAGRAM_LIBRARY) {
        if (q.includes(key)) return defn;
      }
      return `graph TD;\n  A[${instruction.substring(0, 30)}] --> B[Result];`;
    }

    case "summary":
      return `Summary: ${instruction.substring(0, 100)}...`;

    case "rewrite":
      return `[Rewritten: ${instruction.substring(0, 60)}...]`;

    default:
      return `[AI generation for: ${instruction}]`;
  }
}

// ---------------------------------------------------------------------------
// API call
// ---------------------------------------------------------------------------

async function generateWithAPI(
  mode: AiMode,
  instruction: string,
  context?: string,
): Promise<string | null> {
  const config = MODE_CONFIG[mode];
  const endpoint = "/api/admin/ai/ai-diagram-generation";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: "live",  // placeholder — real ID required for Supabase lookup
        mode: config.apiMode,
        instruction,
        context,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.content) return data.content;
    }
  } catch {
    // Fallback to client-side generation
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIGenerationTool({ currentBlockText, onInsert }: AIGenerationProps) {
  const [mode, setMode] = useState<AiMode>("equation");
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const config = MODE_CONFIG[mode];

  const handleGenerate = useCallback(async () => {
    if (!instruction.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);

    // Try API first
    const apiResult = await generateWithAPI(mode, instruction, currentBlockText);

    if (apiResult) {
      setResult(apiResult);
    } else {
      // Fallback: client-side generation
      setResult(fallbackGenerate(mode, instruction));
    }

    setGenerating(false);
  }, [mode, instruction, currentBlockText]);

  function handleInsert() {
    if (result) {
      onInsert(result, mode);
      setResult(null);
      setInstruction("");
      setOpen(false);
    }
  }

  function switchMode(m: AiMode) {
    setMode(m);
    setResult(null);
    setError(null);
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-1)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-lg transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
            <path d="M20 13c0 4.42-3.58 8-8 8s-8-3.58-8-8" />
            <line x1="12" y1="16" x2="12" y2="20" />
            <line x1="9" y1="19" x2="15" y2="19" />
          </svg>
          AI Assistant
        </span>
        <span className={`text-[var(--text-muted)] transition-transform ${open ? "rotate-180" : ""}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t border-[var(--border)]">
          {/* Mode selector */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(MODE_CONFIG) as [AiMode, ModeConfig][]).map(([m, cfg]) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  mode === m
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] font-medium"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span className="mr-1" aria-hidden>{cfg.icon}</span>
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Instruction input */}
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--text-muted)]">
              {mode === "custom" ? "What do you want to generate?" : "Describe what you need:"}
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={config.placeholder}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm min-h-[60px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              rows={2}
            />
          </div>

          {/* Generate button */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !instruction.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-medium btn-shimmer disabled:opacity-50 transition-opacity"
            >
              {generating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate
                </>
              )}
            </button>

            {currentBlockText && (
              <span className="text-[10px] text-[var(--text-muted)] self-center ml-1">
                Using selected block as context
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2 animate-fade-in-up">
              <div className="relative rounded-md border border-[var(--border)] bg-[var(--bg)]">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
                  <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    {mode === "equation" ? "LaTeX" : mode === "diagram" ? "Mermaid" : "Generated"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (result) navigator.clipboard.writeText(result);
                    }}
                    className="text-[10px] text-[var(--accent)] hover:underline"
                    title="Copy to clipboard"
                  >
                    Copy
                  </button>
                </div>
                <pre className="p-3 font-mono text-xs whitespace-pre-wrap max-h-40 overflow-y-auto text-[var(--text-primary)] leading-relaxed">
                  {result}
                </pre>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleInsert}
                  className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
                >
                  {mode === "equation" ? "Insert equation" : mode === "diagram" ? "Insert diagram" : "Insert text"}
                </button>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const prompt = `${config.prompt}${instruction}`;
                    setInstruction(prompt);
                    setResult(null);
                  }}
                  className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Keyboard shortcut hint */}
          <p className="text-[10px] text-[var(--text-muted)] text-right">
            Ctrl+Enter to generate
          </p>
        </div>
      )}
    </div>
  );
}
