import type { ArticleContent } from "@/lib/blocks/types";
import type { Locale } from "@/lib/locale/resolve";
import { conversionCopy, resolveProductForPillar } from "@/lib/pillars/mapping";

export type DemoArticle = {
  id: string;
  slug: string;
  locale: Locale;
  translation_group_id: string;
  title: string;
  dek: string;
  excerpt: string;
  pillar_slug: string;
  author: string;
  author_bio: string;
  published_at: string;
  updated_at: string;
  read_time_minutes: number;
  cover_gradient: string;
  featured?: boolean;
  content: ArticleContent;
};

function buildContent(opts: {
  title: string;
  dek: string;
  author: string;
  authorBio: string;
  publishedAt: string;
  updatedAt: string;
  readTime: number;
  pillarSlug: string;
  pillarName: string;
  locale: Locale;
  takeaways: string[];
  blocks: ArticleContent["sequence"] extends (infer B)[]
    ? Extract<B, { type: "body_blocks" }>["blocks"]
    : never;
}): ArticleContent {
  const product = resolveProductForPillar(opts.pillarSlug);
  const conv = conversionCopy(product, opts.locale);

  return {
    version: 1,
    sequence: [
      {
        type: "hero_meta",
        title: opts.title,
        dek: opts.dek,
        author: opts.author,
        authorBio: opts.authorBio,
        publishedAt: opts.publishedAt,
        updatedAt: opts.updatedAt,
        readTimeMinutes: opts.readTime,
        pillarSlug: opts.pillarSlug,
        pillarName: opts.pillarName,
      },
      { type: "key_takeaway", items: opts.takeaways },
      { type: "toc_anchor" },
      { type: "body_blocks", blocks: opts.blocks },
      {
        type: "conversion_block",
        product,
        headline: conv.headline,
        body: conv.body,
        ctaLabel: conv.ctaLabel,
        ctaHref: conv.ctaHref,
      },
      { type: "related_articles_anchor" },
    ],
  };
}

const AUTHOR_EN = {
  name: "Forge Editorial",
  bio: "Written by people building NainoForge and SCYForge, grounded in cognitive science and real SOC operations.",
};

