-- =====================================================================
-- Kalakaar — 003_storage.sql
-- Buckets with size + MIME limits, and per-user folder policies.
-- Path rule for every upload:  <user_id>/<anything>
-- Buckets are public-read by URL; listing/enumeration is NOT allowed
-- (no SELECT policy on storage.objects).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('avatars',     'avatars',     true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('artworks',    'artworks',    true, 8388608, array['image/jpeg','image/png','image/webp']),
  ('stories',     'stories',     true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('collections', 'collections', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Postgres also needs SELECT access to rows touched by UPDATE/DELETE (and Supabase
-- `remove()`/upsert need it too). Scoped to the user's OWN folder, so nobody can
-- list or enumerate other people's files; admins can see all for moderation.
create policy "storage: own folder select" on storage.objects for select to authenticated
  using (bucket_id in ('avatars','artworks','stories','collections')
         and (storage.foldername(name))[1] = auth.uid()::text);
create policy "storage: admin select" on storage.objects for select to authenticated
  using (public.is_admin());

-- avatars: any active signed-in user, own folder
create policy "avatars: own folder insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_active_user());
create policy "avatars: own folder update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own folder delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- artworks / stories / collections: artists only, own folder
create policy "content: artist insert" on storage.objects for insert to authenticated
  with check (bucket_id in ('artworks','stories','collections')
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.is_artist_user());
create policy "content: artist update" on storage.objects for update to authenticated
  using (bucket_id in ('artworks','stories','collections')
         and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('artworks','stories','collections')
              and (storage.foldername(name))[1] = auth.uid()::text);
create policy "content: artist delete" on storage.objects for delete to authenticated
  using (bucket_id in ('artworks','stories','collections')
         and (storage.foldername(name))[1] = auth.uid()::text);

-- admins can remove any image (moderation)
create policy "storage: admin delete" on storage.objects for delete to authenticated
  using (public.is_admin());
