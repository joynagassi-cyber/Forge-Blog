import type { Locale } from "@/lib/locale/resolve";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

const copy = {
  en: {
    metaTitle: "About",
    metaDesc: "Forge-Blog explores cognitive science, memory, and learning — written for clarity, grounded in research.",
    title: "About Forge-Blog",
    body: [
      "Forge-Blog is a space for clear, honest writing about how we learn, remember, and think.",
      "Every article is written to be tested — not just read. We ground our claims in cognitive science (Ebbinghaus, Dunlosky, Roediger, Karpicke) and share practical methods you can try yourself.",
      "This blog is maintained by the team behind NainoForge, a browser extension that applies spaced repetition and active recall to everyday browsing. SCYForge, our sister project, extends the same principles to organizational knowledge.",
      "If you have questions, suggestions, or a topic you'd like us to explore, reach out.",
    ],
    contact: "Get in touch",
  },
  fr: {
    metaTitle: "À propos",
    metaDesc: "Forge-Blog explore les sciences cognitives, la mémoire et l'apprentissage — écrit pour la clarté, ancré dans la recherche.",
    title: "À propos de Forge-Blog",
    body: [
      "Forge-Blog est un espace pour une écriture claire et honnête sur la façon dont nous apprenons, retenons et pensons.",
      "Chaque article est écrit pour être testé — pas seulement lu. Nous ancrons nos affirmations dans les sciences cognitives (Ebbinghaus, Dunlosky, Roediger, Karpicke) et partageons des méthodes pratiques que vous pouvez essayer vous-même.",
      "Ce blog est maintenu par l'équipe derrière NainoForge, une extension de navigateur qui applique la répétition espacée et le rappel actif à la navigation quotidienne. SCYForge, notre projet frère, étend les mêmes principes à la connaissance organisationnelle.",
      "Si vous avez des questions, des suggestions ou un sujet que vous aimeriez voir exploré, contactez-nous.",
    ],
    contact: "Nous contacter",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") return {};
  const t = copy[raw];
  return {
    title: t.metaTitle,
    description: t.metaDesc,
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-20">
      <h1 className="font-serif text-3xl md:text-4xl text-[var(--text-primary)] tracking-tight">
        {t.title}
      </h1>
      <div className="mt-8 space-y-5 text-[var(--text-secondary)] text-base leading-relaxed">
        {t.body.map((paragraph) => (
          <p key={paragraph.slice(0, 20)}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-10 pt-8 border-t border-[var(--border)]">
        <a
          href={`mailto:hello@forge-blog.io`}
          className="text-sm text-[var(--accent)] hover:text-[var(--accent-hover)] underline underline-offset-4 transition-colors"
        >
          {t.contact}
        </a>
      </div>
    </div>
  );
}
