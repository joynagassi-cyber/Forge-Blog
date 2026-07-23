import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password || body.password.length < 4) {
      return NextResponse.json({ ok: false, error: "Minimum 4 caractères" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Check if already configured
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/admin_credentials?select=id&limit=1`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` },
    });

    if (checkRes.ok) {
      const countHeader = checkRes.headers.get("content-range")?.split("/")[1];
      if (countHeader && parseInt(countHeader) > 0) {
        return NextResponse.json({ ok: false, error: "Déjà configuré. Impossible de changer sans SQL Editor." }, { status: 409 });
      }
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ password: body.password }),
    });

    if (!insertRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Table introuvable. Créez-la d'abord dans Supabase SQL Editor.",
          sql: "CREATE TABLE IF NOT EXISTS public.admin_credentials (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), password TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Mot de passe défini." });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Erreur serveur" }, { status: 500 });
  }
}
