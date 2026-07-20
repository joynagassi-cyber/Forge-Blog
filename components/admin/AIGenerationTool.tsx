"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiMode = "equation" | "diagram" | "summary" | "rewrite" | "custom" | "image" | "video";

type ModeConfig = {
  label: string;
  prompt: string;
  placeholder: string;
  apiMode: string;
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
  image: {
    label: "Generate image",
    prompt: "Generate an image of: ",
    placeholder: "e.g. a futuristic SOC analyst workspace, a brain with glowing neural pathways",
    apiMode: "image",
    icon: "🖼",
  },
  video: {
    label: "Generate video",
    prompt: "Generate a video of: ",
    placeholder: "e.g. a 3D rotating brain, an animated neural network",
    apiMode: "video",
    icon: "🎬",
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
  integral: "\\int_{a}^{b} f(x) \\, dx",
  "fourier transform": "\\hat{f}(\\xi) = \\int_{-\\infty}^{\\infty} f(x) e^{-2\\pi i x \\xi} \\, dx",
  "normal distribution": "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
  derivative: "\\frac{df}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
  "matrix multiplication": "C_{ij} = \\sum_{k=1}^{n} A_{ik} B_{kj}",
  "taylor series": "f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!} (x-a)^n",
  "bayes theorem": "P(A \\mid B) = \\frac{P(B \\mid A) \\, P(A)}{P(B)}",
  entropy: "H(X) = -\\sum_{i=1}^{n} P(x_i) \\log P(x_i)",
};

const DIAGRAM_LIBRARY: [string, string][] = [
  ["flowchart", "graph TD;\n  A[Start] --> B{Decision};\n  B -->|Yes| C[Action];\n  B -->|No| D[Alternative];\n  C --> E[End];\n  D --> E;"],
  ["sequence", "sequenceDiagram;\n  participant User\n  participant App\n  participant API\n  User->>App: Click button;\n  App->>API: POST /data;\n  API-->>App: 200 OK;\n  App-->>User: Show result;"],
  ["class", "classDiagram;\n  class Entity {\n    +id: string\n    +createdAt: Date\n  }\n  class User {\n    +name: string\n    +email: string\n  }\n  Entity <|-- User;"],
  ["state", "stateDiagram-v2;\n  [*] --> Idle;\n  Idle --> Processing : start;\n  Processing --> Completed : success;\n  Processing --> Failed : error;\n  Failed --> Idle : retry;\n  Completed --> [*];"],
  ["gantt", "gantt;\n  title Project Timeline;\n  dateFormat YYYY-MM-DD;\n  section Planning;\n  Research    :a1, 2024-01-01, 30d;\n  Design      :a2, after a1, 20d;"],
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
      return `\\text{${instruction.replace(/"/g, "'")}}`;
    }
    case "diagram": {
      for (const [key, defn] of DIAGRAM_LIBRARY) {
        if (q.includes(key)) return defn;
      }
      return `graph TD;\n  A[${instruction.substring(0, 30)}] --> B[Result];`;
    }
    case "image":
      return `https://placehold.co/800x400/6d28d9/ffffff?text=${encodeURIComponent(instruction.substring(0, 30))}`;
    case "video":
      return `[Video generation: ${instruction}]`;
    case "summary":
      return `Summary: ${instruction.substring(0, 100)}...`;
    case "rewrite":
      return `[Rewritten: ${instruction.substring(0, 60)}...]`;
    default:
      return `[AI generation for: ${instruction}]`;
  }
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

async function generateImage(
  prompt: string,
): Promise<{ url: string; alt: string } | null> {
  try {
    const res = await fetch("/api/admin/ai/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, size: "1K", ratio: "16:9" }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; url?: string; alt?: string };
    if (data.ok && data.url) return { url: data.url, alt: data.alt ?? "" };
    return null;
  } catch {
    return null;
  }
}

type VideoTaskStatus = "queued" | "in_progress" | "completed" | "failed";

async function createVideoTask(prompt: string): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/ai/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; taskId?: string };
    if (data.ok && data.taskId) return data.taskId;
    return null;
  } catch {
    return null;
  }
}

