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
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/svg+xml",
];

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    // --- 1. Auth check via Supabase ---
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // read-only in Route Handler context
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["owner", "administrator", "editor", "author"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // --- 2. Parse form data ---
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    // Sanitise prefix to prevent path traversal — only allow known prefixes
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

    // --- 4. Upload to Supabase Storage ---
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const adminSupabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // read-only
        },
      },
    });

    const ext = getExtension(file.type);
    const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const filePath = `${prefix}${fileName}`;

    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("article-images")
      .upload(filePath, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[upload] Supabase storage error:", uploadError);
      return NextResponse.json({ ok: false, error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = adminSupabase.storage
      .from("article-images")
      .getPublicUrl(uploadData.path);

    const alt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
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
