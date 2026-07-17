// scripts/seed-demo-articles.mjs
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envPath = new URL("../.env.local", import.meta.url);
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0 && process.env[line.slice(0, i).trim()] === undefined) {
      process.env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service role for admin seeding (bypasses RLS); fallback to anon
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Missing Supabase env vars"); process.exit(1); }

const sb = createClient(url, key);

const PILLAR_MAP = {
  "retention-memory": "a37d2450-c1bd-4b43-90fe-1d0083f35db9",
  "fsrs-algorithms": "b4ad0eaf-71f8-45a2-b281-e357c06c1e36",
  "active-learning": "e189f8a5-9fd7-4680-a1ba-5ab1b871ed60",
  "soc-onboarding": "46b793bf-bf40-4343-82a4-92375552fd2b",
  "ops-cyber": "03f03e8c-34f4-4039-aecc-1057996e75d4",
  "proof-of-skill": "63aedd8d-2824-4366-a4b2-4041f5647130",
};

const TG_UUIDS = {
  "tg-forgetting": "6a33ee2e-39c3-49a3-a984-e1d5f1c9c56d",
  "tg-soc": "3758f776-78db-40ca-9353-62df979fd323",
  "tg-fsrs": "5feb4ac0-2d40-4492-99da-237cb2e2586e",
  "tg-pos": "95200492-2788-4bfb-9d7c-4f6c014d52c1",
  "tg-imprint": "91af87ad-3da3-4f3f-b394-37eef4e6afc8",
  "tg-semanic-trees": "ede74978-de3b-48d9-8feb-b11462dfdc77",
};

const rows = [
  { id:"edbca852-239f-493c-aae9-69fd1f077564", slug:"forgetting-curve-spaced-repetition", locale:"en", tgId:"6a33ee2e-39c3-49a3-a984-e1d5f1c9c56d", title:"The forgetting curve is not your enemy", dek:"Why spacing beats cramming.", excerpt:"Ebbinghaus still holds.", pillar:"retention-memory", read_time:8, pub_at:"2026-06-12T10:00:00Z" },
  { id:"bc2cbf07-81de-4ec3-a735-d3743af52e68", slug:"courbe-oubli-repetition-espacee", locale:"fr", tgId:"6a33ee2e-39c3-49a3-a984-e1d5f1c9c56d", title:"La courbe d'oubli n'est pas votre ennemie", dek:"Pourquoi l'espacement bat le bachotage.", excerpt:"Ebbinghaus tient toujours.", pillar:"retention-memory", read_time:8, pub_at:"2026-06-12T10:00:00Z" },
  { id:"f4d00b4f-dd7e-467e-9ecf-a9190159055f", slug:"soc-onboarding-without-shadowing-forever", locale:"en", tgId:"3758f776-78db-40ca-9353-62df979fd323", title:"SOC onboarding without endless shadowing", dek:"New analysts need structure.", excerpt:"Shadowing is not a curriculum.", pillar:"soc-onboarding", read_time:10, pub_at:"2026-05-20T10:00:00Z" },
  { id:"68840661-847a-47d1-910a-a753008abacc", slug:"onboarding-soc-sans-ombre-infinie", locale:"fr", tgId:"3758f776-78db-40ca-9353-62df979fd323", title:"Onboarding SOC sans ombre infinie", dek:"Les nouveaux analystes ont besoin de structure.", excerpt:"L'ombre n'est pas un curriculum.", pillar:"soc-onboarding", read_time:10, pub_at:"2026-05-20T10:00:00Z" },
  { id:"e0774e8c-9ce0-4fda-9cb4-a819a2b8591d", slug:"sm-2-vs-fsrs", locale:"en", tgId:"5feb4ac0-2d40-4492-99da-237cb2e2586e", title:"SM-2 vs FSRS: what actually changed", dek:"A clear comparison.", excerpt:"FSRS models memory more honestly than SM-2.", pillar:"fsrs-algorithms", read_time:7, pub_at:"2026-04-08T10:00:00Z" },
  { id:"de0d13f7-1def-474f-99b5-2565598c9bd0", slug:"sm-2-vs-fsrs", locale:"fr", tgId:"5feb4ac0-2d40-4492-99da-237cb2e2586e", title:"SM-2 vs FSRS : ce qui a vraiment changé", dek:"Comparaison claire.", excerpt:"FSRS modélise la mémoire plus honnêtement.", pillar:"fsrs-algorithms", read_time:14, pub_at:"2026-04-08T10:00:00Z" },
  { id:"ce8ed523-164a-45b7-aa9f-2278fb9b2522", slug:"proof-of-skill-not-hours", locale:"en", tgId:"95200492-2788-4bfb-9d7c-4f6c014d52c1", title:"Proof of skill, not hours in seat", dek:"Readiness metrics that survive an audit.", excerpt:"Hours logged is a poor proxy.", pillar:"proof-of-skill", read_time:6, pub_at:"2026-03-18T10:00:00Z" },
  { id:"3594488d-ddbf-41ff-ad4d-e84583dc445a", slug:"imprint-active-encoding", locale:"en", tgId:"91af87ad-3da3-4f3f-b394-37eef4e6afc8", title:"IMPRINT: active encoding while you browse", dek:"Capture meaning at the moment of learning.", excerpt:"Passive highlights die.", pillar:"active-learning", read_time:5, pub_at:"2026-02-10T10:00:00Z" },
  { id:"ea827264-8165-4a90-902e-9d9ae520c9f1", slug:"semantic-trees-knowledge-structure", locale:"en", tgId:"ede74978-de3b-48d9-8feb-b11462dfdc77", title:"Semantic trees and the structure of knowledge", dek:"Organizing information into meaningful hierarchies.", excerpt:"Isolated facts are fragile.", pillar:"ops-cyber", read_time:10, pub_at:"2026-07-01T10:00:00Z" },
  { id:"8db56f40-f02a-4c3d-abe1-9d6e1ebc6680", slug:"arbres-semantiques-structure-connaissance", locale:"fr", tgId:"ede74978-de3b-48d9-8feb-b11462dfdc77", title:"Arbres sémantiques et structure de la connaissance", dek:"Organiser l'information en hiérarchies significatives.", excerpt:"Une information isolée est fragile.", pillar:"ops-cyber", read_time:10, pub_at:"2026-07-01T10:00:00Z" },
];

async function main() {
  console.log(`${PILLAR_MAP.size ? 6 : 0} pillars in static map.`);

  let ok = 0;
  for (const r of rows) {
    const pid = PILLAR_MAP[r.pillar];
    if (!pid) { console.warn(` skip ${r.id}: unknown pillar ${r.pillar}`); continue; }

    const content = {
      version: 1,
      sequence: [
        { type:"hero_meta", title:r.title, dek:r.dek, author:"Joy Nagassi", publishedAt:r.pub_at, readTimeMinutes:r.read_time, pillarSlug:r.pillar, pillarName:r.pillar },
        { type:"key_takeaway", items:["Content being seeded."] },
        { type:"toc_anchor" },
        { type:"body_blocks", blocks:[{ id:"p1", type:"paragraph", spans:[{ text:r.excerpt }] }] },
        { type:"conversion_block", product: r.pillar.startsWith("soc") ? "scyforge" : "nainoforge", headline:"", body:"", ctaLabel:"", ctaHref:"" },
        { type:"related_articles_anchor" },
      ],
    };

    const { error } = await sb.from("articles").upsert({
      id: r.id,
      slug: r.slug,
      locale: r.locale,
      translation_group_id: r.tgId,
      working_title: r.title,
      title: r.title,
      dek: r.dek,
      excerpt: r.excerpt,
      content,
      status: "published",
      pillar_id: pid,
      read_time_minutes: r.read_time,
      published_at: r.pub_at,
    }, { onConflict: "id" });

    if (error) console.error(`  error ${r.id}: ${error.message}`);
    else { ok++; console.log(`  ok ${r.id} → ${r.slug}`); }
  }

  console.log(`\nDone: ${ok}/${rows.length} articles seeded.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
