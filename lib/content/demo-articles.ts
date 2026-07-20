import type { ArticleContent } from "@/lib/blocks/types";
import type { Locale } from "@/lib/locale/resolve";

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

// ─── Featured article: The Forgetting Curve ───────────────────────────────

const forgettingCurveContentEn: ArticleContent = {
  version: 1,
  sequence: [
    {
      type: "hero_meta",
      title: "The Forgetting Curve: How Much You Actually Lose, and How Fast",
      dek: "A deep dive into Ebbinghaus's classic findings and a simple protocol to measure your own memory decay.",
      author: "Forge Editorial",
      authorBio: "Exploring the science of learning, memory, and cognition.",
      publishedAt: new Date().toISOString(),
      readTimeMinutes: 8,
      pillarSlug: "retention-memory",
      pillarName: "Retention & Memory",
    },
    {
      type: "key_takeaway",
      items: [
        "The forgetting curve shows we lose ~50% of new information within 24 hours without review.",
        "Ebbinghaus's 1885 experiment has been replicated across hundreds of studies — the pattern is universal.",
        "You can measure your own forgetting curve with a simple 7-day protocol.",
      ],
    },
    {
      type: "toc_anchor",
    },
    {
      type: "body_blocks",
      blocks: [
        {
          id: "b1",
          type: "h2",
          text: "What the curve actually says",
        },
        {
          id: "b2",
          type: "paragraph",
          spans: [
            {
              text: "In 1885, Hermann Ebbinghaus memorized lists of nonsense syllables — 'wid', 'zof', 'pek' — and tested himself at precise intervals. What he found has never been seriously challenged: memory decays exponentially, with the steepest drop in the first hour, and a near-flat line after a few days if nothing interrupts it.",
            },
          ],
        },
        {
          id: "b3",
          type: "paragraph",
          spans: [
            {
              text: "The numbers are sobering. Within 20 minutes, you've already lost about 40% of what you just learned. After one hour, it's closer to 50%. After one day, about 70% is gone. What remains after a week — roughly 20-25% — tends to stay for much longer.",
            },
          ],
        },
        {
          id: "b4",
          type: "callout",
          spans: [{ text: "The curve is not a judgment on your intelligence. It's a physical property of how biological memory works — like the fact that a cup of hot coffee cools to room temperature." }],
          variant: "info",
        },
        {
          id: "b5",
          type: "h2",
          text: "Why the curve matters for how you learn",
        },
        {
          id: "b6",
          type: "paragraph",
          spans: [
            {
              text: "Most study habits are built around the illusion that exposure equals retention. Re-reading, highlighting, summarizing — these feel productive. But they barely bend the forgetting curve. The evidence is consistent: the only thing that reliably flattens the slope is effortful retrieval.",
            },
          ],
        },
        {
          id: "b7",
          type: "paragraph",
          spans: [
            {
              text: "This is where the curve becomes practical. If you test yourself on what you learned — not right after, but at the point when you've started to forget — each retrieval attempt resets the curve to a higher baseline. Over several spaced repetitions, the curve barely dips at all.",
            },
          ],
        },
        {
          id: "b8",
          type: "h2",
          text: "Measure your own forgetting curve",
        },
        {
          id: "b9",
          type: "paragraph",
          spans: [
            {
              text: "The most convincing way to see the curve is to generate your own data. Here is a simple protocol:",
            },
          ],
        },
        {
          id: "b10",
          type: "checklist",
          ordered: true,
          items: [
            { text: "Pick a set of 20 items to memorize — a list of foreign words, a sequence of historical dates, or a shuffled deck of cards." },
            { text: "Study them until you can recall 100% once. Note the time." },
            { text: "Test yourself again after 1 hour, 1 day, 3 days, and 7 days. Do not review in between." },
            { text: "Record your recall percentage each time." },
            { text: "Plot the results. You will see your personal forgetting curve." },
          ],
        },
        {
          id: "b11",
          type: "paragraph",
          spans: [
            {
              text: "What you will find is that the shape of your curve matches Ebbinghaus's almost exactly. The only variable that changes from person to person is the starting level — how much you retain after the first hour. That baseline is trainable.",
            },
          ],
        },
      ],
    },
    {
      type: "conversion_block",
      product: "none",
      headline: "",
      body: "",
      ctaLabel: "",
      ctaHref: "",
    },
    {
      type: "related_articles_anchor",
    },
  ],
};

