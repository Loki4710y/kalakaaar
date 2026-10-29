-- =====================================================================
-- Kalakaar — 009_artist_analytics.sql
-- Artist analytics: day-by-day views, likes, saves, new followers and contact
-- taps for the signed-in artist's own work.
--
-- 1) artwork_daily_views  one tiny row per artwork per day (never one row per visit).
-- 2) increment_view()     now also bumps today's row (artworks only).
-- 3) my_analytics(days)   one call returns totals, a daily series, top artworks
--                         and taps per channel. Reads ONLY the caller's own data.
-- Days are counted in Indian time (Asia/Kolkata) so "today" matches the artist's day.
-- No service_role key is needed. Run AFTER 001-008.
-- =====================================================================

create table if not exists public.artwork_daily_views (
  artwork_id uuid    not null references public.artworks(id) on delete cascade,
  day        date    not null,
  views      integer not null default 0 check (views >= 0),
  primary key (artwork_id, day)
);

create index if not exists idx_artwork_daily_views_day on public.artwork_daily_views (day);

alter table public.artwork_daily_views enable row level security;
-- No policies and no grants: the table is written by increment_view() and
-- read by my_analytics(), both SECURITY DEFINER. Nobody touches it directly.
revoke all on public.artwork_daily_views from anon, authenticated;

create or replace function public.increment_view(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'artwork' then
    update public.artworks set view_count = view_count + 1 where id = p_id and status = 'published';
    if found then
      insert into public.artwork_daily_views (artwork_id, day, views)
      values (p_id, (now() at time zone 'Asia/Kolkata')::date, 1)
      on conflict (artwork_id, day) do update set views = public.artwork_daily_views.views + 1;
    end if;
  elsif p_kind = 'story' then
    update public.stories set view_count = view_count + 1 where id = p_id and status = 'published';
  elsif p_kind = 'collection' then
    update public.collections set view_count = view_count + 1 where id = p_id and status = 'published';
  else
    raise exception 'invalid kind';
  end if;
end $$;

create or replace function public.my_analytics(p_days int default 30)
returns json language plpgsql stable security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_days  int  := greatest(7, least(coalesce(p_days, 30), 90));
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_from  date;
  r       json;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  v_from := v_today - (v_days - 1);

  with series as (
    select d::date as day from generate_series(v_from, v_today, interval '1 day') d
  ),
  v as (
    select dv.day, sum(dv.views)::int as n
    from public.artwork_daily_views dv
    join public.artworks a on a.id = dv.artwork_id
    where a.artist_id = v_uid and dv.day between v_from and v_today
    group by dv.day
  ),
  l as (
    select (x.created_at at time zone 'Asia/Kolkata')::date as day, count(*)::int as n
    from public.artwork_likes x
    join public.artworks a on a.id = x.artwork_id
    where a.artist_id = v_uid
      and (x.created_at at time zone 'Asia/Kolkata')::date between v_from and v_today
    group by 1
  ),
  s as (
    select (x.created_at at time zone 'Asia/Kolkata')::date as day, count(*)::int as n
    from public.wishlists x
    join public.artworks a on a.id = x.artwork_id
    where a.artist_id = v_uid
      and (x.created_at at time zone 'Asia/Kolkata')::date between v_from and v_today
    group by 1
  ),
  f as (
    select (x.created_at at time zone 'Asia/Kolkata')::date as day, count(*)::int as n
    from public.followers x
    where x.artist_id = v_uid
      and (x.created_at at time zone 'Asia/Kolkata')::date between v_from and v_today
    group by 1
  ),
  c as (
    select (x.created_at at time zone 'Asia/Kolkata')::date as day, count(*)::int as n
    from public.contact_clicks x
    where x.artist_id = v_uid
      and (x.created_at at time zone 'Asia/Kolkata')::date between v_from and v_today
    group by 1
  ),
  daily as (
    select series.day,
           coalesce(v.n, 0) as views, coalesce(l.n, 0) as likes, coalesce(s.n, 0) as saves,
           coalesce(f.n, 0) as followers, coalesce(c.n, 0) as contacts
    from series
    left join v on v.day = series.day
    left join l on l.day = series.day
    left join s on s.day = series.day
    left join f on f.day = series.day
    left join c on c.day = series.day
  )
  select json_build_object(
    'days', v_days,
    'totals', (select json_build_object(
        'views', coalesce(sum(views), 0), 'likes', coalesce(sum(likes), 0),
        'saves', coalesce(sum(saves), 0), 'followers', coalesce(sum(followers), 0),
        'contacts', coalesce(sum(contacts), 0)) from daily),
    'daily', (select coalesce(json_agg(json_build_object(
        'day', day, 'views', views, 'likes', likes, 'saves', saves,
        'followers', followers, 'contacts', contacts) order by day), '[]'::json) from daily),
    'top', (select coalesce(json_agg(t), '[]'::json) from (
        select a.id, a.title,
               coalesce(a.image_urls[a.cover_image_index + 1], a.image_urls[1]) as image,
               coalesce((select sum(dv.views) from public.artwork_daily_views dv
                         where dv.artwork_id = a.id and dv.day between v_from and v_today), 0)::int as views,
               a.like_count as likes, a.wishlist_count as saves
        from public.artworks a
        where a.artist_id = v_uid and a.status = 'published'
        order by 4 desc, a.like_count desc, a.id
        limit 5) t),
    'channels', (select coalesce(json_object_agg(channel, n), '{}'::json) from (
        select x.channel, count(*)::int as n from public.contact_clicks x
        where x.artist_id = v_uid
          and (x.created_at at time zone 'Asia/Kolkata')::date between v_from and v_today
        group by x.channel) q)
  ) into r;
  return r;
end $$;

revoke all on function public.my_analytics(int) from public, anon;
grant execute on function public.my_analytics(int) to authenticated;
