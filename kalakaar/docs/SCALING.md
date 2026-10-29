# Kalakaar: running 1,000-2,000 visitors at once

## What the code already does (done)
| Risk | What was done |
|---|---|
| One database request per artwork card | Removed. Like counts arrive with the artwork. A page of 24 cards now needs 1 request, not 25. |
| Home page = 5 queries per visitor | Logged-out visitors get one CDN-cached copy (`/api/public/home`, 60s). |
| Shared artwork/artist/story/collection links rebuilt on every click | Pages are cached by the CDN for 5 min (ISR). One test run of 500 simultaneous visitors cost the database 1 request. |
| Auth-server call on every page view | Only protected pages (portal, settings, admin...) check the session on the server. |
| Slow sorts/filters | Partial indexes for popular, price, category, search, artists list (`007_scale.sql`). |
| RLS evaluated per row | Policies rewritten so `auth.uid()` / `is_admin()` run once per query (`007_scale.sql`). |
| Spam / abuse | Database-level rate limits on likes, follows, uploads, reports, contact taps. |
| Security holes in Next.js 14 | Upgraded to Next 15.5.27 (`npm audit`: 0 vulnerabilities). |

## Measured here (a 2-CPU sandbox, test tool on the same machine, so real hosting will do better)
* Database, 100,000 artworks + 2,000 users: every page query 1-9 ms.
* Database under 90 simultaneous clients: ~230 full page-loads/s (about 1,600 queries/s); 750 view-counts/s on 5 hot artworks; 390 likes/s. No failed transactions.
* App server, 500 simultaneous connections: ~500-570 pages/s from a single small process. On Vercel the CDN serves cached pages, so this is the worst case.
* NOT measured: real Supabase, real network, real Vercel. Do your own rehearsal (below).

## You must do these (dashboard settings, not code)
1. **Supabase plan.** Free tier is fine for testing. For a launch with real traffic use **Pro**, and keep the compute size at least "Small" for launch week. Free projects are paused after 1 week of inactivity and have small connection/CPU limits.
2. **Run migrations 004, 005, 006, 007** in order (SQL Editor). 007 is the speed one.
3. **Auth emails:** Settings -> Auth -> SMTP: add Resend or Brevo. The built-in mailer allows only a few emails per hour, so signups will fail on launch day without this.
4. **Auth rate limits:** Auth -> Rate Limits: keep sign-ups/sign-ins limits ON; consider enabling CAPTCHA (Auth -> Attack Protection).
5. **Storage egress:** every image view costs bandwidth. Artwork images are compressed at upload; keep uploads under ~300 KB. Pro includes 250 GB/month.
6. **Vercel:** deploy from Git. Region: choose the one closest to your Supabase region (Mumbai/Singapore for Indian users). Add the env vars from `.env.example`.
7. **Backups:** Pro has daily backups. On Free, export manually before launch.
8. **Sentry (optional):** create a free project, set `NEXT_PUBLIC_SENTRY_DSN`.

## Launch-day rehearsal (30 minutes, do it once)
1. Deploy to Vercel with the real Supabase project.
2. Create 2 artists and upload ~20 artworks.
3. Run: `npx autocannon -c 200 -d 30 https://YOUR-SITE/` and the same for `/explore`, one `/artwork/<id>`.
4. In Supabase -> Reports -> Database, watch CPU and connections while it runs. CPU under ~70% = healthy.
5. Make sure there are no 5xx errors in Vercel -> Logs.

## If traffic is bigger than expected
* Upgrade Supabase compute (a few clicks, no code change).
* Next candidates in code: cache `/explore` first page the same way as the home endpoint; serve images through a CDN with resizing.
