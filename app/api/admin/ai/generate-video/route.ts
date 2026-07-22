/**
 * POST /api/admin/ai/generate-video  — Create a video generation task
 * GET  /api/admin/ai/generate-video?taskId=xxx — Poll for completion
 *
 * Uses Agnes AI (agnes-video-v2.0) for async video generation.
 *
 * POST body: { prompt: string }
 * Returns:   { ok: true; taskId: string; status: "queued" }
 *
 * GET query: ?taskId=xxx
 * Returns: { ok: true; status: "queued"|"in_progress"|"completed"|"failed"; url?: string; error?: string }
 *
 * Auth: Same bearer-token pattern as other admin APIs — no @supabase/ssr for Cloudflare compat.
 */

import { NextRequest, NextResponse } from "next/server";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";
const AGNES_POLL_BASE = "https://apihub.agnes-ai.com";
const AGNES_API_KEY = process.env.AGNES_API_KEY ?? "";
const AGNES_VIDEO_MODEL = "agnes-video-v2.0";

// ────────────────────────────────────────────────────────────────────────────
// Auth helper (shared by POST and GET) — pure function, no SSR
// ────────────────────────────────────────────────────────────────────────────

async function verifyAuth(req: NextRequest): Promise<string | null> {
  // Check service role key via Authorization header
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceKey && req.headers.get("authorization") === `Bearer ${serviceKey}`) {
    return "owner";
  }

  // Check global bearer token
  const bearerToken = process.env.AUTH_BEARER_TOKEN;
  if (bearerToken && req.headers.get("authorization") === `Bearer ${bearerToken}`) {
    return "owner";
  }

  // Accept a cookie-based session
  const cookieStr = req.headers.get("cookie") ?? "";
  if (cookieStr.includes("sb-__access_token-")) {
    return "editor"; // minimum role when using cookies
  }

  return null; // not authenticated
}

// ────────────────────────────────────────────────────────────────────────────
// POST — Create a video generation task
// ────────────────────────────────────────────────────────────────────────────

async function handlePOST(req: NextRequest) {
  const userRole = await verifyAuth(req);
  if (!userRole) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { prompt?: string };
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "Prompt is required" }, { status: 400 });
  }

  if (!AGNES_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "AGNES_API_KEY not configured" },
      { status: 503 },
    );
  }

  // Call Agnes async video API
  const agnesRes = await fetch(`${AGNES_BASE}/videos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGNES_API_KEY}`,
    },
    body: JSON.stringify({
      model: AGNES_VIDEO_MODEL,
      prompt,
    }),
  });

  if (!agnesRes.ok) {
    const errText = await agnesRes.text();
    console.error("[agnes-video] Create error:", agnesRes.status, errText);
    return NextResponse.json(
      { ok: false, error: `Agnes API error: ${agnesRes.status}` },
      { status: 502 },
    );
  }

  const agnesData = await agnesRes.json() as { video_id?: string; id?: string };
  const taskId: string | undefined = agnesData.video_id ?? agnesData.id;

  if (!taskId) {
    return NextResponse.json(
      { ok: false, error: "No task ID in Agnes response" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    taskId,
    status: "queued" as const,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// GET — Poll video generation status
// ────────────────────────────────────────────────────────────────────────────

async function handleGET(req: NextRequest) {
  const userRole = await verifyAuth(req);
  if (!userRole) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const taskId = req.nextUrl.searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ ok: false, error: "taskId is required" }, { status: 400 });
  }

  if (!AGNES_API_KEY) {
    return NextResponse.json(
      { ok: false, error: "AGNES_API_KEY not configured" },
      { status: 503 },
    );
  }

  // Poll Agnes for video status
  const agnesRes = await fetch(
    `${AGNES_POLL_BASE}/agnesapi?video_id=${encodeURIComponent(taskId)}`,
    {
      headers: {
        Authorization: `Bearer ${AGNES_API_KEY}`,
      },
    },
  );

  if (!agnesRes.ok) {
    const errText = await agnesRes.text();
    console.error("[agnes-video] Poll error:", agnesRes.status, errText);
    return NextResponse.json(
      { ok: false, error: `Agnes poll error: ${agnesRes.status}` },
      { status: 502 },
    );
  }

  const agnesData = await agnesRes.json() as {
    status?: string; url?: string; video_url?: string; duration?: number; error?: string;
  };
  const status: string = agnesData.status ?? "in_progress";

  if (status === "completed") {
    const videoUrl: string | undefined = agnesData.url ?? agnesData.video_url;
    return NextResponse.json({
      ok: true,
      status: "completed" as const,
      url: videoUrl,
      duration: agnesData.duration,
    });
  }

  if (status === "failed") {
    return NextResponse.json({
      ok: true,
      status: "failed" as const,
      error: agnesData.error ?? "Video generation failed",
    });
  }

  return NextResponse.json({
    ok: true,
    status: "in_progress" as const,
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Route handler
// ────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    return await handlePOST(req);
  } catch (err) {
    console.error("[agnes-video] POST error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Video creation failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handleGET(req);
  } catch (err) {
    console.error("[agnes-video] GET error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Video poll failed" },
      { status: 500 },
    );
  }
}
