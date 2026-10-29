# Kalakaar — Supabase Backend Plan (v1)

Status: PLAN ONLY. Koi code/SQL abhi run nahi hua. Approve hone ke baad hi build shuru hoga.

Source of truth: purane code ki queries (tables, columns, RPCs) + purani `01_backend_repair.sql`. Jo cheezein purane setup mein galat/risky thi, unhe yahan fix karke plan kiya hai (section 1).

---

## 0. Pehle ye decisions chahiye (mere recommended defaults ke saath)

| # | Sawal | Default (agar tum kuch na bolo) |
|---|-------|---------------------------------|
| 1 | Login methods | Email+password **aur** Google OAuth (UI mein dono the) |
| 2 | Email verification on signup | ON (production ke liye safe). Dev mein OFF kar sakte ho |
| 3 | Pehla admin kaise banega | Tum Supabase dashboard SQL se apni profile ko `super_admin` karoge (app se koi self-promote nahi) |
| 4 | Wishlist mein kya save hoga | Sirf artworks |
| 5 | Reviews kis par | Sirf artists par (1 user = 1 review per artist) |
| 6 | Supabase project | Naya, fresh project (purana nahi) |
| 7 | Artwork price | Optional display field; payments/cart nahi (pivot ke baad portfolio-showcase model) |

---

## 1. Purane setup ki galtiyan jo ab fix hongi

1. **Role escalation:** `profiles` update policy sirf `auth.uid() = id` thi, to koi bhi user apna `role` ya `is_featured`/`is_verified` khud badal sakta tha. -> Fix: protected columns trigger se lock.
2. **`GRANT ALL ... TO anon`:** anon ko sab tables pe full grant tha. -> Fix: sirf zaroori `SELECT`, baaki RLS + explicit grants.
3. **Reviews insert policy** `auth.uid() = user_id OR auth.uid() IS NOT NULL` — matlab koi bhi kisi ke naam se review daal sakta tha. -> Fix: `user_id = auth.uid()` strict.
4. **Counters client se badalte the** (like_count, view_count...). -> Fix: triggers + `SECURITY DEFINER` RPC.
5. **Collections mein artworks JSONB array** tha (no foreign key, orphan IDs). -> Fix: `collection_artworks` junction table.
6. **Admin features fake the:** analytics, reports, announcements, settings, artist-of-the-month sab in-memory/hardcoded the. -> Fix: real tables.
7. **Draft/unpublished content public readable tha** (`USING (true)`). -> Fix: public sirf `published`; owner/admin ko sab.
8. **Admin ke liye DB-level check nahi tha.** -> Fix: `is_admin()` function har admin policy mein.
9. **Duplicate views/columns** (`artist_reviews`, `artist_followers`, `wishlist` view, `wishlists.content_id` + `artwork_id`). -> Fix: ek hi clean naam.
10. Placeholder Supabase URL/key fallback. -> Fix: env missing ho to app clearly fail kare (silent fake nahi).

---

## 2. Feature -> Backend map

| Feature / Page | Backend kya karega | Tables / objects |
|---|---|---|
| Signup / Login / Logout | Supabase Auth; signup pe profile auto-create (trigger) | `auth.users`, `profiles`, trigger `handle_new_user` |
| Google login + callback | OAuth + `/auth/callback` route session exchange | Auth provider config |
| Forgot / reset password | Supabase email link -> `/auth/reset-password` | Auth |
| Route protection | `middleware.ts` session refresh + redirects (no loop) | `@supabase/ssr` |
| Welcome setup (artist onboarding) | Profile update: username, bio, styles, social, avatar | `profiles`, bucket `avatars` |
| Profile / Settings | Read/update own profile, avatar upload | `profiles`, `avatars` |
| Artist public profile `/artists/[username]` | Profile + stats + portfolio + stories + collections | `profiles`, `artworks`, `stories`, `collections` |
| Artist Portal / Upload artwork | Artwork CRUD, multi-image upload, draft/publish/archive, mark sold | `artworks`, bucket `artworks` |
| Explore / Artists / Search | Filters, sort, pagination, full-text + fuzzy search | indexes, RPC `search_everything` |
| Artwork details | Detail + views++ + like/save state + artist info | `artworks`, RPC `increment_view` |
| Like artwork | Toggle like, count auto-update | `artwork_likes`, trigger |
| Save / Wishlist | Per-user private list | `wishlists` |
| Follow artist | Follow/unfollow, follower count | `followers`, trigger |
| Reviews + rating | One review per user per artist, avg rating auto | `reviews`, trigger |
| Collections + Studio | Create collection, add/remove/reorder artworks, cover | `collections`, `collection_artworks` |
| Stories (create/edit/read) | CRUD, cover upload, categories, read time | `stories`, bucket `stories` |
| Notifications | Auto-created on follow/like/review; read/clear | `notifications`, triggers |
| Community page | Abhi sirf announcements + featured; full posts v2 mein | `announcements` |
| Home: quote / cultural fact | Optional DB content, local fallback rehta hai | `quotes`, `cultural_facts` |
| Admin `/kalakaar-admin` | Users/artists/content moderation, feature, suspend, reports, announcements, settings, Artist of the Month, analytics, dashboard | `reports`, `announcements`, `platform_settings`, `artist_of_the_month`, RPC `get_dashboard_data` |
| Commissions (`/commissions/new`) | **Abhi decide nahi** — form hai, backend v2 (neeche section 9) | (`commission_requests` v2) |

