import type { Metadata } from "next";
import type { Locale } from "@/lib/locale/resolve";
import { notFound } from "next/navigation";
import { WaitlistForm } from "@/components/public/WaitlistForm";

type Props = { params: Promise<{ locale: string }> };

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

const copy = {
  en: {
    metaTitle: "SCYForge — Waitlist",
    metaDesc: "Join the waitlist for SCYForge, the infrastructure that structures organizational knowledge the way your brain structures learning.",
    heroEyebrow: "SCYForge · In development",
    heroTitle: "What your brain does with knowledge, no tool does with a team's knowledge.",
    heroSub: "We're building the infrastructure that fixes that. One principle — the Semantic Tree — to structure a person's memory, an organization's living knowledge, and the product's architecture itself.",
    placeholder: "Your email",
    cta: "Join the waitlist",
    trustLine: "No disguised newsletter. An email when there's something real to show.",
    thesisTitle: "The thesis in three levels",
    level1Title: "In the learner's mind",
    level1Body: "Knowledge you truly master is always structured like a tree: a trunk, branches, leaves. The brain doesn't retain lists — it retains structures connected to something already solid.",
    level2Title: "In an organization",
    level2Body: "The same tree should carry a team's knowledge. Today it ends up in dead wikis and documents no one rereads. Every asset — an incident, a decision, a lesson learned — should graft onto what you already know, not pile up next to it.",
    level3Title: "In the product",
    level3Body: "SCYForge builds this as a single infrastructure, not separate modules. What helps a person remember and what helps a team not lose its knowledge come from the same underlying structure.",
    statusEyebrow: "Where we are",
    statusBody: "NainoForge, a browser extension, already tests the first brick of this thesis at individual scale. SCYForge is the full version, designed for knowledge that lives and grows with an entire organization. It is under construction.",
    nainoLink: "Try NainoForge now →",
    benefitsTitle: "What the waitlist gives",
    benefits: [
      "Early access before public opening",
      "A say in what gets built first",
      "Nothing else",
    ],
    formTitle: "Join the waitlist",
    formPlaceholder: "Your email",
    formOptional: "What kind of knowledge would you want to see this applied to first? (optional)",
    footer: "SCYForge · Forge Blog · NainoForge",
  },
  fr: {
    metaTitle: "SCYForge — Liste d'attente",
    metaDesc: "Rejoignez la liste d'attente pour SCYForge, l'infrastructure qui structure la connaissance organisationnelle comme votre cerveau structure l'apprentissage.",
    heroEyebrow: "SCYForge · En construction",
    heroTitle: "Ce que votre cerveau fait avec un savoir, aucun outil ne le fait avec le savoir d'une équipe.",
    heroSub: "On construit l'infrastructure qui corrige ça. Un seul principe (l'Arbre Sémantique) pour structurer la mémoire d'une personne, le savoir vivant d'une organisation, et l'architecture du produit lui-même.",
    placeholder: "Votre email",
    cta: "Rejoindre la liste d'attente",
    trustLine: "Pas de newsletter déguisée. Un email quand il y a quelque chose de réel à montrer.",
    thesisTitle: "La thèse en trois niveaux",
    level1Title: "Dans la tête de l'apprenant",
    level1Body: "Un savoir qu'on maîtrise vraiment est toujours structuré en arbre : un tronc, des branches, des feuilles. Le cerveau ne retient pas des listes, il retient des structures connectées à quelque chose de déjà solide.",
    level2Title: "Dans une organisation",
    level2Body: "Le même arbre devrait porter le savoir d'une équipe. Aujourd'hui, il finit dans des wikis morts et des documents que personne ne relit. Chaque acquis (un incident, une décision, une leçon apprise) devrait se greffer à ce qu'on sait déjà, pas s'empiler à côté.",
    level3Title: "Dans le produit",
    level3Body: "SCYForge construit ça comme une seule infrastructure, pas comme des modules séparés. Ce qui aide une personne à mémoriser et ce qui aide une équipe à ne pas perdre son savoir viennent de la même structure de base.",
    statusEyebrow: "Où on en est",
    statusBody: "NainoForge, une extension de navigateur, teste déjà la première brique de cette thèse à l'échelle individuelle. SCYForge est la version complète, pensée pour un savoir qui vit et grandit avec une organisation entière. Elle est en construction.",
    nainoLink: "Essayer NainoForge maintenant →",
    benefitsTitle: "Ce que la liste d'attente donne",
    benefits: [
      "Accès anticipé avant l'ouverture publique",
      "Un droit de regard sur ce qui se construit en premier",
      "Rien d'autre",
    ],
    formTitle: "Rejoindre la liste d'attente",
    formPlaceholder: "Votre email",
    formOptional: "Sur quel type de savoir voudrais-tu voir ça appliqué en premier ? (optionnel)",
    footer: "SCYForge · Forge Blog · NainoForge",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") return {};

  const t = copy[raw];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
    robots: { index: true, follow: true },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDesc,
      locale: raw === "fr" ? "fr_FR" : "en_US",
    },
  };
}

