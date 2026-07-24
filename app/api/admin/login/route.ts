/**
 * POST /api/admin/login — Verify password against Supabase.
 * Fetches ALL rows and compares the FIRST one.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Mot de passe requis" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ ok: false, error: `Config: URL=${!!supabaseUrl} KEY=${!!serviceKey}` }, { status: 500 });
    }

    // Fetch ALL credentials — no filter at all
    const res = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      headers: {
        "apikey": serviceKey,
        "Authorization": `Bearer ${serviceKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ ok: false, error: `Fetch ${res.status}: ${errText.slice(0, 200)}` }, { status: 503 });
    }

    const text = await res.text();
    let parsed: Array<{ password: string }> | null;
    try { parsed = JSON.parse(text); }
    catch { return NextResponse.json({ ok: false, error: `Bad JSON: ${text.slice(0, 100)}` }, { status: 500 }); }

    console.log("[login] Fetched", parsed?.length ?? 0, "credentials");

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json({ ok: false, error: "Admin pas configuré. Appelez /admin/setup d'abord." }, { status: 503 });
    }

    // Compare against EACH stored password (should only be one row)
    const match = parsed.some(row => row.password === body.password);
    if (!match) {
      console.log("[login] Password mismatch. Given:", body.password, "Stored:", parsed.map(r => r.password));
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
    }

    console.log("[login] Password match!");

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
    return response;
  } catch (err) {
    console.error("[login] Error:", err);
    return NextResponse.json({ ok: false, error: `Error: ${(err as Error).message}` }, { status: 500 });
  }
}
