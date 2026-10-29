-- =====================================================================
-- Kalakaar — 007_scale.sql
-- Speed for 1000-2000+ simultaneous visitors. Safe to run once, after 001-006.
--  1) Indexes for the sort/filter options the site actually offers.
--  2) RLS policies rewritten so auth.uid()/is_admin() run ONCE per query
--     instead of once per row (Supabase's recommended pattern). Same rules,
--     same results, just faster. The RLS test suite proves the rules are unchanged.
-- =====================================================================

-- 1) Indexes (all partial on published rows = small and fast)
create index if not exists idx_artworks_popular
  on public.artworks (like_count desc, view_count desc) where status = 'published';
create index if not exists idx_artworks_price
  on public.artworks (price) where status = 'published';
create index if not exists idx_artworks_category_trgm
  on public.artworks using gin (category extensions.gin_trgm_ops) where status = 'published';
create index if not exists idx_artworks_medium_trgm
  on public.artworks using gin (medium extensions.gin_trgm_ops) where status = 'published';
create index if not exists idx_artworks_desc_trgm
  on public.artworks using gin (description extensions.gin_trgm_ops) where status = 'published';
create index if not exists idx_artworks_cat_feed
  on public.artworks (category, published_at desc) where status = 'published';
create index if not exists idx_profiles_artists_followers
  on public.profiles (follower_count desc) where role = 'artist' and is_active;
create index if not exists idx_stories_popular
  on public.stories (view_count desc) where status = 'published';
create index if not exists idx_collections_popular
  on public.collections (view_count desc) where status = 'published';

-- 2) Policies: evaluate helpers once per query
drop policy if exists "profiles: owner read" on public.profiles;
create policy "profiles: owner read" on public.profiles for select to authenticated
  using (id = (select auth.uid()));
drop policy if exists "profiles: admin read" on public.profiles;
create policy "profiles: admin read" on public.profiles for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "contacts: owner or admin read" on public.artist_contacts;
create policy "contacts: owner or admin read" on public.artist_contacts for select to authenticated
  using (artist_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "artworks: owner read" on public.artworks;
create policy "artworks: owner read" on public.artworks for select to authenticated
  using (artist_id = (select auth.uid()));
drop policy if exists "artworks: admin read" on public.artworks;
create policy "artworks: admin read" on public.artworks for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "collections: owner read" on public.collections;
create policy "collections: owner read" on public.collections for select to authenticated
  using (artist_id = (select auth.uid()));
drop policy if exists "collections: admin read" on public.collections;
create policy "collections: admin read" on public.collections for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "stories: owner read" on public.stories;
create policy "stories: owner read" on public.stories for select to authenticated
  using (artist_id = (select auth.uid()));
drop policy if exists "stories: admin read" on public.stories;
create policy "stories: admin read" on public.stories for select to authenticated
  using ((select public.is_admin()));

drop policy if exists "likes: own read" on public.artwork_likes;
create policy "likes: own read" on public.artwork_likes for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists "wishlists: own read" on public.wishlists;
create policy "wishlists: own read" on public.wishlists for select to authenticated
  using (user_id = (select auth.uid()));

analyze;
