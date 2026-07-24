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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Query all credentials (no eq filter to avoid PostgREST encoding issues)
    const res = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal",
      },
    });

    if (!res.ok) {
      console.error("[api/admin/login] Table query failed:", await res.text());
      return NextResponse.json({ ok: false, error: "Service indisponible" }, { status: 503 });
    }

    // Get the stored password from the row
    const { data } = await res.json() as { data: Array<{ password: string }> | null };

    if (!data || data.length === 0) {
      return NextResponse.json({ ok: false, error: "Admin n'est pas configuré. Appelez d'abord /api/admin/setup." }, { status: 503 });
    }

    // Compare passwords
    const storedPassword = data[0].password;
    if (!storedPassword || storedPassword !== body.password) {
      return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
    }

    // Generate session token
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
