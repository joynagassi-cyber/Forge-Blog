/**
 * Supabase client for Server Components and Route Handlers.
 * Uses raw fetch-based API (no cookie management) for Cloudflare Workers compatibility.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return null;
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_KEY);
}
