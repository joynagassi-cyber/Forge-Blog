/**
 * POST /api/admin/login — Vérifier le mot de passe.
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password) {
      return NextResponse.json(
        { ok: false, error: "Mot de passe requis" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Query password from Supabase
    const res = await fetch(`${supabaseUrl}/rest/v1/admin_credentials?password=eq.${encodeURIComponent(body.password)}&select=id,created_at`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Service indisponible" }, { status: 503 });
    }

    // Read response as text first to check content-range header
    const text = await res.text();
    const countHeader = res.headers.get("content-range")?.split("/")[1];
    const count = countHeader ? parseInt(countHeader) : 0;

    if (count === 0) {
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
    }

    const data = JSON.parse(text);

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresIn = 60 * 60 * 24 * 7; // 7 days

    // Store session in DB
    await fetch(`${supabaseUrl}/rest/v1/admin_sessions`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_token: sessionToken,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      }),
    }).catch(() => {}); // Non-critical

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
    console.error("[api/admin/login] Error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
