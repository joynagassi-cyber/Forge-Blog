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

    // If we got a code, exchange it for a session via Supabase API
    if (body.code) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: "",
          password: "",
          gotrue_meta_security: { captcha_token: "" },
        }),
      });

      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: "Session exchange failed" },
          { status: 400 }
        );
      }

      const data = await res.json();
      return setSessionCookies(data);
    }

    // Direct token set
    if (body.access_token) {
      return setSessionCookies(body);
    }

    return NextResponse.json(
      { ok: false, error: "No access token or code provided" },
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
  const refreshToken = body.refresh_token as string;
  const expiresIn = Number(body.expires_in) ?? 3600;

  const response = NextResponse.json({ ok: true });

  response.cookies.set("sb-__access_token-", accessToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  });

  response.cookies.set("sb-__refresh_token-", refreshToken || "", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: expiresIn,
  });

  return response;
}
