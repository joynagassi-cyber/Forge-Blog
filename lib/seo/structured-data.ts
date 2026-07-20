/**
 * JSON-LD structured data helpers (section 4.4).
 * Generates schema.org-compliant JSON-LD for Article, BreadcrumbList,
 * Organization, and WebSite types.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";
const SITE_NAME = "Forge-Blog";
const ORG_NAME = "Forge-Blog";

// ---------------------------------------------------------------------------
// Organization (same on every page)
// ---------------------------------------------------------------------------

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon.svg`,
    sameAs: [
      "https://nainoforge.com",
      "https://scyforge.com",
      "https://forge-blog.io",
    ],
  };
}

// ---------------------------------------------------------------------------
// WebSite (home page)
// ---------------------------------------------------------------------------

export function websiteSchema(locale: string, searchActionUrl?: string) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === "fr" ? "fr-FR" : "en-US",
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };

  if (searchActionUrl) {
    schema.potentialAction = {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${searchActionUrl}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    };
  }

  return schema;
}

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ---------------------------------------------------------------------------
// Article (news article / blog post)
// ---------------------------------------------------------------------------

export type ArticleSchemaInput = {
  headline: string;
  description?: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string;
  imageAlt?: string;
  url: string;
  locale: string;
  wordCount?: number;
  timeRequired?: string; // e.g. "PT8M"
};

export function articleSchema(input: ArticleSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description ?? input.headline,
    author: {
      "@type": "Person",
      name: input.author,
    },
    publisher: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    ...(input.imageUrl
      ? {
          image: {
            "@type": "ImageObject",
            url: input.imageUrl,
            caption: input.imageAlt ?? input.headline,
          },
        }
      : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    url: input.url,
    inLanguage: input.locale === "fr" ? "fr-FR" : "en-US",
    wordCount: input.wordCount,
    timeRequired: input.timeRequired,
    isAccessibleForFree: true,
  };
}

// ---------------------------------------------------------------------------
// Serialization helper — inject into Next.js metadata's other metadata
// ---------------------------------------------------------------------------

export function jsonLdString(scripts: Record<string, unknown>[]): string {
  return scripts
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join("\n");
}

/**
 * Serialize to a `<script>` tag string for direct injection in page content.
 * Used when metadata.other is not available — we append in the layout wrapper.
 */
export function renderJsonLd(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}
