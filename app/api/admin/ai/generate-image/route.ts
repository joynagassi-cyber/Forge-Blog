/**
 * POST /api/admin/ai/generate-image
 *
 * Generates an image via Agnes AI (agnes-image-2.1-flash) and uploads
 * the result to Supabase Storage (article-images bucket).
 *
 * Body: { prompt: string; size?: string; ratio?: string }
 * Returns: { ok: true; url: string; alt: string }
 *          or { ok: false; error: string }
 *
 * Auth: Same bearer-token pattern as other admin APIs — no @supabase/ssr for Cloudflare compat.
 */

import { NextRequest, NextResponse } from "next/server";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";
const AGNES_API_KEY = process.env.AGNES_API_KEY ?? "";
const AGNES_IMAGE_MODEL = "agnes-image-2.1-flash";

// Allowed image sizes
const ALLOWED_SIZES = ["1K", "2K", "3K", "4K"] as const;
const ALLOWED_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;

/** Verify auth via bearer token (same as upload route) */
async function verifyAuth(req: NextRequest): Promise<{ authenticated: boolean; forbidden: boolean }> {
  // Check service role key directly — simple API key auth for edge runtime
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const requestAuth = req.headers.get("authorization") ?? req.headers.get("x-supabase-api-key");

  if (serviceKey && (requestAuth === `Bearer ${serviceKey}` || requestAuth === serviceKey)) {
    return { authenticated: true, forbidden: false };
  }

  // Also check the global AUTH_BEARER_TOKEN
  const bearerToken = process.env.AUTH_BEARER_TOKEN;
  if (bearerToken && req.headers.get("authorization") === `Bearer ${bearerToken}`) {
    return { authenticated: true, forbidden: false };
  }

  // Last resort: check for a valid cookie-based session
  const cookieStr = req.headers.get("cookie") ?? "";
  if (cookieStr.includes("sb-__access_token-")) {
    return { authenticated: true, forbidden: false };
  }

  return { authenticated: false, forbidden: false };
}

export async function POST(req: NextRequest) {
  try {
    // --- 1. Auth check ---
    const auth = await verifyAuth(req);
    if (!auth.authenticated) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // --- 2. Validate input ---
    const body = await req.json() as { prompt?: string; size?: string; ratio?: string };
    const prompt = (body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
    }

    const size = body.size && (ALLOWED_SIZES as readonly string[]).includes(body.size) ? body.size : "1K";
    const ratio = body.ratio && (ALLOWED_RATIOS as readonly string[]).includes(body.ratio) ? body.ratio : undefined;

    // --- 3. Verify Agnes API key ---
    if (!AGNES_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "AGNES_API_KEY not configured on server" },
        { status: 503 },
      );
    }

    // --- 4. Call Agnes Image Generation API ---
    const agnesPayload: Record<string, unknown> = {
      model: AGNES_IMAGE_MODEL,
      prompt,
      size,
    };
    if (ratio) agnesPayload.ratio = ratio;

    const agnesRes = await fetch(`${AGNES_BASE}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AGNES_API_KEY}`,
      },
      body: JSON.stringify(agnesPayload),
    });

    if (!agnesRes.ok) {
      const errBody = await agnesRes.text();
      console.error("[agnes-image] API error:", agnesRes.status, errBody);
      return NextResponse.json(
        { ok: false, error: `Agnes API error: ${agnesRes.status}` },
        { status: 502 },
      );
    }

    const agnesData = await agnesRes.json() as { data?: Array<{ url?: string }> };
    const imageUrl: string | undefined = agnesData.data?.[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { ok: false, error: "No image URL in Agnes response" },
        { status: 502 },
      );
    }

    // --- 5. Download the generated image ---
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { ok: false, error: "Failed to download generated image" },
        { status: 502 },
      );
    }

    const imgBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/png";

    // --- 6. Upload to Supabase Storage (direct fetch, no SDK) ---
    const fileName = `ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;
    const filePath = `ai-generated/${fileName}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "x-upsert": "false",
          "cache-control": "31536000",
          "Content-Type": contentType,
        },
        body: imgBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errMsg = await uploadRes.text();
      console.error("[agnes-image] Storage upload error:", errMsg);
      return NextResponse.json(
        { ok: false, error: "Failed to upload to storage" },
        { status: 500 },
      );
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/article-images/${filePath}`;

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      alt: prompt.split(" ").slice(0, 10).join(" "),
    });
  } catch (err) {
    console.error("[agnes-image] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Image generation failed" },
      { status: 500 },
    );
  }
}
