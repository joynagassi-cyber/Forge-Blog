/**
 * Pillar → product conversion mapping (section 10.1 / 14.3).
 * Lives in config/code, never invented by the AI prompt.
 */

export type TargetProduct = "nainoforge" | "scyforge" | "both" | "none";

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
    target_product: "nainoforge",
  },
  {
    slug: "fsrs-algorithms",
    name_en: "FSRS & Algorithms",
    name_fr: "FSRS & algorithmes",
    description_en: "How modern scheduling algorithms actually work.",
    description_fr: "Comment fonctionnent vraiment les algorithmes de planification modernes.",
    target_product: "nainoforge",
  },
  {
    slug: "active-learning",
    name_en: "Active Learning",
    name_fr: "Apprentissage actif",
    description_en: "IMPRINT, retrieval practice, and intentional study systems.",
    description_fr: "IMPRINT, pratique de récupération et systèmes d'étude intentionnels.",
    target_product: "nainoforge",
  },
  {
    slug: "soc-onboarding",
    name_en: "SOC Onboarding",
    name_fr: "Onboarding SOC",
    description_en: "Turning new analysts into operational contributors faster.",
    description_fr: "Transformer plus vite les nouveaux analystes en contributeurs opérationnels.",
    target_product: "scyforge",
  },
  {
    slug: "ops-cyber",
    name_en: "Operational Cybersecurity",
    name_fr: "Cybersécurité opérationnelle",
    description_en: "Semantic trees, domain packs, and proof of skill in the SOC.",
    description_fr: "Arbres sémantiques, Domain Packs et preuve de compétence en SOC.",
    target_product: "scyforge",
  },
  {
    slug: "proof-of-skill",
    name_en: "Proof of Skill",
    name_fr: "Preuve de compétence",
    description_en: "Measuring readiness without vanity metrics.",
    description_fr: "Mesurer la readiness sans métriques de vanité.",
    target_product: "scyforge",
  },
];

export function getPillar(slug: string): PillarConfig | undefined {
  return PILLARS.find((p) => p.slug === slug);
}

export function resolveProductForPillar(
  pillarSlug: string
): "nainoforge" | "scyforge" | "none" {
  const pillar = getPillar(pillarSlug);
  if (!pillar) return "none";
  if (pillar.target_product === "both") return "nainoforge";
  if (pillar.target_product === "nainoforge") return "nainoforge";
  if (pillar.target_product === "scyforge") return "scyforge";
  return "none";
}

export function conversionCopy(
  product: "nainoforge" | "scyforge" | "none",
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

  if (product === "scyforge") {
    return locale === "fr"
      ? {
          headline: "Vous voulez appliquer ça à votre onboarding SOC ?",
          body: "SCYForge structure la montée en compétence opérationnelle : Semantic Tree, Domain Packs, ASCENT, Proof of Skill.",
          ctaLabel: "Demander une démo SCYForge",
          ctaHref: "https://scyforge.com",
        }
      : {
          headline: "Want this applied to your SOC onboarding?",
          body: "SCYForge structures operational readiness: Semantic Tree, Domain Packs, ASCENT, Proof of Skill.",
          ctaLabel: "Request a SCYForge demo",
          ctaHref: "https://scyforge.com",
        };
  }

  return {
    headline: "",
    body: "",
    ctaLabel: "",
    ctaHref: "#",
  };
}
