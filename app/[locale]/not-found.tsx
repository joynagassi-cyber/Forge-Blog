import Link from "next/link";

type Props = {
  params?: Promise<{ locale: string }>;
};

export default async function LocaleNotFound({ params }: Props) {
  const locale = (await params)?.locale === "fr" ? "fr" : "en";

  const t = {
    en: {
      title: "Page not found",
      message: "The page you are looking for does not exist or has been moved.",
      home: "Go home",
    },
    fr: {
      title: "Page non trouvée",
      message: "La page que vous recherchez n'existe pas ou a été déplacée.",
      home: "Retour à l'accueil",
    },
  }[locale];

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
      <div className="text-4xl" aria-hidden>
        🔍
      </div>
      <h1 className="font-serif text-2xl text-[var(--text-primary)]">
        {t.title}
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">{t.message}</p>
      <Link
        href={`/${locale}`}
        className="inline-block rounded-md bg-[var(--accent)] text-white font-semibold px-4 py-2.5 text-sm hover:bg-[var(--accent-hover)]"
      >
        {t.home}
      </Link>
    </div>
  );
}
