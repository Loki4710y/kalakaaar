# Artist tools, language and share cards

## Artist analytics (Artist Portal > "Your audience")
- Data comes from one database function, `my_analytics(days)` (migration 009). It only reads the signed-in artist's own data and is not callable by anonymous visitors.
- Daily views are stored as one tiny row per artwork per day (`artwork_daily_views`), written by `increment_view()`. Nobody can read or write that table directly. Days are counted in Indian time.
- History starts the day migration 009 is run: earlier views only exist as a total.
- Screen: `src/components/artist/AnalyticsPanel.tsx`. Cleaning of the database answer: `src/lib/analytics.ts` (unit tested).

## Onboarding checklist
- Six steps: photo, bio (20+ characters), art style + location, one contact channel, first artwork, share the profile.
- Five are read from the real profile, so they tick themselves. Only "share" is remembered in this browser (localStorage); hiding the checklist is remembered the same way.
- Logic: `src/lib/onboarding.ts` (unit tested). Screen: `src/components/artist/OnboardingChecklist.tsx`.
- The art style is chosen in Profile (artists only).

## Hindi / English
- Dictionaries: `src/lib/i18n/en.ts` (source of truth) and `hi.ts`. Same keys are enforced by the compiler: a missing Hindi key fails `tsc`.
- Use `const { t } = useLanguage();` then `t("some.key")`. Placeholders look like `{n}`.
- The server always renders English (fast, cacheable, indexable); the saved choice is applied right after load.
- Only interface text is translated. Artist-written content (bios, titles, stories) is shown as written.
- Translated so far: navbar, footer, home, explore, artists, artwork page labels, wishlist, artist portal, analytics, checklist, share, empty states. Not yet: sign-in/sign-up form, search page, settings, story/collection editors, admin panel.

## Share cards
- `GET /api/share-card/{artwork|artist}/{uuid}?size=og|post|story&lang=en|hi[&download=1]` returns a JPEG in the Kalakaar style (cream and burgundy, diamond border).
- Sizes: `og` 1200x630 (link previews), `post` 1080x1350 (Instagram), `story` 1080x1920 (WhatsApp status, Instagram story).
- Used as the first `og:image` of artwork and artist pages, and in the Share card panel (artwork page and Artist Portal) with download and native share.
- Safety: only published public rows (anonymous client + RLS), uuid-only ids, images are fetched only from our own Supabase storage host, 4 s timeout, 10 MB limit. Responses are cached by the CDN for a day.
- Fonts live in `assets/fonts` (SIL Open Font License) and are bundled through `outputFileTracingIncludes` in `next.config.js`.
