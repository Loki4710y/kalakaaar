# SEO

## What the code does
- **Server-rendered content:** home, explore, artists, artwork, artist, story and collection pages are rendered on the server (public data only, anonymous client) and cached by the CDN for 5 minutes (`revalidate = 300`). Search engines receive real text, images and links in the first HTML.
- **Structured data (JSON-LD):** Product+VisualArtwork (artwork), ProfilePage+Person (artist), Article (story), CollectionPage+ItemList (collection), ItemList (explore), BreadcrumbList on every detail page, plus WebSite and Organization site-wide. Builders: `src/lib/jsonld.ts`. Only facts shown on the page are used (no invented ratings or reviews).
- **Metadata:** unique title and description per page (`src/lib/seoData.ts` for detail pages, each `page.tsx` for list pages). One canonical URL per page (the id-based address that is in the sitemap).
- **Indexing rules:** account, admin, auth, settings, wishlist, notifications, portal and `/search` pages are `noindex`. Missing or unpublished items are `noindex`.
- **Sitemap and robots:** `app/sitemap.ts` (database-driven, hourly) and `app/robots.ts`.
- **Images:** alt text includes the artwork title, style and artist; the main artwork image loads with priority.

## What only you can do
1. Add the site in Google Search Console, verify the domain, submit `https://<your-domain>/sitemap.xml`. Do the same in Bing Webmaster Tools.
2. Set `NEXT_PUBLIC_APP_URL` in Vercel to the real domain.
3. Add real social profile links to the Organization data (`src/components/seo/JsonLd.tsx`, `sameAs`) once the accounts exist.
4. Publish real content regularly: artist stories, technique guides, one collection per art style.
5. Earn links: artists share their Kalakaar profile on Instagram, WhatsApp and their own sites; submit to art directories and relevant blogs.
6. Check Core Web Vitals in Search Console after launch (PageSpeed Insights on the live URL).
