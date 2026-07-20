# SEO/AEO/GEO 2026 — Plan d'optimisation technique

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimiser le blog pour Google Search, Google AI Overviews, ChatGPT Search, Perplexity et Gemini en mettant à jour le robots.txt, le balisage JSON-LD, et en créant un fichier llms.txt — conformément aux recommandations Google 2026 qui disent qu'il n'existe pas de "recette GEO" séparée du SEO, et que les fondamentaux restent un site propre, utile, cohérent et crédible.

**Architecture:** Modifications ciblées sur 4 fichiers existants + 1 nouveau fichier statique. Le balisage JSON-LD existant (`lib/seo/structured-data.ts`) est déjà solide ; on l'améliore avec un bloc `@graph` unifié (Organization + WebSite + WebPage), un auteur `Person` lié par `@id`, et un schéma `Article` complété avec `dateModified`. Le robots.txt dynamique reçoit les agents IA de recherche (OAI-SearchBot, PerplexityBot) tout en bloquant les agents d'entraînement (GPTBot). Un fichier `llms.txt` statique liste les pages clés — utile pour Perplexity et d'autres écosystèmes que Google ne consulte pas directement, mais qui complète l'écosystème IA.

**Tech Stack:** Next.js App Router, TypeScript, Schema.org JSON-LD

## Global Constraints

- Respecter les conventions du codebase : pas de refactoring non sollicité, suivre les patterns existants (async page components, `copy` objects pour le texte multilingue, `SITE_URL` via `process.env.NEXT_PUBLIC_SITE_URL`)
- Tous les textes multilingues doivent avoir une version `en` et `fr`
- Ne jamais modifier les fichiers du legacy projet (`.reversa/`, `_reversa_sdd/`)
- Version Node.js : minimale celle requise par Next.js 15 (App Router)
- Les chemins de fichiers sont relatifs à la racine du projet
- Google dit explicitement qu'il ne faut pas se focaliser sur des "hacks" AEO/GEO — tout changement technique doit servir à la fois le SEO classique et les réponses IA
- Pas de `FAQPage` comme décoration — Google a supprimé le rich result FAQ en juin 2026
- JSON-LD uniquement, jamais de Microdata

---

### Task 1: Robots.txt — Politique prudente agents IA

**Files:**
- Modify: `app/robots.txt/route.ts`

**Interfaces:**
- Consumes: `SITE_URL` from env (existing)
- Produces: Updated robots.txt with differentiated AI bot policy: allow search bots (OAI-SearchBot, PerplexityBot, Perplexity-User), block training bots (GPTBot), allow Google-Extended, keep existing admin/api disallows

**Context from spec:**
- OpenAI distingue `OAI-SearchBot` (recherche ChatGPT) de `GPTBot` (entraînement) — on autorise le premier, bloque le second
- Perplexity distingue `PerplexityBot` (résultats) de `Perplexity-User` (fetch utilisateur) — on autorise les deux
- Google-Extended contrôle l'usage du contenu pour l'entraînement Gemini — on autorise
- `llms.txt` n'améliore pas Google Search directement, mais peut être utile pour Perplexity et d'autres outils

- [ ] **Step 1: Écrire la nouvelle politique robots.txt**

Remplacer le contenu de `app/robots.txt/route.ts` par :

```typescript
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";

export async function GET(): Promise<Response> {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

# Search bots — allow for citation in AI-generated answers
User-agent: OAI-SearchBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

# Google AI — allow for Gemini grounding
User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Googlebot-News
Allow: /

User-agent: Google-Extended
Allow: /

# Training bots — block to prevent model training usage
User-agent: GPTBot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
```