async function pollVideoTask(
  taskId: string,
): Promise<{ status: VideoTaskStatus; url?: string }> {
  try {
    const res = await fetch(`/api/admin/ai/generate-video?taskId=${encodeURIComponent(taskId)}`);
    if (!res.ok) return { status: "failed" };
    return await res.json();
  } catch {
    return { status: "failed" };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIGenerationTool({ currentBlockText, onInsert }: AIGenerationProps) {
  const [mode, setMode] = useState<AiMode>("equation");
  const [instruction, setInstruction] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Video polling state
  const [videoStatus, setVideoStatus] = useState<VideoTaskStatus | null>(null);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const config = MODE_CONFIG[mode];

  const handleGenerate = useCallback(async () => {
    if (!instruction.trim()) return;

    setGenerating(true);
    setError(null);
    setResult(null);
    setPreviewUrl(null);
    setVideoStatus(null);
    setVideoTaskId(null);

    if (mode === "image") {
      // Try API first, fallback to placeholder
      const apiResult = await generateImage(instruction);
      if (apiResult) {
        setPreviewUrl(apiResult.url);
        setResult(apiResult.url);
      } else {
        const fallback = fallbackGenerate(mode, instruction);
        setPreviewUrl(fallback);
        setResult(fallback);
      }
    } else if (mode === "video") {
      // Clear any existing poll before starting a new one
      if (pollRef.current) clearInterval(pollRef.current);

      // Try API first
      const taskId = await createVideoTask(instruction);
      if (taskId) {
        setVideoTaskId(taskId);
        setVideoStatus("queued");

        // Start polling every 5 seconds
        pollRef.current = setInterval(async () => {
          const status = await pollVideoTask(taskId);
          setVideoStatus(status.status);

          if (status.status === "completed" && status.url) {
            setResult(status.url);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (status.status === "failed") {
            setError("Video generation failed");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }, 5000);
      } else {
        // Fallback
        setResult(fallbackGenerate(mode, instruction));
        setVideoStatus("completed");
      }
    } else {
      // Text-based modes: try existing AI API first
      const apiResult = await generateWithApiFallback(mode, instruction, currentBlockText);
      if (apiResult) {
        setResult(apiResult);
      } else {
        setResult(fallbackGenerate(mode, instruction));
      }
    }

    setGenerating(false);
  }, [mode, instruction, currentBlockText]);

  function handleInsert() {
    if (result) {
      onInsert(result, mode);
      // Reset state
      setResult(null);
      setPreviewUrl(null);
      setInstruction("");
      setVideoStatus(null);
      setVideoTaskId(null);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setOpen(false);
    }
  }

  function switchMode(m: AiMode) {
    setMode(m);
    setResult(null);
    setPreviewUrl(null);
    setError(null);
    setVideoStatus(null);
    setVideoTaskId(null);
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // Format video status for display
  const videoStatusLabel =
    videoStatus === "queued"
      ? "Queued…"
      : videoStatus === "in_progress"
        ? "Generating video…"
        : videoStatus === "completed"
          ? "Completed"
          : videoStatus === "failed"
            ? "Failed"
            : "";

  const isImageOrVideo = mode === "image" || mode === "video";

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
              {mode === "image"
                ? "Describe the image you want to generate:"
                : mode === "video"
                  ? "Describe the video you want to generate:"
                  : mode === "custom"
                    ? "What do you want to generate?"
                    : "Describe what you need:"}
            </label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder={config.placeholder}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm min-h-[60px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              rows={isImageOrVideo ? 3 : 2}
            />
            {isImageOrVideo && (
              <p className="text-[10px] text-[var(--text-muted)]">
                Be detailed for best results. Powered by Agnes AI (agnes-image-2.1-flash)
              </p>
            )}
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
                  {mode === "image" ? "Generate image" : mode === "video" ? "Generate video" : "Generate"}
                </>
              )}
            </button>

            {currentBlockText && (
              <span className="text-[10px] text-[var(--text-muted)] self-center ml-1">
                Using selected block as context
              </span>
            )}
          </div>

          {/* Video status indicator */}
          {videoStatus && videoStatus !== "completed" && videoStatus !== "failed" && (
            <div className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-muted)]">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)]/30 border-t-[var(--accent)]" />
              {videoStatusLabel}
            </div>
          )}

          {/* Image preview */}
          {previewUrl && (
            <div className="rounded-lg border border-[var(--border)] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={instruction}
                className="w-full aspect-video object-cover"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="rounded-md bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Result (text-based or generated URL) */}
          {result && !previewUrl && mode !== "video" && (
            <div className="space-y-2 animate-fade-in-up">
              <div className="relative rounded-md border border-[var(--border)] bg-[var(--bg)]">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)]">
                  <span className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
                    {mode === "equation" ? "LaTeX" : mode === "diagram" ? "Mermaid" : "Generated"}
                  </span>
                  <button
                    type="button"
                    onClick={() => { if (result) navigator.clipboard.writeText(result); }}
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
            </div>
          )}

          {/* Video result URL */}
          {result && videoStatus === "completed" && !previewUrl && (
            <div className="space-y-2 animate-fade-in-up">
              <div className="rounded-md border border-[var(--border)] bg-[var(--bg)] p-3">
                <p className="text-xs text-[var(--text-muted)] mb-1">Video URL:</p>
                <a
                  href={result}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--accent)] hover:underline break-all"
                >
                  {result}
                </a>
              </div>
            </div>
          )}

          {/* Insert button (for image and video results) */}
          {result && (previewUrl || videoStatus === "completed") && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleInsert}
                className="rounded-md bg-[var(--accent)] text-white px-3 py-1.5 text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors"
              >
                {mode === "image" ? "Insert image into article" : "Insert video embed into article"}
              </button>
              <button
                type="button"
                onClick={() => { setResult(null); setPreviewUrl(null); }}
                className="rounded-md border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
              >
                Discard
              </button>
            </div>
          )}

          {/* Insert button for text-based results */}
          {result && !isImageOrVideo && !previewUrl && (
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

// ---------------------------------------------------------------------------
// Shared text generation via AI API
// ---------------------------------------------------------------------------

async function generateWithApiFallback(
  mode: AiMode,
  instruction: string,
  context?: string,
): Promise<string | null> {
  try {
    const res = await fetch("/api/admin/ai/ai-diagram-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: "live",
        mode: MODE_CONFIG[mode].apiMode,
        instruction,
        context,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const d = data as { content?: string };
      if (d.content) return d.content;
    }
  } catch {
    // Fallback to client-side
  }
  return null;
}
