/**
 * Pillar → product conversion mapping (section 10.1 / 14.3).
 * Lives in config/code, never invented by the AI prompt.
 */

export type TargetProduct = "nainoforge" | "none";

export type PillarConfig = {
  slug: string;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  target_product: TargetProduct;
};

export const PILLARS: PillarConfig[] = [
  {
    slug: "retention-memory",
    name_en: "Retention & Memory",
    name_fr: "Rétention & mémoire",
    description_en: "Spaced repetition, forgetting curves, and durable learning.",
    description_fr: "Répétition espacée, courbes d'oubli et apprentissage durable.",
    target_product: "none",
  },
  {
    slug: "fsrs-algorithms",
    name_en: "FSRS & Algorithms",
    name_fr: "FSRS & algorithmes",
    description_en: "How modern scheduling algorithms actually work.",
    description_fr: "Comment fonctionnent vraiment les algorithmes de planification modernes.",
    target_product: "none",
  },
  {
    slug: "active-learning",
    name_en: "Active Learning",
    name_fr: "Apprentissage actif",
    description_en: "IMPRINT, retrieval practice, and intentional study systems.",
    description_fr: "IMPRINT, pratique de récupération et systèmes d'étude intentionnels.",
    target_product: "none",
  },
];

export function getPillar(slug: string): PillarConfig | undefined {
  return PILLARS.find((p) => p.slug === slug);
}

export function resolveProductForPillar(
  pillarSlug: string
): "nainoforge" | "none" {
  const pillar = getPillar(pillarSlug);
  if (!pillar) return "none";
  if (pillar.target_product === "nainoforge") return "nainoforge";
  return "none";
}

export function conversionCopy(
  product: "nainoforge" | "none",
  locale: "en" | "fr"
): { headline: string; body: string; ctaLabel: string; ctaHref: string } {
  if (product === "nainoforge") {
    return locale === "fr"
      ? {
          headline: "Vous voulez retenir ce que vous apprenez ?",
          body: "NainoForge transforme votre navigation en un système d'apprentissage actif : IMPRINT, FSRS, Student AI.",
          ctaLabel: "Essayer NainoForge",
          ctaHref: "https://nainoforge.com",
        }
      : {
          headline: "Want to retain what you learn?",
          body: "NainoForge turns browsing into an active learning system: IMPRINT, FSRS, Student AI.",
          ctaLabel: "Try NainoForge",
          ctaHref: "https://nainoforge.com",
        };
  }

  return {
    headline: "",
    body: "",
    ctaLabel: "",
    ctaHref: "#",
  };
}
