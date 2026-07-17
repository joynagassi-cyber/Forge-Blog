import type { Locale } from "./resolve";

const DATE_LOCALE: Record<Locale, string> = {
  en: "en-US",
  fr: "fr-FR",
};

export function formatLocalizedDate(date: string | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(DATE_LOCALE[locale], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(typeof date === "string" ? new Date(date) : date);
}
