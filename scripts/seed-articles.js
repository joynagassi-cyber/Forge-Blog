const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

// --- minimal .env.local loader (no dotenv dep needed) ---
function loadEnv() {
  const p = require("path").join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const raw of fs.readFileSync(p, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

// Hand-authored SQL rows for the 6 demo articles
// Format: id | slug | locale | translation_group_id | working_title | title | dek | excerpt
//         | pillar_id | read_time | published_at | featured | content_json
const rows = [
  {
    id: "a1-en",
    slug: "forgetting-curve-spaced-repetition",
    locale: "en",
    translation_group_id: "tg-forgetting",
    title: "The forgetting curve is not your enemy",
    dek: "Why spacing beats cramming, and how to schedule reviews without turning study into a full-time job.",
    excerpt: "Ebbinghaus still holds. The fix is not more hours; it is the right intervals.",
    pillar: "retention-memory",
    read_time: 8,
    published_at: "2026-06-12T10:00:00Z",
    featured: true,
  },
  {
    id: "a1-fr",
    slug: "courbe-oubli-repetition-espacee",
    locale: "fr",
    translation_group_id: "tg-forgetting",
    title: "La courbe d'oubli n'est pas votre ennemie",
    dek: "Pourquoi l'espacement bat le bachotage, et comment planifier des révisions sans y passer sa vie.",
    excerpt: "Ebbinghaus tient toujours. La solution n'est pas plus d'heures ; ce sont les bons intervalles.",
    pillar: "retention-memory",
    read_time: 8,
    published_at: "2026-06-12T10:00:00Z",
    featured: true,
  },
  {
    id: "a2-en",
    slug: "soc-onboarding-without-shadowing-forever",
    locale: "en",
    translation_group_id: "tg-soc",
    title: "SOC onboarding without endless shadowing",
    dek: "New analysts need structure, not a seat next to the strongest senior for three months.",
    excerpt: "Shadowing is not a curriculum. Semantic structure and proof of skill are.",
    pillar: "soc-onboarding",
    read_time: 10,
    published_at: "2026-05-20T10:00:00Z",
    featured: false,
  },
  {
    id: "a2-fr",
    slug: "onboarding-soc-sans-ombre-infinie",
    locale: "fr",
    translation_group_id: "tg-soc",
    title: "Onboarding SOC sans ombre infinie",
    dek: "Les nouveaux analystes ont besoin de structure, pas d'un siège à côté du senior pendant trois mois.",
    excerpt: "L'ombre n'est pas un curriculum. La structure sémantique et la preuve de compétence le sont.",
    pillar: "soc-onboarding",
    read_time: 10,
    published_at: "2026-05-20T10:00:00Z",
    featured: false,
  },
  {
    id: "a3-en",
    slug: "sm-2-vs-fsrs",
    locale: "en",
    translation_group_id: "tg-fsrs",
    title: "SM-2 vs FSRS: what actually changed",
    dek: "A clear comparison of scheduling assumptions without mystique.",
    excerpt: "FSRS models memory more honestly than SM-2. That changes review load.",
    pillar: "fsrs-algorithms",
    read_time: 7,
    published_at: "2026-04-08T10:00:00Z",
    featured: false,
  },
  {
    id: "a3-fr",
    slug: "sm-2-vs-fsrs",
    locale: "fr",
    translation_group_id: "tg-fsrs",
    title: "SM-2 vs FSRS : ce qui a vraiment changé",
    dek: "Comparaison claire des hypothèses de planification, sans mysticisme.",
    excerpt: "FSRS modélise la mémoire plus honnêtement que SM-2. Cela change la charge de révision.",
    pillar: "fsrs-algorithms",
    read_time: 14,
    published_at: "2026-04-08T10:00:00Z",
    featured: false,
  },
  {
    id: "a4-en",
    slug: "proof-of-skill-not-hours",
    locale: "en",
    translation_group_id: "tg-pos",
    title: "Proof of skill, not hours in seat",
    dek: "Readiness metrics that survive an audit and still help the analyst.",
    excerpt: "Hours logged is a poor proxy. Demonstrated decisions are not.",
    pillar: "proof-of-skill",
    read_time: 6,
    published_at: "2026-03-18T10:00:00Z",
    featured: false,
  },
  {
    id: "a5-en",
    slug: "imprint-active-encoding",
    locale: "en",
    translation_group_id: "tg-imprint",
    title: "IMPRINT: active encoding while you browse",
    dek: "Capture meaning at the moment of learning, not hours later in a notes app graveyard.",
    excerpt: "Passive highlights die. Active encoding while reading changes retention.",
    pillar: "active-learning",
    read_time: 5,
    published_at: "2026-02-10T10:00:00Z",
    featured: false,
  },
  {
    id: "a6-en",
    slug: "semantic-trees-knowledge-structure",
    locale: "en",
    translation_group_id: "tg-semanic-trees",
    title: "Semantic trees and the structure of knowledge",
    dek: "Organizing information into meaningful hierarchies is how durable understanding actually happens.",
    excerpt: "Isolated facts are fragile. Concepts linked to a network stick for years.",
    pillar: "ops-cyber",
    read_time: 10,
    published_at: "2026-07-01T10:00:00Z",
    featured: true,
  },
  {
    id: "a6-fr",
    slug: "arbres-semantiques-structure-connaissance",
    locale: "fr",
    translation_group_id: "tg-semanic-trees",
    title: "Arbres sémantiques et structure de la connaissance",
    dek: "Organiser l'information en hiérarchies significatives, c'est ainsi que la compréhension durable s'ancre réellement.",
    excerpt: "Une information isolée est fragile. Un concept relié à un réseau s'ancre pour des années.",
    pillar: "ops-cyber",
    read_time: 10,
    published_at: "2026-07-01T10:00:00Z",
    featured: true,
  },
];

async function main() {
  const { data: pillarRows } = await sb.from("pillars").select("slug, id");
  const pm = new Map((pillarRows || []).map((p) => [p.slug, p.id]));
  console.log(`Pillars: ${pm.size}`);

  let ok = 0;
  for (const r of rows) {
    const pid = pm.get(r.pillar);
    if (!pid) { console.warn(`  skip ${r.id}: unknown pillar ${r.pillar}`); continue; }

    // Only insert id + minimal fields — content stays NULL for now to avoid JSON escaping
    const payload = {
      id: r.id,
      slug: r.slug,
      locale: r.locale,
      translation_group_id: r.translation_group_id,
      working_title: r.title,
      title: r.title,
      dek: r.dek,
      excerpt: r.excerpt,
      status: "published",
      pillar_id: pid,
      read_time_minutes: r.read_time,
      published_at: r.published_at,
      featured: r.featured,
    };

    const { error } = await sb.from("articles").upsert(payload, { onConflict: "id" });
    if (error) console.error(`  ✘ ${r.id}: ${error.message}`);
    else { ok++; console.log(`  ✔ ${r.id} → ${r.slug}`); }
  }

  console.log(`\nDone: ${ok}/${rows.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