---

## 3. Database schema

Conventions: UUID PKs, `created_at/updated_at timestamptz`, `updated_at` auto-trigger, sab `public` schema, RLS **har table pe ON**.

### profiles  (1:1 with auth.users)
`id` (FK auth.users, cascade), `username` (unique, lowercase, regex `^[a-z0-9_]{3,30}$`), `display_name`, `full_name`, `email`, `role` (`buyer|artist|admin|super_admin`, default `buyer`), `is_artist`, `avatar_url`, `cover_image_url`, `featured_artwork_url`, `bio`, `location`, `city`, `state`, `primary_art_style`, `art_styles text[]`, `custom_art_style`, `instagram_url`, `website_url`, `behance_url`, `whatsapp_number`, `is_featured`, `featured_since`, `is_verified`, `is_active` (suspend), counters: `artwork_count, collection_count, story_count, follower_count, review_count, average_rating`.
- Note: purana `role='user'` hata ke `buyer` (UI already `user -> buyer` map karta hai).

### artworks
`id, artist_id (FK profiles), title, slug (unique), description, image_urls text[], cover_image_index, category, medium, tags text[], creation_year, dimensions, materials, price, status (draft|published|archived), is_sold, sold_visibility, is_featured, view_count, like_count, wishlist_count, published_at`.
- `available/sold` status values purane CHECK mein the; ab sold = alag boolean `is_sold` (UI ka "Mark as Sold" toggle).

### collections + collection_artworks
`collections`: `id, artist_id, title, slug, description, cover_image_url, status, is_featured, view_count, published_at`.
`collection_artworks`: `collection_id, artwork_id, position`, PK (collection_id, artwork_id). Rule: sirf collection owner apni hi artworks add kare (RLS check).

### stories
`id, artist_id, title, slug, excerpt, content, cover_image_url, category, status, read_time, view_count, is_featured, published_at`.
(Old code `is_featured` use karta tha stories pe; ab column explicit.)

### reviews
`id, artist_id, user_id, rating 1-5, comment, created_at, updated_at`, UNIQUE(artist_id, user_id), CHECK user_id <> artist_id. `user_name/user_avatar` columns hatenge — profile join se aayenge (stale copy nahi).

### followers
`artist_id, follower_id`, UNIQUE pair, CHECK different.

### artwork_likes, wishlists
`artwork_likes(artwork_id, user_id)` UNIQUE. `wishlists(user_id, artwork_id)` UNIQUE.

### notifications
`id, user_id, type, title, message, reference_id, is_read`. Sirf triggers/RPC se insert.

### Admin / platform
- `reports(id, reporter_id, target_type, target_id, reason, status open|reviewing|resolved|dismissed, resolved_by)`
- `announcements(id, title, message, created_by, is_active)`
- `platform_settings` (single row: site name, maintenance mode, signups_open, featured limits etc.)
- `artist_of_the_month(id, artist_id, month, year, reason, banner_url)` UNIQUE(month, year)
- `quotes`, `cultural_facts` (optional content)

### Indexes
FK columns, `artworks(status, category, created_at)`, `artworks(is_featured)`, GIN on `tags`, GIN full-text (`to_tsvector`) on artworks/stories/profiles, `pg_trgm` on `profiles.display_name`, `artworks.title`.

---

## 4. Auth + roles design

- Signup metadata se sirf `display_name`, `is_artist` liya jayega. Trigger `handle_new_user` role ko **sirf `buyer` ya `artist`** pe clamp karta hai — `admin` kabhi nahi.
- Unique username: signup trigger email prefix + random suffix se auto-generate; welcome setup mein user badal sakta hai (`checkUsernameExists` -> unique index se).
- `is_admin()` = `exists(select 1 from profiles where id = auth.uid() and role in ('admin','super_admin') and is_active)`; `SECURITY DEFINER`, fixed `search_path`.
- Trigger `guard_profile_columns`: non-admin user in columns ko change nahi kar sakta: `role, is_featured, featured_since, is_verified, is_active, *_count, average_rating`.
- Suspended (`is_active=false`) user: write policies fail (policies mein `is_active` check).
- Frontend: `AuthContext` sirf `supabase.auth` session + `profiles` row se user banayega (ek hi jagah, duplicate logic nahi). Role ka source = `profiles.role`.

---

## 5. RLS matrix (summary)

