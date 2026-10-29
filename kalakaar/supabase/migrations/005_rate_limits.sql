-- =====================================================================
-- Kalakaar — 005_rate_limits.sql
-- Anti-spam limits enforced INSIDE the database, so they hold even if someone
-- calls the API directly with the public key and skips the website.
-- Run AFTER 001-004. Admins are exempt.
-- =====================================================================

create index if not exists idx_likes_user_time     on public.artwork_likes (user_id, created_at);
create index if not exists idx_wishlists_user_time on public.wishlists (user_id, created_at);
create index if not exists idx_followers_user_time on public.followers (follower_id, created_at);
create index if not exists idx_artworks_artist_time    on public.artworks (artist_id, created_at);
create index if not exists idx_stories_artist_time     on public.stories (artist_id, created_at);
create index if not exists idx_collections_artist_time on public.collections (artist_id, created_at);

-- Generic limiter.  Trigger args: (owner column, max rows, window in minutes)
create or replace function public.enforce_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner_col text := tg_argv[0];
  max_rows  int  := tg_argv[1]::int;
  win_min   int  := tg_argv[2]::int;
  owner_id  uuid;
  recent    int;
begin
  -- Inside a SECURITY DEFINER function current_user is the owner, so identify API callers by their JWT instead.
  -- No JWT user (dashboard SQL, service key, migrations) or an admin = exempt.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  owner_id := (to_jsonb(new) ->> owner_col)::uuid;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - make_interval(mins => $2)',
    tg_table_schema, tg_table_name, owner_col)
    into recent using owner_id, win_min;
  if recent >= max_rows then
    raise exception 'You are doing that too quickly. Please wait a while and try again.' using errcode = 'P0001';
  end if;
  return new;
end $$;

revoke all on function public.enforce_rate_limit() from public, anon, authenticated;

create trigger trg_rl_likes       before insert on public.artwork_likes for each row execute function public.enforce_rate_limit('user_id', '200', '60');
create trigger trg_rl_wishlists   before insert on public.wishlists     for each row execute function public.enforce_rate_limit('user_id', '200', '60');
create trigger trg_rl_followers   before insert on public.followers     for each row execute function public.enforce_rate_limit('follower_id', '100', '60');
create trigger trg_rl_artworks    before insert on public.artworks      for each row execute function public.enforce_rate_limit('artist_id', '40', '60');
create trigger trg_rl_stories     before insert on public.stories       for each row execute function public.enforce_rate_limit('artist_id', '20', '60');
create trigger trg_rl_collections before insert on public.collections   for each row execute function public.enforce_rate_limit('artist_id', '20', '60');
