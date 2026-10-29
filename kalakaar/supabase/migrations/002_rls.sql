-- =====================================================================
-- Kalakaar — 002_rls.sql
-- Row Level Security + explicit grants. RLS is ON for every table.
-- =====================================================================

alter table public.profiles            enable row level security;
alter table public.artist_contacts     enable row level security;
alter table public.artworks            enable row level security;
alter table public.collections         enable row level security;
alter table public.collection_artworks enable row level security;
alter table public.stories             enable row level security;
alter table public.artwork_likes       enable row level security;
alter table public.wishlists           enable row level security;
alter table public.followers           enable row level security;

-- ---------------------------------------------------------------------
-- Grants: start from nothing, then give only what is needed.
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant usage on schema public to anon, authenticated;

-- public read
grant select on public.profiles, public.artworks, public.collections,
                public.collection_artworks, public.stories, public.followers
  to anon, authenticated;

-- signed-in users
grant select, insert, update, delete on
  public.artworks, public.collections, public.collection_artworks, public.stories
  to authenticated;
grant update on public.profiles to authenticated;           -- no insert/delete: profiles are created by trigger
grant select, insert, update on public.artist_contacts to authenticated;
grant select, insert, delete on public.artwork_likes, public.wishlists, public.followers to authenticated;

-- masked contacts: signed-in only (anon gets nothing)
grant select on public.artist_contacts_public to authenticated;

-- functions callable from the client
grant execute on function public.increment_view(text, uuid) to anon, authenticated;
grant execute on function public.is_admin()        to anon, authenticated;
grant execute on function public.is_artist_user()  to anon, authenticated;
grant execute on function public.is_active_user()  to anon, authenticated;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles: public read active"
  on public.profiles for select to anon, authenticated using (is_active);
create policy "profiles: owner read"
  on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: admin read"
  on public.profiles for select to authenticated using (public.is_admin());

create policy "profiles: owner update"
  on public.profiles for update to authenticated
  using (id = auth.uid() and is_active) with check (id = auth.uid());
create policy "profiles: admin update"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- No insert policy (created by trigger) and no delete policy.

-- ---------------------------------------------------------------------
-- artist_contacts (base table: owner + admin only)
-- ---------------------------------------------------------------------
create policy "contacts: owner or admin read"
  on public.artist_contacts for select to authenticated
  using (artist_id = auth.uid() or public.is_admin());
create policy "contacts: owner insert"
  on public.artist_contacts for insert to authenticated
  with check (artist_id = auth.uid() and public.is_artist_user());
create policy "contacts: owner update"
  on public.artist_contacts for update to authenticated
  using (artist_id = auth.uid() and public.is_active_user())
  with check (artist_id = auth.uid());

-- ---------------------------------------------------------------------
-- artworks / collections / stories  (same shape)
-- ---------------------------------------------------------------------
-- artworks
create policy "artworks: public read published"
  on public.artworks for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.profiles p where p.id = artist_id));
create policy "artworks: owner read"
  on public.artworks for select to authenticated using (artist_id = auth.uid());
create policy "artworks: admin read"
  on public.artworks for select to authenticated using (public.is_admin());
create policy "artworks: artist insert"
  on public.artworks for insert to authenticated
  with check (artist_id = auth.uid() and public.is_artist_user());
create policy "artworks: owner update"
  on public.artworks for update to authenticated
  using (artist_id = auth.uid() and public.is_artist_user())
  with check (artist_id = auth.uid());
create policy "artworks: owner delete"
  on public.artworks for delete to authenticated
  using (artist_id = auth.uid() and public.is_active_user());
create policy "artworks: admin update"
  on public.artworks for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "artworks: admin delete"
  on public.artworks for delete to authenticated using (public.is_admin());

-- collections
create policy "collections: public read published"
  on public.collections for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.profiles p where p.id = artist_id));
create policy "collections: owner read"
  on public.collections for select to authenticated using (artist_id = auth.uid());
create policy "collections: admin read"
  on public.collections for select to authenticated using (public.is_admin());
create policy "collections: artist insert"
  on public.collections for insert to authenticated
  with check (artist_id = auth.uid() and public.is_artist_user());
create policy "collections: owner update"
  on public.collections for update to authenticated
  using (artist_id = auth.uid() and public.is_artist_user())
  with check (artist_id = auth.uid());
create policy "collections: owner delete"
  on public.collections for delete to authenticated
  using (artist_id = auth.uid() and public.is_active_user());
create policy "collections: admin update"
  on public.collections for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "collections: admin delete"
  on public.collections for delete to authenticated using (public.is_admin());

-- stories
create policy "stories: public read published"
  on public.stories for select to anon, authenticated
  using (status = 'published' and exists (select 1 from public.profiles p where p.id = artist_id));
create policy "stories: owner read"
  on public.stories for select to authenticated using (artist_id = auth.uid());
create policy "stories: admin read"
  on public.stories for select to authenticated using (public.is_admin());
create policy "stories: artist insert"
  on public.stories for insert to authenticated
  with check (artist_id = auth.uid() and public.is_artist_user());
create policy "stories: owner update"
  on public.stories for update to authenticated
  using (artist_id = auth.uid() and public.is_artist_user())
  with check (artist_id = auth.uid());
create policy "stories: owner delete"
  on public.stories for delete to authenticated
  using (artist_id = auth.uid() and public.is_active_user());
create policy "stories: admin update"
  on public.stories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "stories: admin delete"
  on public.stories for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- collection_artworks: visible with its collection (collections RLS applies);
-- only the collection owner can add their OWN artworks.
-- ---------------------------------------------------------------------
create policy "collection_artworks: read"
  on public.collection_artworks for select to anon, authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id));
create policy "collection_artworks: owner insert"
  on public.collection_artworks for insert to authenticated
  with check (
    public.is_artist_user()
    and exists (select 1 from public.collections c where c.id = collection_id and c.artist_id = auth.uid())
    and exists (select 1 from public.artworks   a where a.id = artwork_id    and a.artist_id = auth.uid())
  );
create policy "collection_artworks: owner update"
  on public.collection_artworks for update to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.artist_id = auth.uid()))
  with check (exists (select 1 from public.collections c where c.id = collection_id and c.artist_id = auth.uid()));
create policy "collection_artworks: owner delete"
  on public.collection_artworks for delete to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.artist_id = auth.uid())
         or public.is_admin());

-- ---------------------------------------------------------------------
-- likes (own rows only), wishlists (private), followers (public read)
-- ---------------------------------------------------------------------
create policy "likes: own read"
  on public.artwork_likes for select to authenticated using (user_id = auth.uid());
create policy "likes: own insert"
  on public.artwork_likes for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.artworks a where a.id = artwork_id and a.status = 'published')
  );
create policy "likes: own delete"
  on public.artwork_likes for delete to authenticated using (user_id = auth.uid());

create policy "wishlists: own read"
  on public.wishlists for select to authenticated using (user_id = auth.uid());
create policy "wishlists: own insert"
  on public.wishlists for insert to authenticated
  with check (
    user_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.artworks a where a.id = artwork_id and a.status = 'published')
  );
create policy "wishlists: own delete"
  on public.wishlists for delete to authenticated using (user_id = auth.uid());

create policy "followers: public read"
  on public.followers for select to anon, authenticated using (true);
create policy "followers: own follow"
  on public.followers for insert to authenticated
  with check (
    follower_id = auth.uid() and public.is_active_user()
    and exists (select 1 from public.profiles p where p.id = artist_id and p.role in ('artist','admin','super_admin'))
  );
create policy "followers: own unfollow"
  on public.followers for delete to authenticated using (follower_id = auth.uid());
