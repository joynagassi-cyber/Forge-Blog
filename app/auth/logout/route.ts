/**
 * Logout route — clears the Supabase session cookie and redirects to the public site.
 * Pure cookie manipulation — no @supabase/ssr dependency for Cloudflare compatibility.
 */
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.redirect(
    new URL("/en", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  );

  // Clear Supabase auth cookies
  response.cookies.set("sb-__access_token-", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-__refresh_token-", "", { maxAge: 0, path: "/" });
  response.cookies.set("sb-__token-", "", { maxAge: 0, path: "/" });

  return response;
}