Points clés :
- `OAI-SearchBot` autorisé → le blog apparaît dans les réponses ChatGPT Search
- `PerplexityBot` et `Perplexity-User` autorisés → le blog apparaît dans Perplexity
- `GPTBot` bloqué → le contenu n'est pas utilisé pour l'entraînement de GPT
- `Googlebot`, `Googlebot-Image`, `Googlebot-News`, `Google-Extended` autorisés → crawl complet + Gemini grounding
- `Claude-SearchBot` et `Claude-User` ne sont pas dans la spec finale (Anthropic n'a pas de liste publique claire) — on les omet
- `Disallow: /admin/` et `Disallow: /api/` conservés pour la protection existante

- [ ] **Step 2: Vérifier la syntaxe**

Exécuter : `curl http://localhost:3000/robots.txt` (en dev) pour confirmer que le texte est bien servi avec `Content-Type: text/plain; charset=utf-8`.

- [ ] **Step 3: Commit**

```bash
git add app/robots.txt/route.ts
git commit -m "feat: differentiate AI search vs training bots in robots.txt"
```

---

### Task 2: Structured-data — Bloc @graph unifié + Person author + BlogPosting complet

**Files:**
- Modify: `lib/seo/structured-data.ts`

**Interfaces:**
- Consumes: `SITE_URL`, `SITE_NAME`, `ORG_NAME` (existing constants)
- Produces: New `siteGraphSchema(locale)` function returning a `@graph` JSON-LD object containing Organization + WebSite + WebPage linked by shared `@id`. New `authorPersonSchema(name, sameAs)` function. Updated `articleSchema()` to include `author.@id` reference and ensure `dateModified` is always present.

**Context from spec:**
- Homepage needs: Organization + WebSite + WebPage in a `@graph` block
- Article needs: BlogPosting with headline, image, author (Person), publisher, datePublished, dateModified, mainEntityOfPage
- Author needs: Person with name, url, sameAs, worksFor
- Organization needs: logo, url, sameAs
- Google recommande `dateModified` pour améliorer la précision des informations temporelles
- `sameAs` doit pointer vers des URLs externes donnant plus d'informations sur l'entité

- [ ] **Step 1: Ajouter la fonction `siteGraphSchema(locale)`**

Créer une fonction qui retourne un `@graph` JSON-LD liant Organization, WebSite et WebPage :

```typescript
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
```

Note : `https://forge-blog.io` retiré de `sameAs` (c'est l'URL du site, pas un profil externe).

- [ ] **Step 2: Ajouter la fonction `authorPersonSchema(name, sameAs)`**

```typescript
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
```

- [ ] **Step 3: Mettre à jour `articleSchema()` pour inclure `dateModified` et author `@id`**

Modifier la fonction existante `articleSchema()` (lignes ~100-136) :

```typescript
export function articleSchema(input: ArticleSchemaInput) {
  const dateModified = input.dateModified ?? input.datePublished;

  return {
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
    ...(input.wordCount ? { wordCount: input.wordCount } : {}),
    ...(input.timeRequired ? { totalTime: input.timeRequired } : {}),
  };
}
```

Changements par rapport à l'existants :
- `@type` passe de `Article` à `BlogPosting` (plus spécifique pour un article de blog, recommandé par Google)
- `image` devient un objet complet avec `@type: ImageObject` (au lieu d'un string inline)
- `author` inclut `@id` pointant vers `authorPersonSchema`
- `publisher` inclut `@id` pointant vers `siteGraphSchema`
- `dateModified` est toujours présent (fallback sur `datePublished`)
- `mainEntityOfPage` utilise `@id` au lieu de `@type: WebPage` inline
- Propriétés optionnelles utilisent `undefined` au lieu de spread conditionnel pour les champs absents

- [ ] **Step 4: Vérifier la compilation TypeScript**

Exécuter : `npx tsc --noEmit --pretty` et confirmer qu'il n'y a pas d'erreurs nouvelles dans `lib/seo/structured-data.ts`.

- [ ] **Step 5: Commit**

```bash
git add lib/seo/structured-data.ts
git commit -m "feat: unify @graph schema, add BlogPosting, link author Person with @id"
```

---

### Task 3: Page d'accueil — Injecter le @graph, nettoyer le redundant

**Files:**
- Modify: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `siteGraphSchema()` from Task 2, `jsonLdString()` (existing)
- Produces: Home page renders only `siteGraphSchema()` in JSON-LD (already contains Organization + WebSite + WebPage)

**Context from spec:**
- `siteGraphSchema()` contient déjà Organization, WebSite et WebPage dans un `@graph`
- Pas besoin de `organizationSchema()` ni `websiteSchema()` séparément
- Pas de `FAQPage` ni `SearchAction` sur la home (Sitelinks Search Box déprécié en janvier 2026)
- H1 actuel ("Vous lisez, vous surlignez, vous oubliez la moitié") fonctionne bien — pas de changement nécessaire

- [ ] **Step 1: Nettoyer les imports**

Remplacer l'import existant (lignes ~18-22) :

```typescript
// Avant :
import {
  websiteSchema,
  organizationSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";

// Après :
import {
  siteGraphSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";
```

- [ ] **Step 2: Simplifier le JSON-LD**

Modifier les lignes 121-124 :

```typescript
// Avant :
const ldScripts = jsonLdString([
  organizationSchema(),
  websiteSchema(locale),
]);

// Après :
const ldScripts = jsonLdString([
  siteGraphSchema(locale),
]);
```

- [ ] **Step 3: Vérifier que la page compile**

Exécuter : `npx tsc --noEmit --pretty app/[locale]/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/page.tsx
git commit -m "feat: home page uses unified @graph schema, removes redundant individual schemas"
```

---

### Task 4: Page article — Injecter authorPersonSchema + BreadcrumbList

**Files:**
- Modify: `app/[locale]/article/[slug]/page.tsx`

**Interfaces:**
- Consumes: `authorPersonSchema()` from Task 2, `articleSchema()` (updated in Task 2), `breadcrumbSchema()` (existing)
- Produces: Article page injects author Person schema alongside BlogPosting + BreadcrumbList

**Context from spec:**
- Google recommande de lister tous les auteurs réellement présents sur la page
- `worksFor` et `sameAs` doivent être cohérents avec l'Organization
- BreadcrumbList existant déjà — on le conserve
- Pas de `FAQPage` sur les articles (sauf vraie section Q&R)

- [ ] **Step 1: Importer `authorPersonSchema`**

Modifier l'import de `structured-data` (lignes ~25-29) :

```typescript
// Avant :
import {
  articleSchema,
  breadcrumbSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";

// Après :
import {
  articleSchema,
  breadcrumbSchema,
  authorPersonSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";
```

- [ ] **Step 2: Définir les sameAs de l'auteur**

Ajouter une constante après `SITE_URL` (ligne ~32) :

```typescript
const AUTHOR_SAME_AS = [
  "https://nainoforge.com",
  "https://scyforge.com",
];
```

- [ ] **Step 3: Ajouter authorPersonSchema au jsonLdString**

Modifier les lignes 200-219 pour inclure l'auteur avant l'article :

```typescript
const ldScripts = jsonLdString([
  authorPersonSchema("Forge Editorial", AUTHOR_SAME_AS),
  articleSchema({
    headline: article.title,
    description: article.excerpt,
    author: article.author,
    datePublished: article.published_at,
    dateModified: article.updated_at ?? article.published_at,
    imageUrl: article.cover_image_url ?? undefined,
    imageAlt: article.cover_image_alt ?? undefined,
    url: articleUrl,
    locale,
    wordCount: heroMeta && "wordCount" in heroMeta ? (heroMeta as any).wordCount : undefined,
    timeRequired: `PT${article.read_time_minutes}M`,
  }),
  breadcrumbSchema([
    { name: locale === "fr" ? "Accueil" : "Home", url: `${SITE_URL}/${locale}` },
    { name: heroMeta && "pillarName" in heroMeta ? (heroMeta as any).pillarName : "", url: `${SITE_URL}/${locale}#${article.pillar_slug}` },
    { name: article.title, url: articleUrl },
  ]),
]);
```

Changement clé : `dateModified` utilise maintenant `article.updated_at ?? article.published_at` (au lieu de `?? undefined`), garantissant que `dateModified` est toujours présent comme recommandé par Google.

- [ ] **Step 4: Vérifier la compilation**

Exécuter : `npx tsc --noEmit --pretty`

- [ ] **Step 5: Commit**

```bash
git add app/[locale]/article/[slug]/page.tsx
git commit -m "feat: article page includes author Person + BlogPosting with dateModified"
```

---

### Task 5: Page À propos — Ajouter JSON-LD Organization + WebPage

**Files:**
- Modify: `app/[locale]/a-propos/page.tsx`

**Interfaces:**
- Consumes: `siteGraphSchema()` from Task 2, `jsonLdString()` (existing)
- Produces: About page renders JSON-LD structured data

**Context from spec:**
- La page "À propos" est le signal E-E-A-T le plus lu par les IA pour juger qui est derrière le contenu
- Elle doit avoir un balisage cohérent avec le reste du site
- Meta title/description existants déjà — pas de changement nécessaire

- [ ] **Step 1: Ajouter les imports JSON-LD**

Modifier l'import existant pour ajouter les imports nécessaires :

```typescript
import type { Locale } from "@/lib/locale/resolve";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  siteGraphSchema,
  jsonLdString,
} from "@/lib/seo/structured-data";
```

- [ ] **Step 2: Ajouter le JSON-LD dans le JSX**

Insérer le script JSON-LD après l'ouverture du `return` (ligne ~50), avant le `<div>` :

```tsx
export default async function AboutPage({ params }: Props) {
  const { locale: raw } = await params;
  if (raw !== "en" && raw !== "fr") notFound();
  const locale = raw as Locale;
  const t = copy[locale];

  const canonicalUrl = `${SITE_URL}/${locale}/a-propos`;

  return (
    <>
      <div
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            siteGraphSchema(locale),
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "@id": `${canonicalUrl}#webpage`,
              url: canonicalUrl,
              name: t.metaTitle,
              description: t.metaDesc,
              isPartOf: { "@id": `${SITE_URL}/${locale}#website` },
            },
          ]),
        }}
        className="hidden"
        aria-hidden
      />

      <div className="mx-auto max-w-2xl px-4 py-16 md:py-20">
