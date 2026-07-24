/**
 * Supabase browser client for OAuth login (client-side only).
 * Uses Next.js NEXT_PUBLIC_ env vars — properly injected at build time.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabase: any | null = null;

export function createClient() {
  if (_supabase) return _supabase;

  // Use __NEXT_PUBLIC__ prefixed vars — these are server-exposed at compile time
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

  if (!url || !key) {
    console.error("[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY");
    return null;
  }

  try {
    // Dynamic import to avoid SSR bundling issues
    const { createBrowserClient } = require("@supabase/ssr");
    _supabase = createBrowserClient(url, key, {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    });
  } catch {
    // Fallback: raw client
    const { createClient: rawCreate } = require("@supabase/supabase-js");
    _supabase = rawCreate(url, key);
  }

  return _supabase;
}
