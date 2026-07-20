"use client";

import { createClient } from "@/lib/supabase/client";
import { ForgeLogo } from "@/components/shared/ForgeLogo";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin";
  const errorParam = searchParams.get("error");
  const [error, setError] = useState(errorParam ?? "");
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
    }
    // If no error, the browser navigates away to Google OAuth
  }, [redirectTo]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--surface-1)] p-8 shadow-[var(--shadow)] space-y-6">
        <div className="flex justify-center">
          <ForgeLogo locale="en" variant="header" />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
            Editorial access
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Sign in with your Google account to manage articles.
          </p>
        </div>

        {error && (
          <div
            className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-2 text-xs text-red-700 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-3 rounded-md border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-[var(--accent)]" />
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <p className="text-xs text-center text-[var(--text-muted)]">
          Only authorized editors can access this area.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-muted)] border-t-[var(--accent)]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
