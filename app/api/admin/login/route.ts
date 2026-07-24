/**
 * POST /api/admin/login — Verify password against Supabase admin_credentials table.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Mot de passe requis" }, { status: 400 });
    }

    // Try multiple possible env var names for Supabase key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ??
                       process.env.SUPABASE_SECRET_KEY ??
                       process.env.SUPABASE_URL_SECRET_KEY;

    console.log("[login] SUPABASE_URL:", !!supabaseUrl);
    console.log("[login] SERVICE_KEY:", !!serviceKey);
    console.log("[login] NEXT_PUBLIC_ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: `Config: URL=${!!supabaseUrl} KEY=${!!serviceKey}` }, { status: 500 });
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("[login] Fetch failed:", res.status, errText);
        return NextResponse.json({ ok: false, error: `Fetch ${res.status}: ${errText.slice(0, 200)}` }, { status: 503 });
      }

      const text = await res.text();
      let parsed;
      try { parsed = JSON.parse(text); }
      catch { return NextResponse.json({ ok: false, error: `Invalid JSON: ${text.slice(0, 100)}` }, { status: 500 }); }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return NextResponse.json({ ok: false, error: "Non configuré. Appelez /admin/setup d'abord." }, { status: 503 });
      }

      const storedPassword = parsed[0].password;
      if (storedPassword !== body.password) {
        return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
      }

      const sessionToken = crypto.randomUUID();
      const expiresIn = 60 * 60 * 24 * 7;

      const response = NextResponse.json({ ok: true, session_token: sessionToken });
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
        path: "/",
      });
      console.log("[login] SUCCESS");
      return response;
    } catch (fetchErr) {
      console.error("[login] Network error:", fetchErr);
      return NextResponse.json({ ok: false, error: `Network: ${(fetchErr as Error).message}` }, { status: 503 });
    }
  } catch (err) {
    console.error("[login] General error:", err);
    return NextResponse.json({ ok: false, error: `General: ${(err as Error).message}` }, { status: 500 });
  }
}
