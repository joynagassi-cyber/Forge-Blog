/**
 * POST /api/admin/setup — Define admin password (one-time only).
 * Password is hashed with PBKDF2 (SHA-256, 100k iterations) and stored in Supabase `admin_credentials`.
 * If the table doesn't exist yet, creates it automatically.
 */
import { NextRequest, NextResponse } from "next/server";

async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(32));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedKey = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256,
  );

  return {
    hash: uint8ToBase64(new Uint8Array(derivedKey)),
    salt: uint8ToBase64(salt),
  };
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // 1. Ensure table exists
    await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "POST",
      headers: {
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify({}),
    });

    // Check if row already exists (admin already configured)
    const checkRes = await fetch(
      `${supabaseUrl}/rest/v1/admin_credentials?select=id&limit=1`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
      },
    );

    if (checkRes.ok) {
      const count = Number(checkRes.headers.get("content-range")?.split("/")[1] ?? "0");
      if (count > 0) {
        return NextResponse.json(
          { ok: false, error: "Admin déjà configuré. Contactez un super-admin pour changer le mot de passe." },
          { status: 409 },
        );
      }
    }

    // 2. Hash password
    const { hash, salt } = await hashPassword(body.password);

    // 3. Store in Supabase
    const insertRes = await fetch(
      `${supabaseUrl}/rest/v1/admin_credentials`,
      {
        method: "POST",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ password_hash: hash, salt }),
      },
    );

    if (!insertRes.ok) {
      // Table might not exist — create it via Supabase Edge Function or RPC
      return NextResponse.json(
        {
          ok: false,
          error: "Table admin_credentials introuvable. Exécutez ce SQL dans Supabase Dashboard:",
          sql: "CREATE TABLE public.admin_credentials (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Mot de passe administrateur défini avec succès.",
    });
  } catch (err) {
    console.error("[api/admin/setup] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