```

Il faut aussi ajouter la constante `SITE_URL` en haut du fichier :

```typescript
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forge-blog.io";
```

- [ ] **Step 3: Vérifier la compilation**

Exécuter : `npx tsc --noEmit --pretty app/[locale]/a-propos/page.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/a-propos/page.tsx
git commit -m "feat: add JSON-LD structured data to about page for E-E-A-T"
```

---

### Task 6: Créer llms.txt statique

**Files:**
- Create: `public/llms.txt`

**Interfaces:**
- Consumes: None (static file)
- Produces: `/llms.txt` file listing all important pages with one-line descriptions

**Context from spec:**
- Google dit explicitement qu'on peut ignorer `llms.txt` pour Google Search (pas d'impact sur le ranking)
- Perplexity expose un `/llms.txt` dans sa documentation comme index documentaire
- Utile pour d'autres écosystèmes (Claude, Gemini, Perplexity) mais pas pour Google Search
- Contient : présentation, pages importantes, méthodologie

- [ ] **Step 1: Écrire le fichier `public/llms.txt`**

```markdown
# Forge-Blog

Sciences cognitives, sans jargon. Articles sur la mémoire, l'apprentissage et la cognition — rédigés pour être testés, pas juste lus.

Cognitive science, without the jargon. Articles on memory, learning, and cognition — written to be tested, not just read.

