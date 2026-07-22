# Vercel — Deployment Instructions

## Quick Deploy (1 minute)

1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import the `forge-blog` repository
4. Add these **Environment Variables** in Vercel Dashboard:

### Required (Production)
| Variable | Value | Where to find |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dojbyxyhcsvasfbaqved.supabase.co` | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase Dashboard → Settings → API (keep secret!) |
| `NEXT_PUBLIC_SITE_URL` | Your Vercel URL (e.g. `https://forge-blog.vercel.app`) | Set after deployment |

### Optional
| Variable | Value | Purpose |
|---|---|---|
| `AUTH_BEARER_TOKEN` | Any random string | Admin API auth fallback |
| `NEXT_PUBLIC_POSTHOG_KEY` | Your PostHog project key | Analytics |
| `AGNES_API_KEY` | Your Agnes AI key | Image/Video generation |

### ⚠️ IMPORTANT
- **Never commit** `.env.local` or `.dev.vars` to git
- On Vercel, set env vars in **Settings → Environment Variables**
- `SUPABASE_SERVICE_ROLE_KEY` is a SUPERSECRET — only on server-side

## Build Notes
- Next.js 15.5.4
- Build command: `pnpm build`
- Framework preset: Next.js JS
- Output directory: `.next` (default for Next.js framework)
- Node version: 18.x (default on Vercel)

## Troubleshooting
- If build fails with "out of memory": increase Vercel Hobby plan RAM or use Pro plan
- If pages return 404: check that `rewrites` in vercel.json are correct
- Supabase queries fail: verify env vars are set for all deployments environments (Preview & Production)

## Migrations from Cloudflare
This project was originally targeted at Cloudflare Workers via @opennextjs/cloudflare.
Vercel is a more stable hosting option for Next.js apps with heavy dependencies
(Mermaid ~3MB, BlockNote, React Flow). No edge runtime hacks needed.
