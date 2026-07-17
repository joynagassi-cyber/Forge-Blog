import { createClient } from "@/lib/supabase/server";
import { type ArticleContent } from "@/lib/blocks/types";
import { validateArticleContent } from "@/lib/blocks/validate";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/admin/articles/[id]
 * Body: { content: ArticleContent }
 * Updates the article content and returns validation issues.
 * Requires auth (checked server-side).
 */
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;

  let body: { content?: ArticleContent };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = body.content;
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const issues = validateArticleContent(content);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return NextResponse.json(
      { error: "Scaffold validation failed", issues: errors },
      { status: 422 }
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("articles")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    article_id: id,
    warnings: issues.filter((i) => i.severity === "warning"),
  });
}

/**
 * GET /api/admin/articles/[id]
 * Returns the current article content for client-side hydration.
 * Requires auth.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("articles")
    .select("content")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ content: data?.content ?? null });
}