const AUTHOR_FR = {
  name: "Éditorial Forge",
  bio: "Rédigé par les équipes qui construisent NainoForge et SCYForge, ancré dans les sciences cognitives et les opérations SOC réelles.",
};

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    id: "a1-en",
    slug: "forgetting-curve-spaced-repetition",
    locale: "en",
    translation_group_id: "tg-forgetting",
    title: "The forgetting curve is not your enemy",
    dek: "Why spacing beats cramming, and how to schedule reviews without turning study into a full-time job.",
    excerpt:
      "Ebbinghaus still holds. The fix is not more hours; it is the right intervals.",
    pillar_slug: "retention-memory",
    author: AUTHOR_EN.name,
    author_bio: AUTHOR_EN.bio,
    published_at: "2026-06-12T10:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
    read_time_minutes: 8,
    cover_gradient: "linear-gradient(135deg, #18181B 0%, #3F3F46 100%)",
    featured: true,
    content: buildContent({
      title: "The forgetting curve is not your enemy",
      dek: "Why spacing beats cramming, and how to schedule reviews without turning study into a full-time job.",
      author: AUTHOR_EN.name,
      authorBio: AUTHOR_EN.bio,
      publishedAt: "2026-06-12T10:00:00Z",
      updatedAt: "2026-07-01T10:00:00Z",
      readTime: 8,
      pillarSlug: "retention-memory",
      pillarName: "Retention & Memory",
      locale: "en",
      takeaways: [
        "Forgetting is a feature of memory, not a personal failure.",
        "Spacing reviews compounds retention far more than extra reading time.",
        "A good schedule is boring: short, repeated, and honest about difficulty.",
        "Tools help only when they force retrieval, not re-reading.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "Most learners treat forgetting as a bug. Cognitive science treats it as a signal: material you never retrieve will not stay accessible. The practical question is not “how do I remember everything,” but “when should I retrieve what I still need.”",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "What the forgetting curve actually predicts",
          anchor: "what-the-forgetting-curve-actually-predicts",
        },
        {
          id: "p2",
          type: "paragraph",
          spans: [
            {
              text: "The classic curve shows rapid early decay, then a slower decline. The shape is robust across domains; the ",
            },
            { text: "parameters", marks: { bold: true } },
            {
              text: " change with difficulty, prior knowledge, and how you encoded the material. That is why a fixed “review every 3 days” rule eventually fails.",
            },
          ],
        },
        {
          id: "callout-1",
          type: "callout",
          variant: "verify",
          title: "à vérifier",
          spans: [
            {
              text: "[à vérifier] Specific percentage decay figures are often cited without primary sources. Prefer describing the shape of the curve over inventing numbers.",
            },
          ],
        },
        {
          id: "h2-2",
          type: "h2",
          text: "Why spacing works better than re-reading",
          anchor: "why-spacing-works",
        },
        {
          id: "p3",
          type: "paragraph",
          spans: [
            {
              text: "Re-reading feels productive because recognition is easy. Retrieval is harder and more predictive of later performance. Spaced repetition systems force that harder path on a schedule that expands as you succeed.",
            },
          ],
        },
        {
          id: "table-1",
          type: "table",
          headers: ["Approach", "Short-term feel", "Long-term effect"],
          rows: [
            ["Cramming", "High confidence", "Steep post-exam drop"],
            ["Re-reading notes", "Familiarity", "Weak transfer"],
            ["Spaced retrieval", "Effortful", "Stable access under load"],
          ],
        },
        {
          id: "h2-3",
          type: "h2",
          text: "A practical review loop",
          anchor: "practical-review-loop",
        },
        {
          id: "diagram-1",
          type: "diagram",
          nodes: [
            { id: "n1", label: "Capture", type: "step" },
            { id: "n2", label: "First retrieval", type: "step" },
            { id: "n3", label: "Hard?", type: "decision" },
            { id: "n4", label: "Short interval", type: "artifact" },
            { id: "n5", label: "Longer interval", type: "artifact" },
          ],
          edges: [
            { id: "e1", source: "n1", target: "n2" },
            { id: "e2", source: "n2", target: "n3" },
            { id: "e3", source: "n3", target: "n4", label: "yes" },
            { id: "e4", source: "n3", target: "n5", label: "no" },
          ],
        },
        {
          id: "list-1",
          type: "checklist",
          ordered: true,
          items: [
            { text: "Capture a fact or skill as a prompt, not a paragraph." },
            { text: "Retrieve it once within 24 hours." },
            { text: "Increase the gap only when retrieval is clean." },
            { text: "Demote the card when you hesitate or invent details." },
          ],
        },
        {
          id: "h2-4",
          type: "h2",
          text: "Where product tools fit",
          anchor: "where-product-tools-fit",
        },
        {
          id: "p4",
          type: "paragraph",
          spans: [
            {
              text: "A browser-native system can capture while you study and schedule the next retrieval without a separate “flashcard session” ritual. That is the design intent behind NainoForge’s active learning loop.",
            },
          ],
        },
        {
          id: "bridge-1",
          type: "product_bridge_inline",
          product: "nainoforge",
          headline: "NainoForge automates the schedule you just read about.",
          body: "Capture from the page, retrieve on a real FSRS-informed cadence, keep focus on the material that still matters.",
          ctaLabel: "Try NainoForge",
          ctaHref: "https://nainoforge.com",
        },
      ],
    }),
  },
  {
    id: "a1-fr",
    slug: "courbe-oubli-repetition-espacee",
    locale: "fr",
    translation_group_id: "tg-forgetting",
    title: "La courbe d'oubli n'est pas votre ennemie",
    dek: "Pourquoi l'espacement bat le bachotage, et comment planifier des révisions sans y passer sa vie.",
    excerpt:
      "Ebbinghaus tient toujours. La solution n'est pas plus d'heures ; ce sont les bons intervalles.",
    pillar_slug: "retention-memory",
    author: AUTHOR_FR.name,
    author_bio: AUTHOR_FR.bio,
    published_at: "2026-06-12T10:00:00Z",
    updated_at: "2026-07-01T10:00:00Z",
    read_time_minutes: 8,
    cover_gradient: "linear-gradient(135deg, #18181B 0%, #3F3F46 100%)",
    featured: true,
    content: buildContent({
      title: "La courbe d'oubli n'est pas votre ennemie",
      dek: "Pourquoi l'espacement bat le bachotage, et comment planifier des révisions sans y passer sa vie.",
      author: AUTHOR_FR.name,
      authorBio: AUTHOR_FR.bio,
      publishedAt: "2026-06-12T10:00:00Z",
      updatedAt: "2026-07-01T10:00:00Z",
      readTime: 8,
      pillarSlug: "retention-memory",
      pillarName: "Rétention & mémoire",
      locale: "fr",
      takeaways: [
        "L'oubli est une propriété de la mémoire, pas un échec personnel.",
        "Espacer les révisions multiplie la rétention bien plus que le temps de relecture.",
        "Un bon planning est ennuyeux : court, répété, honnête sur la difficulté.",
        "Les outils n'aident que s'ils forcent la récupération, pas la relecture.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "La plupart des apprenants traitent l'oubli comme un bug. Les sciences cognitives le traitent comme un signal : ce que vous ne récupérez jamais ne restera pas accessible. La vraie question n'est pas « comment tout mémoriser », mais « quand récupérer ce dont j'ai encore besoin ».",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "Ce que prédit réellement la courbe d'oubli",
          anchor: "ce-que-predit-la-courbe",
        },
        {
          id: "p2",
          type: "paragraph",
          spans: [
            {
              text: "La courbe classique montre une décroissance rapide au début, puis un ralentissement. La forme est robuste ; les ",
            },
            { text: "paramètres", marks: { bold: true } },
            {
              text: " changent avec la difficulté, les connaissances préalables et l'encodage. C'est pourquoi une règle fixe « réviser tous les 3 jours » finit par échouer.",
            },
          ],
        },
        {
          id: "callout-1",
          type: "callout",
          variant: "verify",
          title: "à vérifier",
          spans: [
            {
              text: "[à vérifier] Les pourcentages de décroissance souvent cités manquent parfois de sources primaires. Préférez décrire la forme de la courbe plutôt qu'inventer des chiffres.",
            },
          ],
        },
        {
          id: "h2-2",
          type: "h2",
          text: "Pourquoi l'espacement bat la relecture",
          anchor: "pourquoi-espacement",
        },
        {
          id: "p3",
          type: "paragraph",
          spans: [
            {
              text: "Relire donne l'impression d'avancer parce que la reconnaissance est facile. La récupération est plus dure et plus prédictive de la performance ultérieure.",
            },
          ],
        },
        {
          id: "list-1",
          type: "checklist",
          ordered: true,
          items: [
            { text: "Capturer un fait comme une question, pas un paragraphe." },
            { text: "Le récupérer une fois dans les 24 heures." },
            { text: "Allonger l'intervalle seulement si la récupération est nette." },
            { text: "Raccourcir dès que vous hésitez ou inventez des détails." },
          ],
        },
        {
          id: "bridge-1",
          type: "product_bridge_inline",
          product: "nainoforge",
          headline: "NainoForge automatise le planning que vous venez de lire.",
          body: "Capturer depuis la page, récupérer sur un rythme informé par FSRS, garder le focus sur ce qui compte encore.",
          ctaLabel: "Essayer NainoForge",
          ctaHref: "https://nainoforge.com",
        },
      ],
    }),
  },
  {
    id: "a2-en",
    slug: "soc-onboarding-without-shadowing-forever",
    locale: "en",
    translation_group_id: "tg-soc",
    title: "SOC onboarding without endless shadowing",
    dek: "New analysts need structure, not a seat next to the strongest senior for three months.",
    excerpt:
      "Shadowing is not a curriculum. Semantic structure and proof of skill are.",
    pillar_slug: "soc-onboarding",
    author: AUTHOR_EN.name,
    author_bio: AUTHOR_EN.bio,
    published_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-06-15T10:00:00Z",
    read_time_minutes: 10,
    cover_gradient: "linear-gradient(135deg, #111113 0%, #27272A 100%)",
    content: buildContent({
      title: "SOC onboarding without endless shadowing",
      dek: "New analysts need structure, not a seat next to the strongest senior for three months.",
      author: AUTHOR_EN.name,
      authorBio: AUTHOR_EN.bio,
      publishedAt: "2026-05-20T10:00:00Z",
      updatedAt: "2026-06-15T10:00:00Z",
      readTime: 10,
      pillarSlug: "soc-onboarding",
      pillarName: "SOC Onboarding",
      locale: "en",
      takeaways: [
        "Shadowing does not scale and rarely produces measurable readiness.",
        "Break the role into semantic skills, not tool tours.",
        "Proof of skill beats hours spent in the SIEM console.",
        "Seniors should mentor exceptions, not repeat base training forever.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "Many SOC programs still onboard by proximity: sit next to someone good and hope competence transfers. It feels humane. It is also expensive, uneven, and almost impossible to audit.",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "What breaks in classic shadowing",
          anchor: "what-breaks",
        },
        {
          id: "p2",
          type: "paragraph",
          spans: [
            {
              text: "Seniors optimize for the queue in front of them, not for teaching. Juniors copy surface workflows without the decision tree underneath. When the senior is out, the junior freezes on novel alerts.",
            },
          ],
        },
        {
          id: "h2-2",
          type: "h2",
          text: "A structured alternative",
          anchor: "structured-alternative",
        },
        {
          id: "code-1",
          type: "code",
          language: "yaml",
          code: `skill:
  name: triage-phishing
  prerequisites: [headers-basics, url-hygiene]
  proof:
    - classify 10 real tickets with mentor review
    - write one escalation note that stands alone`,
        },
        {
          id: "p3",
          type: "paragraph",
          spans: [
            {
              text: "Map the role as a tree of skills. Attach evidence requirements. Progress only when proof exists. That is how you replace “seems ready” with “demonstrated ready.”",
            },
          ],
        },
        {
          id: "bridge-1",
          type: "product_bridge_inline",
          product: "scyforge",
          headline: "SCYForge automates what you just read.",
          body: "Semantic Tree, Domain Packs, ASCENT, and Proof of Skill give SOC leads a curriculum they can actually run.",
          ctaLabel: "Request a SCYForge demo",
          ctaHref: "https://scyforge.com",
        },
      ],
    }),
  },
  {
    id: "a2-fr",
    slug: "onboarding-soc-sans-ombre-infinie",
    locale: "fr",
    translation_group_id: "tg-soc",
    title: "Onboarding SOC sans ombre infinie",
    dek: "Les nouveaux analystes ont besoin de structure, pas d'un siège à côté du senior pendant trois mois.",
    excerpt:
      "L'ombre n'est pas un curriculum. La structure sémantique et la preuve de compétence le sont.",
    pillar_slug: "soc-onboarding",
    author: AUTHOR_FR.name,
    author_bio: AUTHOR_FR.bio,
    published_at: "2026-05-20T10:00:00Z",
    updated_at: "2026-06-15T10:00:00Z",
    read_time_minutes: 10,
    cover_gradient: "linear-gradient(135deg, #111113 0%, #27272A 100%)",
    content: buildContent({
      title: "Onboarding SOC sans ombre infinie",
      dek: "Les nouveaux analystes ont besoin de structure, pas d'un siège à côté du senior pendant trois mois.",
      author: AUTHOR_FR.name,
      authorBio: AUTHOR_FR.bio,
      publishedAt: "2026-05-20T10:00:00Z",
      updatedAt: "2026-06-15T10:00:00Z",
      readTime: 10,
      pillarSlug: "soc-onboarding",
      pillarName: "Onboarding SOC",
      locale: "fr",
      takeaways: [
        "L'ombre ne scale pas et produit rarement une readiness mesurable.",
        "Découper le rôle en compétences sémantiques, pas en tours d'outils.",
        "La preuve de compétence bat les heures passées dans le SIEM.",
        "Les seniors doivent mentoriser les exceptions, pas répéter la base.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "Beaucoup de SOC onboardent encore par proximité : s'asseoir à côté de quelqu'un de bon et espérer que la compétence se transfère. C'est humain. C'est aussi coûteux, inégal, et presque impossible à auditer.",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "Ce qui casse dans l'ombre classique",
          anchor: "ce-qui-casse",
        },
        {
          id: "p2",
          type: "paragraph",
          spans: [
            {
              text: "Les seniors optimisent la file, pas l'enseignement. Les juniors copient des workflows de surface sans l'arbre de décision. Quand le senior est absent, le junior se fige sur les alertes nouvelles.",
            },
          ],
        },
        {
          id: "bridge-1",
          type: "product_bridge_inline",
          product: "scyforge",
          headline: "SCYForge automatise ce que vous venez de lire.",
          body: "Semantic Tree, Domain Packs, ASCENT et Proof of Skill donnent aux leads SOC un curriculum exécutable.",
          ctaLabel: "Demander une démo SCYForge",
          ctaHref: "https://scyforge.com",
        },
      ],
    }),
  },
  {
    id: "a3-en",
    slug: "sm-2-vs-fsrs",
    locale: "en",
    translation_group_id: "tg-fsrs",
    title: "SM-2 vs FSRS: what actually changed",
    dek: "A clear comparison of scheduling assumptions without mystique.",
    excerpt:
      "FSRS models memory more honestly than SM-2. That changes review load.",
    pillar_slug: "fsrs-algorithms",
    author: AUTHOR_EN.name,
    author_bio: AUTHOR_EN.bio,
    published_at: "2026-04-08T10:00:00Z",
    updated_at: "2026-04-08T10:00:00Z",
    read_time_minutes: 7,
    cover_gradient: "linear-gradient(135deg, #0A0A0C 0%, #1F1F23 100%)",
    content: buildContent({
      title: "SM-2 vs FSRS: what actually changed",
      dek: "A clear comparison of scheduling assumptions without mystique.",
      author: AUTHOR_EN.name,
      authorBio: AUTHOR_EN.bio,
      publishedAt: "2026-04-08T10:00:00Z",
      updatedAt: "2026-04-08T10:00:00Z",
      readTime: 7,
      pillarSlug: "fsrs-algorithms",
      pillarName: "FSRS & Algorithms",
      locale: "en",
      takeaways: [
        "SM-2 is a simple heuristic that scaled Anki for decades.",
        "FSRS fits difficulty and stability more explicitly.",
        "Neither algorithm replaces good card design.",
        "Choose based on load and review quality, not brand loyalty.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "Algorithm debates often drown in personality. Strip it down: what state does each model track, and how does it decide the next interval?",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "Side-by-side",
          anchor: "side-by-side",
        },
        {
          id: "table-1",
          type: "table",
          headers: ["Aspect", "SM-2", "FSRS"],
          rows: [
            ["Core idea", "Ease factor + interval steps", "Stability / difficulty model"],
            ["Personalization", "Per-card ease", "Richer per-card parameters"],
            ["Failure handling", "Hard resets", "More graded adjustments"],
            ["Complexity", "Low", "Higher, better tools hide it"],
          ],
        },
        {
          id: "quote-1",
          type: "quote",
          spans: [
            {
              text: "An algorithm cannot fix a card that asks three questions at once.",
            },
          ],
          attribution: "Editorial note",
        },
      ],
    }),
  },
  {
    id: "a4-en",
    slug: "proof-of-skill-not-hours",
    locale: "en",
    translation_group_id: "tg-pos",
    title: "Proof of skill, not hours in seat",
    dek: "Readiness metrics that survive an audit and still help the analyst.",
    excerpt:
      "Hours logged is a poor proxy. Demonstrated decisions are not.",
    pillar_slug: "proof-of-skill",
    author: AUTHOR_EN.name,
    author_bio: AUTHOR_EN.bio,
    published_at: "2026-03-18T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    read_time_minutes: 6,
    cover_gradient: "linear-gradient(135deg, #18181B 0%, #3F3F46 55%, #111113 100%)",
    content: buildContent({
      title: "Proof of skill, not hours in seat",
      dek: "Readiness metrics that survive an audit and still help the analyst.",
      author: AUTHOR_EN.name,
      authorBio: AUTHOR_EN.bio,
      publishedAt: "2026-03-18T10:00:00Z",
      updatedAt: "2026-05-01T10:00:00Z",
      readTime: 6,
      pillarSlug: "proof-of-skill",
      pillarName: "Proof of Skill",
      locale: "en",
      takeaways: [
        "Seat time measures presence, not capability.",
        "Define observable decisions, then collect evidence.",
        "Automate collection where possible; keep human judgment for edge cases.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "If your readiness report is a spreadsheet of completed trainings, you are measuring attendance. Proof of skill requires artifacts: classified tickets, written escalations, correct playbook branches under time pressure.",
            },
          ],
        },
        {
          id: "h2-1",
          type: "h2",
          text: "Minimum evidence set",
          anchor: "minimum-evidence",
        },
        {
          id: "list-1",
          type: "checklist",
          ordered: false,
          items: [
            { text: "One independent decision with rationale recorded." },
            { text: "One peer or mentor review of that decision." },
            { text: "One timed drill under realistic noise." },
          ],
        },
      ],
    }),
  },
  {
    id: "a5-en",
    slug: "imprint-active-encoding",
    locale: "en",
    translation_group_id: "tg-imprint",
    title: "IMPRINT: active encoding while you browse",
    dek: "Capture meaning at the moment of learning, not hours later in a notes app graveyard.",
    excerpt:
      "Passive highlights die. Active encoding while reading changes retention.",
    pillar_slug: "active-learning",
    author: AUTHOR_EN.name,
    author_bio: AUTHOR_EN.bio,
    published_at: "2026-02-10T10:00:00Z",
    updated_at: "2026-02-10T10:00:00Z",
    read_time_minutes: 5,
    cover_gradient: "linear-gradient(135deg, #1F1F23 0%, #09090B 100%)",
    content: buildContent({
      title: "IMPRINT: active encoding while you browse",
      dek: "Capture meaning at the moment of learning, not hours later in a notes app graveyard.",
      author: AUTHOR_EN.name,
      authorBio: AUTHOR_EN.bio,
      publishedAt: "2026-02-10T10:00:00Z",
      updatedAt: "2026-02-10T10:00:00Z",
      readTime: 5,
      pillarSlug: "active-learning",
      pillarName: "Active Learning",
      locale: "en",
      takeaways: [
        "Encoding quality at capture time predicts later retrieval.",
        "Transform highlights into questions immediately.",
        "Context from the page should travel with the card.",
      ],
      blocks: [
        {
          id: "p1",
          type: "paragraph",
          spans: [
            {
              text: "Yellow highlighters create the illusion of study. IMPRINT-style workflows force a transformation: selection becomes a retrieval prompt while the source is still open.",
            },
          ],
        },
        {
          id: "toggle-1",
          type: "toggle",
          summary: "Example transformation",
          children: [
            {
              id: "p2",
              type: "paragraph",
              spans: [
                {
                  text: "Highlight: “Stability is the time until retrievability drops to a threshold.” Prompt: “What does stability measure in FSRS?”",
                },
              ],
            },
          ],
        },
      ],
    }),
  },
];