## Pages principales

### Accueil / Home
- /fr — Blog de sciences cognitives en français. Articles sur la mémoire, l'apprentissage et la cognition.
- /en — Cognitive science blog in English. Articles on memory, learning, and cognition.

### Articles / Articles
- /fr/article/courbe-de-loubli — La courbe de l'oubli : combien vous perdez réellement, et à quelle vitesse. Plongée dans les découvertes d'Ebbinghaus et protocole de mesure personnelle.
- /en/article/courbe-de-loubli — The Forgetting Curve: How Much You Actually Lose, and How Fast. Deep dive into Ebbinghaus's findings and a protocol to measure your own memory decay.

### À propos / About
- /fr/a-propos — À propos de Forge-Blog : mission, méthodologie, équipe.
- /en/a-propos — About Forge-Blog: mission, methodology, and the team behind the writing.

### SCYForge
- /fr/scyforge — SCYForge : infrastructure de savoir organisationnel basée sur l'Arbre Sémantique. Liste d'attente.
- /en/scyforge — SCYForge: organizational knowledge infrastructure based on the Semantic Tree thesis. Waitlist.

## Méthodologie

Chaque article est rédigé pour être testé. Nous partageons nos méthodes expérimentales, nos sources primaires, et nos résultats bruts. Notre approche s'appuie sur les travaux d'Ebbinghaus, Dunlosky, Roediger et Karpicke.

