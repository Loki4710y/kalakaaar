# Launch checklist

Tick each box on the LIVE site (not localhost) before the public launch.

## Accounts and email
- [ ] Custom SMTP set in Supabase (Resend or Brevo). The default Supabase email is limited to a few mails per hour.
- [ ] Supabase > Authentication > URL Configuration: Site URL and Redirect URLs use the real domain (add `https://<domain>/auth/callback` and `https://<domain>/auth/verified`).
- [ ] Google login: the real domain is added in Google Cloud OAuth (authorised origins) and Supabase (Google provider).
- [ ] Sign up, verify email, sign in, reset password: all work end to end.
- [ ] Optional bot protection: create a free Cloudflare Turnstile widget; put the site key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Vercel) and the secret key in Supabase > Authentication > Attack Protection. Set BOTH or NEITHER.

## Hosting
- [ ] Vercel env vars set (see `.env.example`), Node 22, `NEXT_PUBLIC_APP_URL` = real domain. Redeploy after changing any `NEXT_PUBLIC_*`.
- [ ] Domain on HTTPS; `www` redirects to the main domain (or the reverse).
- [ ] `service_role` key is NOT in Vercel env vars or the code.
- [ ] Supabase Pro for launch week (daily backups, higher limits).

## Data and safety
- [ ] SQL migrations 001 to 009 all run, in order (008 adds "Delete my account" and exact admin totals; 009 adds the artist analytics; without them those features show an error).
- [ ] Storage buckets: file size limit and image-only types are set (migration 003 does this; confirm in Dashboard > Storage).
- [ ] Your admin account can open `/kalakaar-admin`; a normal account cannot.
- [ ] A normal user cannot see another user's private data (try with two accounts).

## Product flows
- [ ] Artist: onboarding, upload one artwork, bulk upload, edit, archive, delete.
- [ ] Buyer: browse, like, save, follow, tap WhatsApp / Instagram / email on an artist (the tap shows in the artist's stats).
- [ ] Report a piece of content; it appears in the admin reports queue.
- [ ] Mobile (real phone, slow network): home, explore, artwork, upload.
- [ ] Share an artwork link on WhatsApp: the preview shows the image and title.

## Legal and contact
- [ ] `CONTACT_EMAIL` and `LEGAL` in `src/config/features.ts` are real; the inbox is monitored.
- [ ] Privacy Policy and Terms reviewed by a lawyer.

## Monitoring and search
- [ ] Sentry DSN set (optional) and a test error appears in Sentry.
- [ ] Uptime monitor (UptimeRobot) pointed at the home page.
- [ ] Plausible domain set (optional).
- [ ] Google Search Console: domain verified, `/sitemap.xml` submitted. Same for Bing.
- [ ] Lighthouse / PageSpeed run on the live home and an artwork page.

## Soft launch
- [ ] 15 to 20 artists onboarded with real artworks.
- [ ] 20 to 30 friendly users invited first; fix what they find; then go public.
- [ ] Rollback known: Vercel > Deployments > previous deployment > Instant Rollback.
