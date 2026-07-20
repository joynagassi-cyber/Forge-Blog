/**
 * Logout route — signs out the current user and redirects to the public site.
 *
 * GET /auth/logout
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component; middleware will refresh sessions
          }
        },
      },
    }
  );

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/en", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
}