Each article is written to be tested. We share our experimental methods, primary sources, and raw results. Our approach draws on Ebbinghaus, Dunlosky, Roediger, and Karpicke.
```

- [ ] **Step 2: Commit**

```bash
git add public/llms.txt
git commit -m "feat: add llms.txt for AI crawler content indexing (Perplexity, non-Google)"
```

---

### Task 7: Sitemap — Vérifier et compléter

**Files:**
- Modify: `app/sitemap.xml/route.ts`

**Interfaces:**
- Consumes: `SITE_URL` (existing), `getPublishedArticles()` (existing)
- Produces: Verified sitemap with correct lastmod, hreflang alternates, and static pages

**Context from spec:**
- Le sitemap existe déjà et est bien construit (hreflang, lastmod, priority)
- Vérifier qu'il inclut les pages statiques (a-propos, scyforge)
- Confirmer que la déclaration sitemap dans robots.txt pointe vers la bonne URL

- [ ] **Step 1: Vérifier que le sitemap inclut les pages statiques**

Lire `app/sitemap.xml/route.ts` et vérifier que les pages `/fr/a-propos`, `/en/a-propos`, `/fr/scyforge`, `/en/scyforge` sont incluses dans le sitemap. Si absentes, les ajouter :

```typescript
// Ajouter après les articles, avant la fermeture du xml :
const staticPages = [
  { path: `${locale}`, lastmod: new Date().toISOString().slice(0, 10), priority: "1.0" },
  { path: `${locale}/a-propos`, lastmod: new Date().toISOString().slice(0, 10), priority: "0.7" },
  { path: `${locale}/scyforge`, lastmod: new Date().toISOString().slice(0, 10), priority: "0.7" },
];
```

- [ ] **Step 2: Vérifier la déclaration dans robots.txt**

Confirmer que `app/robots.txt/route.ts` (Task 1) contient :
```
Sitemap: ${SITE_URL}/sitemap.xml
```

- [ ] **Step 3: Commit (si modifications)**

```bash
git add app/sitemap.xml/route.ts
git commit -m "fix: ensure sitemap includes static pages (about, scyforge)"
```

---

### Task 8: Alt text audit — Vérifier toutes les images

**Files:**
- Read-only audit of: `app/[locale]/page.tsx`, `app/[locale]/article/[slug]/page.tsx`, `components/public/ArticleCard.tsx`, `components/public/BlockRenderer.tsx`

**Interfaces:**
- Consumes: None (read-only)
- Produces: Audit report + fixes if any image lacks meaningful alt text

**Context from spec:**
- Google dit clairement de privilégier un alt qui décrit réellement l'image, sans bourrage de mots-clés
- Les images doivent avoir un alt descriptif, utile et contextualisé
- Placer les images près du texte pertinent

- [ ] **Step 1: Auditer chaque balise `<img>` dans le codebase**

Résultats de l'audit :
- `app/[locale]/page.tsx:181` → `alt={featured.cover_image_alt ?? featured.title}` ✅ (déjà fait)
- `components/public/ArticleCard.tsx:26` → `alt={article.cover_image_alt ?? article.title}` ✅ (déjà fait)
- `app/[locale]/article/[slug]/page.tsx` → les images du corps de l'article sont rendues par `BodyBlocks` (composant `components/public/BlockRenderer.tsx`) — à vérifier

- [ ] **Step 2: Vérifier BodyBlocks pour les images inline**

Lire `components/public/BlockRenderer.tsx` et `components/public/AdvancedMarkdownBlocks.tsx` pour vérifier que les images dans le contenu Markdown ont un alt.

- [ ] **Step 3: Commit (si corrections nécessaires)**

```bash
git add components/public/BlockRenderer.tsx
git commit -m "fix: ensure inline article images have descriptive alt text"
```

---

### Task 9: Validation finale

**Files:**
- Read-only verification

**Interfaces:**
- Consumes: All previous tasks
- Produces: Confirmation that all SEO/AEO/GEO changes are correct and consistent

**Context from spec — Definition of Done:**
- 100 % des points P0 validés (robots.txt, sitemap, canonical, indexation)
- Au moins 95 % des points P1 validés (HTML structure, meta, structured data, entity)
- Tous les JSON-LD conformes
- Les métadonnées, le maillage interne et les informations d'entité sont complets et cohérents

- [ ] **Step 1: Lancer le build complet**

Exécuter : `npx next build` et confirmer zéro erreur.

- [ ] **Step 2: Valider le robots.txt**

Exécuter en dev : `curl http://localhost:3000/robots.txt` et vérifier :
- `OAI-SearchBot` Allow: /
- `PerplexityBot` Allow: /
- `Perplexity-User` Allow: /
- `GPTBot` Disallow: /
- `Googlebot` Allow: /
- `Google-Extended` Allow: /
- `Sitemap:` présente