| Table | Public/anon read | Owner | Admin |
|---|---|---|---|
| profiles | haan (active only; email column private — neeche note) | update own (guarded cols exclude) | all |
| artworks | `status='published'` | full CRUD on own (artist role) | all |
| collections / stories | published | own CRUD | all |
| collection_artworks | via published collection | owner of collection | all |
| reviews | haan | insert/update/delete own | delete any |
| followers, artwork_likes | haan (count ke liye) | insert/delete own | - |
| wishlists | **nahi** | own only | - |
| notifications | nahi | read/update/delete own | - |
| reports | nahi | insert own | read/update |
| announcements | active wale | - | CRUD |
| platform_settings, artist_of_the_month | haan (read) | - | write |
| quotes, cultural_facts | haan | - | write |

**Email privacy note:** `profiles.email` public nahi hona chahiye. Plan: email ko `profiles` se hata kar sirf `auth.users` mein rakhna (AuthContext session se email leta hai). Profile type se `email` optional hoga. Isse spam-scraping nahi hogi.

---

## 6. Storage

| Bucket | Public read | Upload | Path rule | Limit |
|---|---|---|---|---|
| `avatars` | haan | authenticated, apne folder mein | `{user_id}/…` | 2 MB, images |
| `artworks` | haan | artist apne folder mein | `{user_id}/{artwork_id}/…` | 8 MB, jpg/png/webp |
| `stories` | haan | artist | `{user_id}/…` | 5 MB |
| `collections` | haan | artist | `{user_id}/…` | 5 MB |

Policies: insert/update/delete tab hi jab `(storage.foldername(name))[1] = auth.uid()::text`. Client-side compression already `browser-image-compression` se hota hai (dependency maujood).

---

## 7. Functions / triggers / RPC

**Triggers:** `set_updated_at` (sab tables), `handle_new_user`, `guard_profile_columns`, counters (`artwork_count, collection_count, story_count, like_count, wishlist_count, follower_count, review_count + average_rating`), notifications on follow / like / review.

**RPC (SECURITY DEFINER, fixed search_path):**
- `increment_view(kind, id)` — artwork/story/collection/profile views, sirf published pe
- `increment_share(kind, id)` (agar share counter chahiye)
- `search_everything(q, limit)` — artists + artworks + collections + stories, FTS + trigram
- `get_dashboard_data()` — admin only, counts + recent activity
- `get_analytics()` — admin only: top artist/artwork/collection/story, top category (existing counters se; naya event table nahi)
- `reorder_collection_artworks(collection_id, ids[])`

---

## 8. Code changes (kahan kya aayega)

1. **Files add:** `lib/supabase/{client,server,middleware}.ts` (strict env check, **no placeholder**), `middleware.ts`, `app/auth/callback/route.ts`, `.env.example` (URL + anon key), `supabase/migrations/*.sql`, generated `types/database.ts` (`supabase gen types`).
2. **Repositories:** 14 stubs ko wapas real queries se bharna — signatures same rahenge, to UI nahi tootegi. `BaseRepository` ko Supabase client wapas.
3. **`AuthRepository/AuthService/AuthContext`:** real auth; `StorageRepository`: real upload with the bucket/path rules.
4. **Admin repo:** hardcoded memory data hatake real tables/RPC.
5. **Security:** service-role key kahin nahi chahiye (sab RLS + `is_admin()` se). Agar kabhi chahiye to sirf server-only route mein.
6. **Vercel:** 2 env vars + Supabase Auth mein Site URL + redirect URLs (localhost + production domain).

---

## 9. Build phases (har phase ke baad test, tab agla)

| Phase | Kaam | Done kab maanenge |
|---|---|---|
| P0 | Decisions (section 0) + naya Supabase project, env keys | Tum confirm karo |
| P1 | Migrations: tables, indexes, triggers, RLS, storage | SQL clean run; RLS tests pass |
| P2 | Supabase clients, middleware, callback, AuthContext | Signup/login/logout/reset/Google chalte hain, redirect loop nahi |
| P3 | Profiles + avatar upload + welcome setup + settings | Artist profile banta/edit hota hai |
| P4 | Artworks, collections, stories (CRUD + uploads) | Upload -> publish -> explore mein dikhe |
| P5 | Likes, follows, wishlist, reviews, notifications | Counters sahi, notifications aate hain |
| P6 | Explore filters + search + suggestions | Fast, paginated |
| P7 | Admin panel real data + reports/settings/AOTM | Admin-only access verified |
| P8 | Security review + `next build` + Vercel deploy + prod check | Sab green |

**RLS testing (P1):** 3 test users (buyer, artist, admin) se checklist: buyer artist ki artwork edit na kar sake; user apna role badal na sake; draft public na dikhe; wishlist dusre ko na dikhe; non-admin admin RPC na chala sake.

---

## 10. Abhi scope ke bahar (v2)

Commission requests, messaging, payments/marketplace, community posts/discussions, artist verification flow, events/exhibitions, email notifications. Ye tab honge jab core stable ho (aapki priority list ke hisaab se).
