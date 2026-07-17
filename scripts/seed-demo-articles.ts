/**
 * Seed demo articles into Supabase.
 * Run with: npx tsx scripts/seed-demo-articles.ts
 */

import { createClient } from "@supabase/supabase-js";
import { DEMO_ARTICLES } from "../lib/content/demo-articles";
import { PILLARS } from "../lib/pillars/mapping";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(url, key);

async function main() {
  // Fetch pillar IDs
  const { data: pillars } = await sb.from("pillars").select("slug, id");
  const pillarMap = new Map(pillars?.map((p) => [p.slug, p.id]) ?? []);
  console.log(`Pillars loaded: ${pillarMap.size}`);

  let inserted = 0;
  for (const art of DEMO_ARTICLES) {
    const pillarId = pillarMap.get(art.pillar_slug);
    if (!pillarId) {
      console.warn(`  skip ${art.id}: no pillar ${art.pillar_slug}`);
      continue;
    }

    const { data, error } = await sb
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
      )
      .select();

    if (error) {
      console.error(`  error ${art.id}: ${error.message}`);
    } else {
      inserted++;
      console.log(`  ✔ ${art.id} → ${art.slug}`);
    }
  }

  console.log(`\nDone. ${inserted}/${DEMO_ARTICLES.length} articles inserted/updated.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
