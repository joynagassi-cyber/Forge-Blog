/**
 * Supabase browser client — used in client-side components only.
 * For server-side, use lib/supabase/server.ts instead.
 *
 * NOTE: This is kept for backwards compatibility. In production on Cloudflare,
 * auth state comes from cookies set by /auth/callback.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (window as any).__supabase_client as any | undefined;
  if (supabase) return supabase;

  try {
    // Dynamic import to avoid bundling SSR-related code
    // In practice this only runs in the browser
    const mod = require("@supabase/supabase-js");
    const client = mod.createClient(SUPABASE_URL, SUPABASE_KEY);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__supabase_client = client;
    return client;
  } catch {
    // If module resolution fails (e.g., during build), return null
    return null;
  }
}
