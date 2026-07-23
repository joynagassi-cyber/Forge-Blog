"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Auth callback page — handles the OAuth redirect from Google/Supabase.
 *
 * This is a CLIENT component because Supabase OAuth redirect returns
 * tokens in the URL hash fragment (#access_token=...) which only the
 * browser can read. A server Route Handler (route.ts) cannot parse #.
 *
 * Flow:
 *   1. User clicks "Sign in with Google" on /auth/login
 *   2. Google OAuth → redirects back to /en/auth/callback#access_token=...
 *   3. This page extracts tokens from the hash
 *   4. Sets session cookies via fetch
 *   5. Redirects to /admin
 */

export default function CallbackPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    async function handleCallback() {
      // Supabase may pass code in query (?code=xxx) or token in hash (#access_token=xxx)
      const hash = window.location.hash.slice(1); // remove leading '#'
      const params = new URLSearchParams(hash);

      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const tokenType = params.get("token_type");
      const expiresIn = params.get("expires_in");

      if (!accessToken) {
        // Maybe it's a code-based flow (query param instead of hash)
        const code = searchParams.get("code");
        if (!code) {
          setError("No authorization code received");
          return;
        }
        // Code-based: forward to backend exchange
        await handleCodeExchange(code);
        return;
      }

      // Token-based redirect (hash fragment)
      await setSessionCookies({
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
        token_type: tokenType ?? "bearer",
        expires_in: expiresIn ?? "3600",
      });
    }

    async function handleCodeExchange(code: string) {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        if (!res.ok) throw new Error("Session exchange failed");
        window.location.href = "/admin";
      } catch {
        setError("Failed to establish session");
      }
    }

    async function setSessionCookies(data: Record<string, string>) {
      try {
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Set session failed");
        // Wait for cookie to be set, then redirect
        setTimeout(() => {
          window.location.href = "/admin";
        }, 500);
      } catch {
        setError("Failed to set session cookies");
      }
    }

    void handleCallback();
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold text-red-600">Login Failed</h1>
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <a
            href="/auth/login"
            className="inline-block rounded-md bg-[var(--accent)] text-white px-4 py-2 text-sm"
          >
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] mx-auto" />
        <p className="text-sm text-[var(--text-muted)]">Completing login…</p>
      </div>
    </div>
  );
}
