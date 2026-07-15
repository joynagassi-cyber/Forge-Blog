# Forge-Blog

Shared public content platform for **NainoForge** and **SCYForge**.

Built from `forge-blog-system-prompt.md`: editorial engine + reader-facing blog with neutral surfaces, violet accent only, locale-aware EN/FR, Supabase backend, provider-agnostic AI pipeline.

## Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Editor (planned wiring) | BlockNote on Tiptap |
| Diagrams | React Flow |
| Backend | Supabase (Postgres, Auth, Storage, RLS, Edge Functions) |
| Analytics | PostHog |
| Deploy | Vercel + Supabase Cloud |

## Quick start

```bash
cd forge-blog
pnpm install
pnpm dev
```

- Public blog: [http://localhost:3000](http://localhost:3000) (redirects to `/en` or `/fr`)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

Demo content runs **without** Supabase. To persist:

1. Create a Supabase project
2. Copy `.env.example` → `.env.local` and fill keys
3. Apply migrations in `supabase/migrations/` (in order)
4. Enable Google OAuth in Supabase Auth

## Build order (section 14.7)

1. Schema + RLS + auth
2. Admin shell + BlockNote ↔ `articles.content`
3. AI adapters + Edge Functions (human approval gate)
4. Public blog + locale middleware
5. Design system polish (violet shimmer, light/dark)
6. SEO/AEO/GEO + hreflang + sitemap
7. Diagrams, PostHog, performance dashboard

## Scripts

```bash
pnpm dev          # local server
pnpm build        # production build
pnpm test         # unit tests (blocks, locale, AI, pillars)
pnpm lint
```

## Repo map

```
app/(public via [locale])  public blog
app/admin                  editorial dashboard
components/public          cards, TOC, block renderers
components/shared          design-system primitives
lib/ai                     provider adapters
lib/blocks                 section 10 scaffold + validation
lib/locale                 Accept-Language / cookie / geo resolution
lib/pillars                pillar → product mapping
supabase/migrations        schema + RLS + seeds
supabase/functions         AI + sitemap edge scaffolds
```

## Non-negotiables

- No invented stats or testimonials; mark unverified claims `[à vérifier]`
- Violet only on titles, links, CTAs, active states, and bold body emphasis
- Three separate AI calls (brief / draft / audit); never publish AI output without human review
- Conversion paths come from `pillars.target_product`, not free-form AI choice
