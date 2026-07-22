/**
 * Auth callback route — handles the OAuth redirect from Google/Supabase.
 *
 * Flow:
 *   1. User clicks "Sign in with Google" on /auth/login
 *   2. Google OAuth → redirects back to /auth/callback?code=xxx
 *   3. This route exchanges the code for a Supabase session
 *   4. Redirects to ?next (default: /admin)
 *
 * Uses direct Supabase client without @supabase/ssr for Cloudflare Workers compatibility.
 */
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=No authorization code received`
    );
  }

  // Use direct Supabase client (no SSR cookie management)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Exchange failed:", error.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    );
  }

  // Set session cookies manually for Cloudflare edge compatibility
  if (data.session) {
    const response = NextResponse.redirect(
      `${origin}${next.startsWith("/") ? next : `/${next}`}`
    );

    response.cookies.set("sb-__access_token-", data.session.access_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.session.expires_in,
    });

    response.cookies.set("sb-__refresh_token-", data.session.refresh_token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: data.session.expires_in,
    });

    return response;
  }

  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : `/${next}`}`);
}
