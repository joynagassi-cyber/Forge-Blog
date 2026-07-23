/**
 * POST /api/auth/session — Set Supabase session cookies server-side.
 * Called by the auth callback page after OAuth redirect.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: string;
      code?: string;
    };

    // Direct token set (from hash fragment redirect)
    if (body.access_token) {
      return setSessionCookies(body);
    }

    return NextResponse.json(
      { ok: false, error: "No access token provided" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[api/auth/session] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function setSessionCookies(body: Record<string, unknown>): Promise<NextResponse> {
  const accessToken = body.access_token as string;
  const refreshToken = (body.refresh_token as string) ?? "";
  const expiresIn = Number((body.expires_in as string) ?? "3600");

  const response = NextResponse.json({ ok: true });

  // Use secure flag only in production (HTTPS on Render).
  // In dev (localhost), secure=false so cookies work over HTTP.
  response.cookies.set("sb-__access_token-", accessToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  });

  response.cookies.set("sb-__refresh_token-", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  });

  return response;
}