export function getArticles(locale: Locale): DemoArticle[] {
  return DEMO_ARTICLES.filter((a) => a.locale === locale);
}

export function getArticle(
  locale: Locale,
  slug: string
): DemoArticle | undefined {
  return DEMO_ARTICLES.find((a) => a.locale === locale && a.slug === slug);
}

export function getFeatured(locale: Locale): DemoArticle | undefined {
  return (
    getArticles(locale).find((a) => a.featured) ?? getArticles(locale)[0]
  );
}

export function getRelated(
  article: DemoArticle,
  limit = 3
): DemoArticle[] {
  return getArticles(article.locale)
    .filter(
      (a) =>
        a.id !== article.id &&
        (a.pillar_slug === article.pillar_slug ||
          a.translation_group_id !== article.translation_group_id)
    )
    .slice(0, limit);
}

export function getTranslation(
  article: DemoArticle,
  targetLocale: Locale
): DemoArticle | undefined {
  return DEMO_ARTICLES.find(
    (a) =>
      a.translation_group_id === article.translation_group_id &&
      a.locale === targetLocale
  );
}

export function articlesByPillar(
  locale: Locale,
  pillarSlug: string
): DemoArticle[] {
  return getArticles(locale).filter((a) => a.pillar_slug === pillarSlug);
}
