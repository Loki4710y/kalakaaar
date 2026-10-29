# Kalakaar — Supabase database

## One-time setup (new project)
1. supabase.com -> New project (note the DB password somewhere safe).
2. **SQL Editor**: run these files **once, in order, one at a time**:
   1. `migrations/001_schema.sql`
   2. `migrations/002_rls.sql`
   3. `migrations/003_storage.sql`
   4. `migrations/004_reports.sql` (Report button + admin moderation)
   5. `migrations/005_rate_limits.sql` (anti-spam limits for likes, follows, uploads, reports)
   6. `migrations/006_contact_clicks.sql`, `007_scale.sql`, then `008_account_and_stats.sql` (self-serve account deletion and exact admin totals), then `009_artist_analytics.sql` (daily views and the artist analytics screen)
3. **Authentication -> URL Configuration**
   - Site URL: `http://localhost:3000` (later your production domain)
   - Redirect URLs: `http://localhost:3000/auth/callback` (+ production `/auth/callback`)
4. **Authentication -> Providers -> Email**: keep "Confirm email" ON.
   **Authentication -> Email Templates** (important, makes verification links work on any device/browser
   and open the themed "Email Verified" page instead of a 404):
   - *Confirm signup*: replace the link with
     `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/auth/verified">Verify my email</a>`
   - *Reset password*: replace the link with
     `<a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password">Reset password</a>`
5. **Settings -> API**: copy *Project URL* and *anon public key* into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   Never put the `service_role` key in the frontend or any `NEXT_PUBLIC_*` variable.
6. Make yourself the first admin (SQL Editor, once, after you signed up):
   ```sql
   update public.profiles set role = 'super_admin'
   where id = (select id from auth.users where email = 'YOUR_EMAIL');
   ```

## Notes
- The linter may warn about the "security definer view" `artist_contacts_public`. That is intentional:
  it masks hidden contact channels and is granted to signed-in users only.
- Counters (likes, followers, views...) and privileged columns (role, is_featured, is_verified, is_active)
  can only be changed by the database itself / admins, never by a normal user.

## Local verification (no Supabase needed)
`tests/` contains a tiny Supabase imitation plus 100+ security checks (RLS, role guards, storage rules).
Run against any scratch Postgres 15+:
```
PGHOST=... PGPORT=... PGUSER=postgres ./supabase/tests/run_local.sh
```
Last run: all checks passed.
