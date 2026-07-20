import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { emptyArticleContent } from "@/lib/blocks/types";

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")    // remove special chars
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/-+/g, "-")             // collapse hyphens
    .replace(/^-|-$/g, "");          // trim hyphens
}

/**
 * POST /api/admin/articles
 * Creates a new article with an auto-generated slug.
 * Returns { article_id, slug } on success.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    working_title?: string;
    locale?: string;
    pillar_slug?: string;
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workingTitle = body.working_title?.trim();
  if (!workingTitle) {
    return NextResponse.json({ error: "working_title is required" }, { status: 400 });
  }

  const locale = body.locale ?? "en";
  if (locale !== "en" && locale !== "fr") {
    return NextResponse.json({ error: "locale must be 'en' or 'fr'" }, { status: 400 });
  }

  const slug = slugify(workingTitle);

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("locale", locale)
    .eq("slug", slug)
    .maybeSingle();

  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const { data, error } = await supabase
    .from("articles")
    .insert({
      working_title: workingTitle,
      slug: finalSlug,
      locale,
      translation_group_id: crypto.randomUUID(),
      pillar_slug: body.pillar_slug ?? null,
      status: body.status ?? "idea",
      content: emptyArticleContent(),
      author_id: user.id,
    })
    .select("id, slug, working_title")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    article_id: data.id,
    slug: data.slug,
    working_title: data.working_title,
  });
}
