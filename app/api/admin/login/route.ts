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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    // Debug: log what we have (not the key itself!)
    console.log("[login] SUPABASE_URL:", supabaseUrl ? `Set (${supabaseUrl.substring(0, 20)}...)` : "NOT SET");
    console.log("[login] SERVICE_ROLE_KEY:", supabaseKey ? `Set (${supabaseKey.substring(0, 10)}...)` : "NOT SET");
    console.log("[login] ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "NOT SET");

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { ok: false, error: `Config missing: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}` },
        { status: 500 },
      );
    }

    console.log("[login] Fetching from Supabase...");

    const res = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    console.log("[login] Supabase response:", res.status);

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ ok: false, error: `Supabase error ${res.status}: ${errText.slice(0, 300)}` }, { status: 503 });
    }

    const text = await res.text();
    console.log("[login] Supabase data:", text);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: `Invalid response from Supabase: ${text.slice(0, 100)}` }, { status: 500 });
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Admin pas configuré. Appelez d'abord /admin/setup." },
        { status: 503 },
      );
    }

    const storedPassword = parsed[0].password;
    if (!storedPassword || storedPassword !== body.password) {
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
    console.log("[login] Session created for password match");
    return response;
  } catch (err) {
    console.error("[login] Unexpected error:", err);
    return NextResponse.json({ ok: false, error: `Unexpected: ${(err as Error).message}` }, { status: 500 });
  }
}
