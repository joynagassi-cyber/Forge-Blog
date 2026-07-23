/**
 * POST /api/admin/login — Authenticate admin by password.
 * Password is hashed with argon2-like PBKDF2 and compared against the stored hash in Supabase.
 * No email, no recovery — only the secret password works.
 */
import { NextRequest, NextResponse } from "next/server";

const SALT_KEY = "admin_auth_salt";
const HASH_KEY = "admin_auth_hash";

async function deriveKeyFromPassword(password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const saltRaw = await getSalt();
  const salt = base64ToUint8(saltRaw);

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

  return new Uint8Array(derivedKey);
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getSalt(): Promise<string> {
  const supabase = await import("@/lib/supabase/server").then((m) => m.createClient());
  if (!supabase) return "";

  const { data } = await supabase.from("admin_credentials").select("*").limit(1).single();
  return data?.salt ?? "";
}

async function setEnvVar(key: string, value: string) {
  // For server-side: just use a constant. In production, admin sets it via /api/admin/setup.
  console.warn(`[admin] Env var ${key} should be set via setup endpoint, not env`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { password?: string };
    if (!body.password) {
      return NextResponse.json({ ok: false, error: "Mot de passe requis" }, { status: 400 });
    }

    const salt = await getSalt();
    if (!salt) {
      return NextResponse.json(
        { ok: false, error: "Admin n'est pas configuré. Contactez l'administrateur." },
        { status: 503 }
      );
    }

    const derived = await deriveKeyFromPassword(body.password);
    const derivedB64 = uint8ToBase64(derived);

    // Compare stored hash with derived hash
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Service indisponible" }, { status: 503 });
    }

    const { data } = await supabase.from("admin_credentials").select("*").limit(1).single();
    if (!data || !data.password_hash) {
      return NextResponse.json(
        { ok: false, error: "Admin n'est pas configuré." },
        { status: 503 }
      );
    }

    if (derivedB64 === data.password_hash) {
      // Generate session token
      const sessionToken = crypto.randomUUID();
      const expiresIn = 60 * 60 * 24 * 7; // 7 days

      // Save session to DB (temporary)
      await supabase.from("admin_sessions").insert({
        session_token: sessionToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      });

      const response = NextResponse.json({ ok: true, session_token: sessionToken });
      response.cookies.set("admin_session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: expiresIn,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 });
  } catch (err) {
    console.error("[api/admin/login] Error:", err);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
