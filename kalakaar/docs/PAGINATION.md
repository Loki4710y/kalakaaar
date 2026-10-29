# Pagination (server-side everywhere)

No list loads "everything and filters in the browser" any more. Every list asks the database for one page and the total count (`count: exact` + `.range()`), with a stable sort that ends in `id` so pages never overlap.

| List | Where | Page size | Style |
|---|---|---|---|
| Explore artworks | `/explore?page=` | 12 | URL pages (SEO-friendly `<Link>`s, canonical per page) |
| Artists | `/artists?page=` | 12 | URL pages |
| Stories | `/stories?page=` | 9 | URL pages |
| Collections | `/collections?page=` | 9 | URL pages |
| Search (4 tabs) | `/search` | 12 per tab | "Show more", filters run in the database, typing is debounced |
| Artist profile (artworks, collections, stories) | `/artist/[id]` | 12 | "Show more"; first page is server-rendered |
| Artist portal (own artworks) | `/artist-portal` | 12 | "Show more"; stats come from a separate count query |
| Collection picker | collection studio | 24 | "Show more" |
| Wishlist | `/wishlist` | 12 | One joined query + "Show more" |
| Admin: artists, artworks, collections, stories | `/kalakaar-admin` | 10 (changeable) | Numbered pages; search, status, filter and sort run in the database |
| Admin: reports | `/kalakaar-admin` | 20 | "Show more", per content type |
| Sitemap | `/sitemap.xml` | up to 12000 per type | Paged reads of 1000 (PostgREST maximum) |

Notes
- A page past the end returns an empty page with the real total (PostgREST `PGRST103` is handled); URL lists redirect to the last page.
- Search/sort variants are `noindex`; plain page N is indexable with its own canonical.
- Helpers: `src/repositories/utils.ts` (`pageRange`, `makePaged`, `isRangeError`), `src/lib/listParams.ts`, `src/hooks/useServerPages.ts`, `src/hooks/useAdminTable.ts`.
- Admin counts like "total views" on the dashboard and analytics still read a bounded sample (1000 rows). Replace with SQL aggregates (a view or RPC) once the site has more than ~1000 artworks.
