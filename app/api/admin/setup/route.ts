/**
 * POST /api/admin/setup — Define admin password (one-time only).
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password || body.password.length < 4) {
      return NextResponse.json({ ok: false, error: "Minimum 4 caractères" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Check if already configured by querying all rows
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    if (checkRes.ok) {
      const countHeader = checkRes.headers.get("content-range")?.split("/")[1];
      const count = countHeader ? parseInt(countHeader) : 0;
      if (count > 0) {
        return NextResponse.json(
          { ok: false, error: "Déjà configuré. Impossible de changer sans SQL Editor." },
          { status: 409 },
        );
      }
    }

    // Insert the password
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password: body.password }),
    });

    if (!insertRes.ok) {
      const errText = await insertRes.text();
      console.error("[api/admin/setup] Insert failed:", errText);
      return NextResponse.json(
        {
          ok: false,
          error: "Impossible d'insérer le mot de passe. Vérifie que la table admin_credentials existe.",
          details: errText.slice(0, 200),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Mot de passe défini avec succès." });
  } catch (err) {
    console.error("[api/admin/setup] Error:", err);
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
