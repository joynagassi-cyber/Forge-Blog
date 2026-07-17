/**
 * Seed demo articles into Supabase.
 * Run with: node scripts/seed-demo-articles.js
 * Reads .env.local automatically.
 */

const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      const v = trimmed.slice(eq + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const { createClient } = require("@supabase/supabase-js");
const { DEMO_ARTICLES } = require("../lib/content/demo-articles.js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(url, key);

(async () => {
  const { data: pillars } = await sb.from("pillars").select("slug, id");
  const pillarMap = new Map((pillars || []).map((p) => [p.slug, p.id]));
  console.log(`Pillars loaded: ${pillarMap.size}`);

  let inserted = 0;
  for (const art of DEMO_ARTICLES) {
    const pillarId = pillarMap.get(art.pillar_slug);
    if (!pillarId) {
      console.warn(`  skip ${art.id}: no pillar ${art.pillar_slug}`);
      continue;
    }

    const { error } = await sb
      .from("articles")
      .upsert(
        {
          id: art.id,
          slug: art.slug,
          locale: art.locale,
          translation_group_id: art.translation_group_id,
          working_title: art.title,
          title: art.title,
          dek: art.dek,
          excerpt: art.excerpt,
          content: art.content,
          status: "published",
          pillar_id: pillarId,
          read_time_minutes: art.read_time_minutes,
          published_at: art.published_at,
          featured: art.featured ?? false,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(`  error ${art.id}: ${error.message}`);
    } else {
      inserted++;
      console.log(`  ok ${art.id} → ${art.slug}`);
    }
  }

  console.log(`\nDone. ${inserted}/${DEMO_ARTICLES.length} articles inserted/updated.`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