const forgettingCurveContentFr: ArticleContent = {
  version: 1,
  sequence: [
    {
      type: "hero_meta",
      title: "La courbe de l'oubli : combien vous perdez réellement, et à quelle vitesse",
      dek: "Une plongée dans les découvertes classiques d'Ebbinghaus et un protocole simple pour mesurer votre propre déclin de mémoire.",
      author: "Forge Editorial",
      authorBio: "Explorer la science de l'apprentissage, de la mémoire et de la cognition.",
      publishedAt: new Date().toISOString(),
      readTimeMinutes: 8,
      pillarSlug: "retention-memory",
      pillarName: "Rétention & Mémoire",
    },
    {
      type: "key_takeaway",
      items: [
        "La courbe d'oubli montre que nous perdons ~50% des nouvelles informations en 24 heures sans révision.",
        "L'expérience d'Ebbinghaus (1885) a été répliquée des centaines de fois — le pattern est universel.",
        "Vous pouvez mesurer votre propre courbe d'oubli avec un protocole simple de 7 jours.",
      ],
    },
    {
      type: "toc_anchor",
    },
    {
      type: "body_blocks",
      blocks: [
        {
          id: "b1",
          type: "h2",
          text: "Ce que la courbe dit réellement",
        },
        {
          id: "b2",
          type: "paragraph",
          spans: [
            {
              text: "En 1885, Hermann Ebbinghaus a mémorisé des listes de syllabes absurdes — « wid », « zof », « pek » — et s'est testé à intervalles précis. Ce qu'il a découvert n'a jamais été sérieusement contesté : la mémoire décline de façon exponentielle, avec la chute la plus brutale dans la première heure.",
            },
          ],
        },
        {
          id: "b3",
          type: "paragraph",
          spans: [
            {
              text: "Les chiffres sont édifiants. En 20 minutes, vous avez déjà perdu environ 40 % de ce que vous venez d'apprendre. Après une heure, c'est près de 50 %. Après un jour, environ 70 % a disparu. Ce qui reste après une semaine — environ 20-25 % — tend à persister beaucoup plus longtemps.",
            },
          ],
        },
        {
          id: "b4",
          type: "callout",
          spans: [{ text: "La courbe n'est pas un jugement sur votre intelligence. C'est une propriété physique du fonctionnement de la mémoire biologique — comme le fait qu'une tasse de café chaud refroidit à température ambiante." }],
          variant: "info",
        },
        {
          id: "b5",
          type: "h2",
          text: "Pourquoi la courbe compte pour votre apprentissage",
        },
        {
          id: "b6",
          type: "paragraph",
          spans: [
            {
              text: "La plupart des habitudes d'étude reposent sur l'illusion que l'exposition équivaut à la rétention. Relire, surligner, résumer — tout cela semble productif. Mais ces méthodes plient à peine la courbe de l'oubli. La seule chose qui aplatit réellement la pente est le rappel actif.",
            },
          ],
        },
        {
          id: "b7",
          type: "paragraph",
          spans: [
            {
              text: "Le véritable pouvoir de la courbe devient alors pratique. Si vous vous testez sur ce que vous avez appris — pas tout de suite, mais au moment où l'oubli commence — chaque tentative de rappel réinitialise la courbe à un niveau de base plus élevé.",
            },
          ],
        },
        {
          id: "b8",
          type: "h2",
          text: "Mesurez votre propre courbe d'oubli",
        },
        {
          id: "b9",
          type: "paragraph",
          spans: [
            {
              text: "La façon la plus convaincante de voir la courbe est de générer vos propres données. Voici un protocole simple :",
            },
          ],
        },
        {
          id: "b10",
          type: "checklist",
          ordered: true,
          items: [
            { text: "Choisissez 20 éléments à mémoriser — une liste de mots étrangers, des dates historiques, ou un jeu de cartes mélangé." },
            { text: "Étudiez-les jusqu'à pouvoir tout réciter une fois. Notez l'heure." },
            { text: "Testez-vous après 1 heure, 1 jour, 3 jours et 7 jours. Ne révisez pas entre-temps." },
            { text: "Notez votre pourcentage de rappel à chaque fois." },
            { text: "Tracez les résultats. Vous verrez votre propre courbe d'oubli." },
          ],
        },
        {
          id: "b11",
          type: "paragraph",
          spans: [
            {
              text: "Ce que vous constaterez, c'est que la forme de votre courbe correspond presque exactement à celle d'Ebbinghaus. La seule variable qui change d'une personne à l'autre est le niveau de départ — combien vous retenez après la première heure. Et cette base est entraînable.",
            },
          ],
        },
      ],
    },
    {
      type: "conversion_block",
      product: "none",
      headline: "",
      body: "",
      ctaLabel: "",
      ctaHref: "",
    },
    {
      type: "related_articles_anchor",
    },
  ],
};

