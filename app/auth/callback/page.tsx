"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Auth callback page — handles the OAuth redirect from Google/Supabase.
 * Reads tokens from URL hash fragment and writes session cookies.
 */
export default function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    async function handleCallback() {
      try {
        // 1. Extract tokens from hash fragment
        const hash = window.location.hash.slice(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token") ?? "";
        const expiresIn = params.get("expires_in") ?? "3600";

        if (!accessToken) {
          // Try query param (code-based flow)
          const code = searchParams.get("code");
          if (!code) {
            setError("No authorization code received");
            setStatus("error");
            return;
          }
          setError("Code-based flow not yet supported");
          setStatus("error");
          return;
        }

        // 2. Set cookies via API endpoint
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to set session");
        }

        console.log("[callback] Session cookies set, redirecting to /admin");

        // 3. Wait a moment for cookies to be written, then redirect
        setTimeout(() => {
          router.push("/admin");
        }, 300);
      } catch (err) {
        console.error("[callback] Error:", err);
        setError(err instanceof Error ? err.message : "Login failed");
        setStatus("error");
      }
    }

    void handleCallback();
  }, [searchParams, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600">Connexion échouée</h1>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <a href="/auth/login" className="inline-block rounded-md bg-[var(--accent)] text-white px-4 py-2 text-sm">
            Réessayer
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] mx-auto" />
        <p className="text-sm text-[var(--text-muted)]">Connexion en cours…</p>
      </div>
    </div>
  );
}
