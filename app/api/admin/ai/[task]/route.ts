/**
 * Admin Route Handler: POST /api/admin/ai/[task]
 *
 * Proxies to the Supabase Edge Function for the given AI task.
 * Requires SUPABASE_SERVICE_ROLE_KEY — never exposed to the browser.
 * Human approval is always required before status passes "in_review".
 */
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ task: string }> };

const ALLOWED_TASKS = new Set([
  "ai-brief-generation",
  "ai-draft-generation",
  "ai-seo-aeo-geo-audit",
  "ai-diagram-generation",
]);

export async function POST(req: NextRequest, { params }: Params) {
  const { task } = await params;

  if (!ALLOWED_TASKS.has(task)) {
    return NextResponse.json({ error: "Unknown task" }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY." },
      { status: 503 }
    );
  }

  // Read article_id from form or JSON body
  let article_id: string | null = null;
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    article_id = (body.article_id as string | undefined) ?? null;
  } else {
    const form = await req.formData().catch(() => null);
    article_id = form?.get("article_id")?.toString() ?? null;
  }

  if (!article_id) {
    return NextResponse.json({ error: "article_id is required" }, { status: 400 });
  }

  // Verify caller is authenticated (reads session from cookie)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Invoke the Supabase Edge Function server-side with service role key
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set. Configure it in .env.local." },
      { status: 503 }
    );
  }

  const fnUrl = `${supabaseUrl}/functions/v1/${task}`;
  const fnRes = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ article_id }),
  });

  const fnBody = await fnRes.json().catch(() => ({ error: "Unparseable response from Edge Function" }));

  // Redirect back to the article editor page after action
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const redirectUrl = req.headers.get("referer") ?? `/admin/articles/${article_id}`;
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  return NextResponse.json(fnBody, { status: fnRes.status });
}