export default async function SCYForgePage({ params }: Props) {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const t = copy[locale];

  return (
    <div>
      {/* ── Section 1: Hero ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 py-20 md:py-28 text-center">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--accent-warm)] mb-5 font-semibold">
            {t.heroEyebrow}
          </p>
          <h1 className="font-serif text-2xl md:text-[2.5rem] lg:text-[3rem] leading-tight text-[var(--text-primary)] tracking-tight text-wrap-balance">
            {t.heroTitle}
          </h1>
          <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed mt-5 max-w-prose mx-auto">
            {t.heroSub}
          </p>
          <div className="mt-8 max-w-md mx-auto">
            <WaitlistForm
              placeholder={t.placeholder}
              cta={t.cta}
            />
            <p className="text-xs text-[var(--text-muted)] mt-3">
              {t.trustLine}
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2: Thesis in three levels ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent-warm)] mb-10 font-semibold text-center">
            {t.thesisTitle}
          </p>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Level 1 */}
            <div className="space-y-3">
              <div className="w-8 h-0.5 bg-[var(--accent-warm)]" />
              <h3 className="font-serif text-xl text-[var(--text-primary)]">
                {t.level1Title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {t.level1Body}
              </p>
            </div>

            {/* Level 2 */}
            <div className="space-y-3">
              <div className="w-8 h-0.5 bg-[var(--accent-warm)]" />
              <h3 className="font-serif text-xl text-[var(--text-primary)]">
                {t.level2Title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {t.level2Body}
              </p>
            </div>

            {/* Level 3 */}
            <div className="space-y-3">
              <div className="w-8 h-0.5 bg-[var(--accent-warm)]" />
              <h3 className="font-serif text-xl text-[var(--text-primary)]">
                {t.level3Title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {t.level3Body}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Where we are ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-[var(--accent-warm)] mb-5 font-semibold">
            {t.statusEyebrow}
          </p>
          <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed max-w-prose mx-auto">
            {t.statusBody}
          </p>
          <div className="mt-6">
            <a
              href="https://nainoforge.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-4 decoration-1 transition-colors"
            >
              {t.nainoLink}
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 4: Benefits ── */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h2 className="font-serif text-2xl text-[var(--text-primary)] tracking-tight">
            {t.benefitsTitle}
          </h2>
          <ul className="mt-6 space-y-3 text-left max-w-xs mx-auto">
            {t.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--accent-warm)] mt-0.5 shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 8.5L7 10.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Section 5: Final form ── */}
      <section>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h2 className="font-serif text-2xl text-[var(--text-primary)] tracking-tight">
            {t.formTitle}
          </h2>
          <div className="mt-8 max-w-md mx-auto">
            <WaitlistForm
              placeholder={t.formPlaceholder}
              cta={t.cta}
              showOptional
              optionalLabel={t.formOptional}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
