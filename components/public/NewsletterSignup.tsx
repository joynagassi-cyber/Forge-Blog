"use client";

import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type Props = {
  locale: string;
  /** Placeholder override */
  placeholder?: string;
  /** Button label override */
  buttonLabel?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewsletterSignup({
  locale,
  placeholder,
  buttonLabel,
}: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;

      setStatus("loading");
      try {
        const res = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, locale }),
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(
            data.message ??
              (locale === "fr"
                ? "Merci de votre inscription !"
                : "Thanks for subscribing!"),
          );
          setEmail("");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Subscription failed");
        }
      } catch {
        setStatus("error");
        setMessage(locale === "fr" ? "Erreur réseau" : "Network error");
      }
    },
    [email, locale],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder={
            placeholder ??
            (locale === "fr" ? "Votre adresse email" : "Your email address")
          }
          required
          disabled={status === "loading"}
          className="flex-1 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-50"
          aria-label={locale === "fr" ? "Email pour la newsletter" : "Email for newsletter"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className="rounded-md bg-[var(--accent)] text-white px-4 py-2 text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shrink-0"
        >
          {status === "loading"
            ? (locale === "fr" ? "…" : "…")
            : (buttonLabel ?? (locale === "fr" ? "S'abonner" : "Subscribe"))}
        </button>
      </div>

      {status === "success" && (
        <p className="text-xs status-published">{message}</p>
      )}
      {status === "error" && (
        <p className="text-xs status-error">{message}</p>
      )}
    </form>
  );
}
