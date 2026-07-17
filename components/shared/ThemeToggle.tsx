"use client";

import { useEffect, useState } from "react";

function readStoredTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("fb_theme") as "light" | "dark" | null;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolved = stored ?? (prefersDark ? "dark" : "light");
  document.documentElement.dataset.theme = resolved;
  return resolved;
}

export function ThemeToggle() {
  // Lazy initializer runs once on mount (client-only), reads localStorage,
  // and applies the theme to <html> immediately — no effect needed.
  const [theme, setTheme] = useState<"light" | "dark">(() => readStoredTheme());

  // Keep <html data-theme> in sync after toggle
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("fb_theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
