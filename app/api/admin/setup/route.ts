/**
 * POST /api/admin/setup — Define admin password (one-time only).
 */
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("[setup] SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "NOT SET");
  console.log("[setup] SUPABASE_KEY:", supabaseKey ? `${supabaseKey.substring(0, 10)}...` : "NOT SET");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[setup] Missing Supabase credentials!");
    return NextResponse.json({ ok: false, error: "Configuration Supabase manquante." }, { status: 500 });
  }

  try {
    const body = await req.json() as { password?: string };
    if (!body.password || body.password.length < 4) {
      return NextResponse.json({ ok: false, error: "Minimum 4 caractères" }, { status: 400 });
    }

    // Check if already configured
    const checkRes = await fetch(`${supabaseUrl}/rest/v1/admin_credentials`, {
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
    });

    console.log("[setup] Check response status:", checkRes.status);

    if (checkRes.ok) {
      const countHeader = checkRes.headers.get("content-range")?.split("/")[1];
      const count = countHeader ? parseInt(countHeader) : 0;
      console.log("[setup] Existing rows:", count);
      if (count > 0) {
        return NextResponse.json(
          { ok: false, error: "Déjà configuré. Impossible de changer sans SQL Editor." },
          { status: 409 },
        );
      }
    } else {
      const errText = await checkRes.text();
      console.error("[setup] Check failed:", errText);
      return NextResponse.json(
        { ok: false, error: `Table introuvable ou erreur: ${errText.slice(0, 200)}` },
        { status: 500 },
      );
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

    const insertText = await insertRes.text();
    console.log("[setup] Insert response:", insertRes.status, insertText);

    if (!insertRes.ok) {
      return NextResponse.json(
        { ok: false, error: `Insertion échouée: ${insertText.slice(0, 300)}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, message: "Mot de passe défini avec succès." });
  } catch (err) {
    console.error("[setup] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: `Erreur serveur: ${err instanceof Error ? err.message : "Unknown"}` },
      { status: 500 },
    );
  }
}
