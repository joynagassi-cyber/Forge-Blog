/**
 * Admin upload API — Server Action + Route Handler hybrid.
 *
 * POST /api/admin/upload
 * Body: FormData with `file` (File) and optional `prefix` (string)
 *
 * Returns: { ok: true, url: string, alt: string }
 *          or { ok: false, error: string }
 *
 * Security: requires authenticated user with role owner/administrator/editor/author
 * Auth: Bearer token or cookie-based session — no @supabase/ssr for Cloudflare compat.
 */

import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/** Verify auth via bearer token or session cookie */
async function verifyAuth(reqObj: NextRequest): Promise<string | null> {
  // Check service role key directly
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requestAuth = reqObj.headers.get("authorization") ?? reqObj.headers.get("x-supabase-api-key");

  if (serviceKey && (requestAuth === `Bearer ${serviceKey}` || requestAuth === serviceKey)) {
    return "owner";
  }

  // Check global AUTH_BEARER_TOKEN
  const bearerToken = process.env.AUTH_BEARER_TOKEN;
  if (bearerToken && requestAuth === `Bearer ${bearerToken}`) {
    return "owner";
  }

  // Accept a cookie-based session
  const cookieStr = reqObj.headers.get("cookie") ?? "";
  if (cookieStr.includes("sb-__access_token-")) {
    return "editor";
  }

  return null; // not authenticated
}

export async function POST(req: NextRequest) {
  try {
    // --- 1. Auth check ---
    const userRole = await verifyAuth(req);
    if (!userRole) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["owner", "administrator", "editor", "author"];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // --- 2. Parse form data ---
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawPrefix = (formData.get("prefix") as string) || "inline/";
    const allowedPrefixes = ["covers/", "inline/", "avatars/"];
    const prefix = allowedPrefixes.includes(rawPrefix) ? rawPrefix : "inline/";

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // --- 3. Validate ---
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported type: ${file.type}` },
        { status: 400 },
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB` },
        { status: 400 },
      );
    }

    // --- 4. Upload to Supabase Storage (direct fetch — Cloudflare compatible) ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const ext = getExtension(file.type);
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const filePath = `${prefix}${fileName}`;

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${filePath}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "x-upsert": "false",
          "cache-control": "31536000",
          "Content-Type": file.type,
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error("[upload] Supabase storage error:", errBody);
      return NextResponse.json({ ok: false, error: `Upload failed: ${errBody}` }, { status: 500 });
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`;
    const alt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      alt,
    });
  } catch (err) {
    console.error("[upload] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}

function getExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
  };
  return map[mime] ?? ".jpg";
}
