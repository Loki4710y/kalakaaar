# Kalakaar

A discovery site for Indian folk artists (Madhubani, Warli, Gond, Pattachitra and more). Artists show their work, stories and collections; art lovers browse, save and contact the artist directly. Kalakaar is a showcase, not a marketplace: it does not sell or process payments.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres with Row Level Security, Storage) · deployed on Vercel.

## Quick start

Requirements: Node 22 (`.nvmrc`), a Supabase project.

```bash
npm install
cp .env.example .env.local     # then fill in the values (see below)
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Same page, `anon public` key (safe to expose; security comes from RLS) |
| `NEXT_PUBLIC_APP_URL` | yes in production | Real site address, e.g. `https://yourdomain.com` (https, no trailing slash). Used for canonical links, sitemap, robots, social previews. A production build stops if it is missing. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional | Cloudflare Turnstile site key for signup bot protection (the secret goes in Supabase, never here) |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | Error tracking |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | Privacy-friendly analytics |

**Never** put the Supabase `service_role` key in this app or in any `NEXT_PUBLIC_*` variable.

Every `NEXT_PUBLIC_*` value is baked in at build time, so redeploy after changing one.

## Database

Run the files in `supabase/migrations/` once, in order, in the Supabase SQL Editor (001 to 009). Full steps, auth email templates and how to make yourself the first admin are in [`supabase/README.md`](supabase/README.md).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve it (build needs the env vars above) |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser smoke tests (Playwright; run `npm run build` first) |
| `./supabase/tests/run_local.sh` | Database security tests (RLS, roles, storage rules) against a scratch local Postgres, never a real project |

CI (`.github/workflows/ci.yml`) runs type-check, lint, unit tests and a production build on every push and pull request.

## Project layout

```
app/            Routes (server components, metadata, sitemap, robots)
src/views/      Page UIs (client components)
src/components/ Shared UI, layout, SEO, admin
src/repositories/  All Supabase queries (one class per table group)
services/       Thin business-logic layer used by the views
src/lib/        Helpers (site URL, JSON-LD, public server data, sanitising, ...)
src/config/     Feature flags and legal/contact details
lib/supabase/   Supabase clients (browser, server, anon, middleware)
supabase/       Migrations and database tests
docs/           Launch checklist, SEO, scaling, pagination, backend plan
tests/          Unit and e2e tests
```

## Before you launch

1. Replace `CONTACT_EMAIL` and `LEGAL` in `src/config/features.ts` with your real details.
2. Work through [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).
3. Have the Privacy Policy and Terms (`app/privacy`, `app/terms`) reviewed by someone qualified. They are drafts, not legal advice.

More: [`docs/SEO.md`](docs/SEO.md) · [`docs/PAGINATION.md`](docs/PAGINATION.md) · [`docs/SCALING.md`](docs/SCALING.md)


LIVE DEMO- https://kalkaar-beta.vercel.app/