/**
 * Single featured article about the forgetting curve.
 * This is the user's first published article.
 */
export const DEMO_ARTICLES: DemoArticle[] = [
  {
    id: "featured-forgetting-curve",
    slug: "courbe-de-loubli",
    locale: "en" as Locale,
    translation_group_id: "tg-forgetting-curve",
    title: "The Forgetting Curve: How Much You Actually Lose, and How Fast",
    dek: "A deep dive into Ebbinghaus's classic findings, what they mean for how you learn, and a simple protocol to measure your own memory decay.",
    excerpt: "A deep dive into Ebbinghaus's classic findings, what they mean for how you learn, and a simple protocol to measure your own memory decay.",
    pillar_slug: "retention-memory",
    author: "Forge Editorial",
    author_bio: "Exploring the science of learning, memory, and cognition.",
    published_at: new Date().toISOString(),
    updated_at: "",
    read_time_minutes: 8,
    cover_gradient: "linear-gradient(145deg, #2d1b69 0%, #1a1a2e 40%, #4a1942 100%)",
    featured: true,
    content: forgettingCurveContentEn,
  },
  {
    id: "featured-forgetting-curve-fr",
    slug: "courbe-de-loubli",
    locale: "fr" as Locale,
    translation_group_id: "tg-forgetting-curve",
    title: "La courbe de l'oubli : combien vous perdez réellement, et à quelle vitesse",
    dek: "Une plongée dans les découvertes classiques d'Ebbinghaus et un protocole simple pour mesurer votre propre déclin de mémoire.",
    excerpt: "Une plongée dans les découvertes classiques d'Ebbinghaus et un protocole simple pour mesurer votre propre déclin de mémoire.",
    pillar_slug: "retention-memory",
    author: "Forge Editorial",
    author_bio: "Explorer la science de l'apprentissage, de la mémoire et de la cognition.",
    published_at: new Date().toISOString(),
    updated_at: "",
    read_time_minutes: 8,
    cover_gradient: "linear-gradient(145deg, #1a1a2e 0%, #2d1b69 40%, #4a1942 100%)",
    featured: true,
    content: forgettingCurveContentFr,
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

export function getTranslationCoverage() {
  const groups = new Map<string, DemoArticle[]>();

  for (const article of DEMO_ARTICLES) {
    const current = groups.get(article.translation_group_id) ?? [];
    current.push(article);
    groups.set(article.translation_group_id, current);
  }

  let completeGroups = 0;
  let missingEn = 0;
  let missingFr = 0;

  for (const articles of groups.values()) {
    const hasEn = articles.some((article) => article.locale === "en");
    const hasFr = articles.some((article) => article.locale === "fr");

    if (hasEn && hasFr) {
      completeGroups += 1;
      continue;
    }

    if (hasEn) missingFr += 1;
    if (hasFr) missingEn += 1;
  }

  return {
    totalGroups: groups.size,
    completeGroups,
    missingEn,
    missingFr,
  };
}
