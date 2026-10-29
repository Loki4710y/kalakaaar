-- =====================================================================
-- Kalakaar — 008_account_and_stats.sql
-- 1) delete_my_account(): lets a signed-in user delete their own account.
-- 2) admin_overview():    exact admin totals computed in the database
--                         (replaces reading a 1000-row sample in the browser).
-- Both are SECURITY DEFINER with a fixed search_path, callable only by
-- signed-in users; nothing here needs the service_role key.
-- =====================================================================

-- Deleting the auth user cascades to the profile and everything the user owns
-- (artworks, stories, collections, likes, wishlists, followers, reports, clicks...).
-- Image files are removed by the app through the Storage API before this runs
-- (deleting storage rows in SQL would leave the real files behind).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_uid  uuid := auth.uid();
  v_role text;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  select role into v_role from public.profiles where id = v_uid;
  if v_role in ('admin', 'super_admin') then
    raise exception 'Admin accounts cannot be deleted from the app. Ask another admin to change your role first.'
      using errcode = '42501';
  end if;
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Exact numbers for the admin dashboard and analytics page.
create or replace function public.admin_overview()
returns json language plpgsql stable security definer set search_path = public as $$
declare r json;
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  select json_build_object(
    'total_views', coalesce((select sum(view_count) from public.artworks), 0),
    'top_category', (
      select json_build_object('name', category, 'count', c)
      from (
        select category, count(*) as c from public.artworks
        where status = 'published' and category is not null and category <> ''
        group by category order by c desc, category limit 1
      ) t
    ),
    'daily', (
      select json_agg(json_build_object(
        'day', d::date,
        'uploads', (select count(*) from public.artworks a where a.created_at::date = d::date),
        'views',   (select coalesce(sum(a.view_count), 0) from public.artworks a where a.created_at::date = d::date),
        'users',   (select count(*) from public.profiles p where p.created_at::date = d::date)
      ) order by d)
      from generate_series(current_date - 6, current_date, interval '1 day') d
    )
  ) into r;
  return r;
end $$;

revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