- [ ] **Step 3: Valider le llms.txt**

Exécuter : `curl http://localhost:3000/llms.txt` et vérifier le contenu.

- [ ] **Step 4: Valider le JSON-LD sur chaque page**

Inspecter le DOM de la home, d'un article, et de la page À propos pour confirmer les scripts JSON-LD sont injectés. Vérifier :
- Home : `@graph` avec Organization + WebSite + WebPage
- Article : `BlogPosting` avec author Person + dateModified + publisher
- À propos : WebPage avec description

- [ ] **Step 5: Valider la cohérence d'entité**

Vérifier que `sameAs` est identique dans `siteGraphSchema`, `authorPersonSchema`, et `organizationSchema` :
- `https://nainoforge.com`
- `https://scyforge.com`

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: final validation of SEO/AEO/GEO optimization"
```

---

## Résumé des tâches

| # | Fichier(s) | Description |
|---|-----------|-------------|
| 1 | `app/robots.txt/route.ts` | Politique différenciée : allow search bots (OAI, Perplexity), block training (GPTBot), allow Google-Extended |
| 2 | `lib/seo/structured-data.ts` | `siteGraphSchema()`, `authorPersonSchema()`, `BlogPosting` avec `dateModified` toujours présent, author `@id` lié |
| 3 | `app/[locale]/page.tsx` | Injecter `siteGraphSchema()` uniquement (remplace organizationSchema + websiteSchema) |
| 4 | `app/[locale]/article/[slug]/page.tsx` | Injecter `authorPersonSchema()` + `BlogPosting` avec `dateModified` garanti |
| 5 | `app/[locale]/a-propos/page.tsx` | Injecter JSON-LD WebPage + siteGraphSchema pour E-E-A-T |
| 6 | `public/llms.txt` | Fichier statique pour Perplexity et autres écosystèmes (pas pour Google Search) |
| 7 | `app/sitemap.xml/route.ts` | Vérifier inclusion pages statiques (a-propos, scyforge) |
| 8 | Audit images | Vérifier alt text sur toutes les images (BodyBlocks) |
| 9 | Validation | Build, curl, inspection JSON-LD, cohérence entité |
