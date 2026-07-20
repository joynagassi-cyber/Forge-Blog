/**
 * JSON-LD structured data helpers (section 4.4).
 * Generates schema.org-compliant JSON-LD for Article, BreadcrumbList,
 * Organization, WebSite, WebPage, and Person types.
 *
 * 2026-07-20 SEO/AEO/GEO optimization:
 * - Added siteGraphSchema() for unified @graph (Organization + WebSite + WebPage)
 * - Added authorPersonSchema() for E-E-A-T author signals
 * - Updated articleSchema() to use BlogPosting type with full ImageObject,
 *   author @id reference, publisher @id reference, and guaranteed dateModified
 *
 * See: docs/superpowers/plans/2026-07-20-seo-aeo-geo-optimization.md
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
// @graph — Unified Organization + WebSite + WebPage (homepage)
// ---------------------------------------------------------------------------

export function siteGraphSchema(locale: string) {
  const baseUrl = `${SITE_URL}/${locale}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: ORG_NAME,
        url: SITE_URL,
        logo: { "@id": `${SITE_URL}/#logo` },
        sameAs: [
          "https://nainoforge.com",
          "https://scyforge.com",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        inLanguage: locale === "fr" ? "fr-FR" : "en-US",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${baseUrl}/#webpage`,
        url: baseUrl,
        name: locale === "fr" ? "Accueil" : "Home",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Author Person (E-E-A-T signal)
// ---------------------------------------------------------------------------

export function authorPersonSchema(name: string, sameAs: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#author`,
    name,
    sameAs,
    worksFor: { "@id": `${SITE_URL}/#organization` },
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
  const dateModified = input.dateModified ?? input.datePublished;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.headline,
    description: input.description ?? input.headline,
    image: input.imageUrl
      ? {
          "@type": "ImageObject",
          url: input.imageUrl,
          caption: input.imageAlt ?? input.headline,
        }
      : undefined,
    author: {
      "@id": `${SITE_URL}/#author`,
      "@type": "Person",
      name: input.author,
    },
    publisher: {
      "@id": `${SITE_URL}/#organization`,
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    datePublished: input.datePublished,
    dateModified: dateModified,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
    url: input.url,
    inLanguage: input.locale === "fr" ? "fr-FR" : "en-US",
  };

  if (input.wordCount) {
    schema.wordCount = input.wordCount;
  }

  if (input.timeRequired) {
    schema.totalTime = input.timeRequired;
  }

  return schema;
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
