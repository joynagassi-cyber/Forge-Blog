import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/admin/login — Verify password and set session cookie.
 * This is the ONLY place the password is verified — never exposed in static HTML.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Mot de passe requis" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Query matching password
    const res = await fetch(
      `${supabaseUrl}/rest/v1/admin_credentials?password=eq.${encodeURIComponent(body.password)}&select=id,created_at`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "Service indisponible" }, { status: 503 });
    }

    const text = await res.text();
    const countHeader = res.headers.get("content-range")?.split("/")[1];
    const count = countHeader ? parseInt(countHeader) : 0;

    if (count === 0) {
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
    }

    // Generate session
    const sessionToken = crypto.randomUUID();
    const expiresIn = 60 * 60 * 24 * 7; // 7 jours

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
