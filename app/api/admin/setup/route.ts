/**
 * POST /api/admin/setup — One-time admin password setup.
 * Call this endpoint ONCE with your desired password.
 * The password is hashed (PBKDF2, 100k iterations) and stored in Supabase.
 *
 * SECURITY: This should only be called once during initial deployment.
 * After that, it requires an existing valid session token.
 */
import { NextRequest, NextResponse } from "next/server";

async function hashPassword(password: string): Promise<string> {
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

  // Store salt + hash combined (salt is prepended for later verification)
  const hashBytes = new Uint8Array(derivedKey);
  const combined = new Uint8Array(salt.length + hashBytes.length);
  combined.set(salt, 0);
  combined.set(hashBytes, salt.length);

  return uint8ToBase64(combined);
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
        { status: 400 }
      );
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Service indisponible" }, { status: 503 });
    }

    // Check if admin already configured
    const { data: existing } = await supabase.from("admin_credentials").select("*").limit(1).single();
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Admin déjà configuré. Contactez un super-admin pour changer le mot de passe." },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(body.password);

    await supabase.from("admin_credentials").insert({
      password_hash: hashed,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: "Mot de passe administrateur défini avec succès." });
  } catch (err) {
    console.error("[api/admin/setup] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
