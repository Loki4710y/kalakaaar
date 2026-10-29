-- =====================================================================
-- Kalakaar — 006_contact_clicks.sql
-- Lets artists see how many people tapped their WhatsApp / Instagram / Email.
-- Privacy: the artist can read counts and times only, NEVER who clicked
-- (visitor_id is not readable by anyone except the database owner).
-- Run AFTER 001-005.
-- =====================================================================
create table public.contact_clicks (
  id         uuid primary key default gen_random_uuid(),
  artist_id  uuid not null references public.profiles(id) on delete cascade,
  visitor_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  channel    text not null check (channel in ('whatsapp', 'instagram', 'email')),
  artwork_id uuid references public.artworks(id) on delete set null,
  created_at timestamptz not null default now(),
  check (artist_id <> visitor_id)
);

create index idx_contact_clicks_artist on public.contact_clicks (artist_id, created_at desc);
create index idx_contact_clicks_visitor_time on public.contact_clicks (visitor_id, created_at);

alter table public.contact_clicks enable row level security;

revoke all on public.contact_clicks from anon, authenticated;
-- Column-level read: visitor_id is deliberately left out.
grant select (id, artist_id, channel, artwork_id, created_at) on public.contact_clicks to authenticated;
grant insert (artist_id, channel, artwork_id) on public.contact_clicks to authenticated;

create policy "contact_clicks: signed-in insert as self"
  on public.contact_clicks for insert to authenticated
  with check (visitor_id = auth.uid() and public.is_active_user());

create policy "contact_clicks: artist reads own, admin reads all"
  on public.contact_clicks for select to authenticated
  using (artist_id = auth.uid() or public.is_admin());

-- Anti-spam: at most 60 tracked taps per visitor per hour (admins exempt).
create trigger trg_rl_contact_clicks before insert on public.contact_clicks
  for each row execute function public.enforce_rate_limit('visitor_id', '60', '60');

-- Summary for the artist dashboard: counts per channel over the last N days.
create or replace function public.my_contact_stats(days int default 30)
returns table (channel text, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select c.channel, count(*)::bigint
  from public.contact_clicks c
  where c.artist_id = auth.uid()
    and c.created_at > now() - make_interval(days => greatest(1, least(days, 365)))
  group by c.channel
$$;

revoke all on function public.my_contact_stats(int) from public, anon;
grant execute on function public.my_contact_stats(int) to authenticated;
