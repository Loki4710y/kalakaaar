-- =====================================================================
-- Kalakaar — 001_schema.sql
-- Tables, constraints, indexes, triggers, helper functions.
-- Security policies are in 002_rls.sql, storage in 003_storage.sql.
-- Run order: 001 -> 002 -> 003 (each exactly once, in the SQL Editor).
-- =====================================================================

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------
-- Generic helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  -- Only real user edits bump updated_at. Counter updates done by our own
  -- SECURITY DEFINER functions (current_user = owner) leave it untouched.
  if current_user in ('anon', 'authenticated') then
    new.updated_at := now();
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- profiles  (1:1 with auth.users). Login email stays in auth.users only.
-- ---------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name         text not null check (char_length(display_name) between 1 and 80),
  role                 text not null default 'buyer'
                         check (role in ('buyer', 'artist', 'admin', 'super_admin')),
  is_artist            boolean generated always as (role = 'artist') stored,
  avatar_url           text check (char_length(avatar_url) <= 500),
  cover_image_url      text check (char_length(cover_image_url) <= 500),
  featured_artwork_url text check (char_length(featured_artwork_url) <= 500),
  bio                  text check (char_length(bio) <= 2000),
  location             text check (char_length(location) <= 120),
  city                 text check (char_length(city) <= 80),
  state                text check (char_length(state) <= 80),
  primary_art_style    text check (char_length(primary_art_style) <= 60),
  art_styles           text[] not null default '{}' check (cardinality(art_styles) <= 10),
  custom_art_style     text check (char_length(custom_art_style) <= 60),
  website_url          text check (char_length(website_url) <= 300),
  behance_url          text check (char_length(behance_url) <= 300),
  is_featured          boolean not null default false,
  featured_since       timestamptz,
  is_verified          boolean not null default false,
  is_active            boolean not null default true,
  artwork_count        integer not null default 0,
  collection_count     integer not null default 0,
  story_count          integer not null default 0,
  follower_count       integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- artist_contacts  (WhatsApp / Instagram / Email redirects)
-- Base table: owner + admin only. Visitors read the masked view below.
-- ---------------------------------------------------------------------
create table public.artist_contacts (
  artist_id        uuid primary key references public.profiles(id) on delete cascade,
  whatsapp_number  text check (whatsapp_number ~ '^[0-9]{8,15}$'),
  instagram_handle text check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  contact_email    text check (char_length(contact_email) <= 254
                               and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  show_whatsapp    boolean not null default true,
  show_instagram   boolean not null default true,
  show_email       boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- artworks
-- ---------------------------------------------------------------------
create table public.artworks (
  id                uuid primary key default gen_random_uuid(),
  artist_id         uuid not null references public.profiles(id) on delete cascade,
  title             text not null check (char_length(title) between 1 and 150),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  description       text check (char_length(description) <= 5000),
  image_urls        text[] not null default '{}' check (cardinality(image_urls) <= 10),
  cover_image_index integer not null default 0 check (cover_image_index >= 0),
  category          text not null check (char_length(category) between 1 and 60),
  medium            text check (char_length(medium) <= 100),
  tags              text[] not null default '{}' check (cardinality(tags) <= 20),
  creation_year     integer check (creation_year between 1000 and 2100),
  dimensions        text check (char_length(dimensions) <= 100),
  materials         text check (char_length(materials) <= 200),
  price             numeric(12,2) check (price >= 0),
  status            text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_sold           boolean not null default false,
  sold_visibility   text not null default 'public' check (sold_visibility in ('public', 'hidden')),
  is_featured       boolean not null default false,
  view_count        integer not null default 0,
  like_count        integer not null default 0,
  wishlist_count    integer not null default 0,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- collections + collection_artworks
-- ---------------------------------------------------------------------
create table public.collections (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null references public.profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 150),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 160),
  description      text check (char_length(description) <= 3000),
  cover_image_url  text check (char_length(cover_image_url) <= 500),
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_featured      boolean not null default false,
  view_count       integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.collection_artworks (
  collection_id uuid not null references public.collections(id) on delete cascade,
  artwork_id    uuid not null references public.artworks(id) on delete cascade,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  primary key (collection_id, artwork_id)
);

-- ---------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------
create table public.stories (
  id               uuid primary key default gen_random_uuid(),
  artist_id        uuid not null references public.profiles(id) on delete cascade,
  title            text not null check (char_length(title) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 200),
  excerpt          text check (char_length(excerpt) <= 500),
  content          text not null check (char_length(content) <= 60000),
  cover_image_url  text check (char_length(cover_image_url) <= 500),
  category         text not null default 'Artist Journey' check (char_length(category) <= 60),
  status           text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  read_time        text check (char_length(read_time) <= 30),
  is_featured      boolean not null default false,
  view_count       integer not null default 0,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- social: likes, wishlist, followers
-- ---------------------------------------------------------------------
create table public.artwork_likes (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

create table public.wishlists (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  artwork_id  uuid not null references public.artworks(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, artwork_id)
);

create table public.followers (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  artist_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, artist_id),
  check (follower_id <> artist_id)
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index idx_profiles_role_active   on public.profiles (role) where is_active;
create index idx_profiles_featured      on public.profiles (is_featured) where is_featured;
create index idx_profiles_name_trgm     on public.profiles using gin (display_name extensions.gin_trgm_ops);
create index idx_profiles_username_trgm on public.profiles using gin (username extensions.gin_trgm_ops);

create index idx_artworks_artist        on public.artworks (artist_id);
create index idx_artworks_feed          on public.artworks (status, published_at desc);
create index idx_artworks_category      on public.artworks (category) where status = 'published';
create index idx_artworks_featured      on public.artworks (is_featured) where is_featured;
create index idx_artworks_tags          on public.artworks using gin (tags);
create index idx_artworks_title_trgm    on public.artworks using gin (title extensions.gin_trgm_ops);

create index idx_collections_artist     on public.collections (artist_id);
create index idx_collections_feed       on public.collections (status, published_at desc);
create index idx_collections_title_trgm on public.collections using gin (title extensions.gin_trgm_ops);
create index idx_collection_artworks_art on public.collection_artworks (artwork_id);

create index idx_stories_artist         on public.stories (artist_id);
create index idx_stories_feed           on public.stories (status, published_at desc);
create index idx_stories_title_trgm     on public.stories using gin (title extensions.gin_trgm_ops);

create index idx_likes_artwork          on public.artwork_likes (artwork_id);
create index idx_wishlists_artwork      on public.wishlists (artwork_id);
create index idx_followers_artist       on public.followers (artist_id);

-- ---------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so they can read profiles without RLS recursion)
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin') and is_active
  );
$$;

create or replace function public.is_artist_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('artist', 'admin', 'super_admin') and is_active
  );
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active);
$$;

-- ---------------------------------------------------------------------
-- Signup: auto-create profile. Role is clamped to buyer/artist, never admin.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta      jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  prefix    text  := split_part(coalesce(new.email, 'user'), '@', 1);
  base      text;
  candidate text;
  tries     int := 0;
  v_role    text;
  v_name    text;
  v_avatar  text;
begin
  v_role := case when (meta->>'is_artist') = 'true' or (meta->>'role') = 'artist'
                 then 'artist' else 'buyer' end;

  v_name := left(coalesce(
              nullif(trim(meta->>'display_name'), ''),
              nullif(trim(meta->>'full_name'), ''),
              nullif(trim(meta->>'name'), ''),
              prefix), 80);
  if v_name is null or v_name = '' then v_name := 'Kalakaar User'; end if;

  base := regexp_replace(lower(prefix), '[^a-z0-9_]', '', 'g');
  if char_length(base) < 3 then base := base || 'user'; end if;
  base := left(base, 20);
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate) and tries < 25 loop
    tries := tries + 1;
    candidate := base || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 5);
  end loop;

  v_avatar := coalesce(meta->>'avatar_url', meta->>'picture');
  if v_avatar is null or v_avatar !~ '^https://' or char_length(v_avatar) > 500 then
    v_avatar := null;
  end if;

  insert into public.profiles (id, username, display_name, role, avatar_url)
  values (new.id, candidate, v_name, v_role, v_avatar);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Guards: users can never touch privileged columns (checked in the DB,
-- not the UI). Our own SECURITY DEFINER functions / dashboard bypass it
-- because current_user is then the owner, not anon/authenticated.
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_update()
returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if new.id is distinct from old.id
       or new.is_featured is distinct from old.is_featured
       or new.featured_since is distinct from old.featured_since
       or new.is_verified is distinct from old.is_verified
       or new.is_active is distinct from old.is_active
       or new.artwork_count is distinct from old.artwork_count
       or new.collection_count is distinct from old.collection_count
       or new.story_count is distinct from old.story_count
       or new.follower_count is distinct from old.follower_count then
      raise exception 'Protected profile column' using errcode = '42501';
    end if;
    -- Users may switch buyer <-> artist, never to/from admin roles.
    if new.role is distinct from old.role
       and (new.role not in ('buyer', 'artist') or old.role not in ('buyer', 'artist')) then
      raise exception 'Protected profile column: role' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_artwork_write()
returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_featured := false; new.view_count := 0; new.like_count := 0; new.wishlist_count := 0;
    else
      if new.artist_id is distinct from old.artist_id
         or new.is_featured is distinct from old.is_featured
         or new.view_count is distinct from old.view_count
         or new.like_count is distinct from old.like_count
         or new.wishlist_count is distinct from old.wishlist_count then
        raise exception 'Protected artwork column' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_collection_write()
returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_featured := false; new.view_count := 0;
    else
      if new.artist_id is distinct from old.artist_id
         or new.is_featured is distinct from old.is_featured
         or new.view_count is distinct from old.view_count then
        raise exception 'Protected collection column' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_story_write()
returns trigger language plpgsql as $$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.is_featured := false; new.view_count := 0;
    else
      if new.artist_id is distinct from old.artist_id
         or new.is_featured is distinct from old.is_featured
         or new.view_count is distinct from old.view_count then
        raise exception 'Protected story column' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;

-- Per-artist upload limits (abuse / storage protection)
create or replace function public.enforce_content_limit()
returns trigger language plpgsql as $$
declare
  v_count integer;
  v_limit integer;
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    execute format('select count(*) from public.%I where artist_id = $1', tg_table_name)
      into v_count using new.artist_id;
    v_limit := case tg_table_name when 'artworks' then 100 when 'collections' then 50 else 100 end;
    if v_count >= v_limit then
      raise exception 'Limit reached: at most % % allowed', v_limit, tg_table_name using errcode = '53400';
    end if;
  end if;
  return new;
end $$;

-- published_at is set the first time content becomes published
create or replace function public.set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Counters (maintained by triggers, never by clients)
-- ---------------------------------------------------------------------
create or replace function public.refresh_profile_counts(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set
    artwork_count    = (select count(*) from public.artworks    where artist_id = p_id and status = 'published'),
    collection_count = (select count(*) from public.collections where artist_id = p_id and status = 'published'),
    story_count      = (select count(*) from public.stories     where artist_id = p_id and status = 'published'),
    follower_count   = (select count(*) from public.followers   where artist_id = p_id)
  where id = p_id;
end $$;

create or replace function public.trg_profile_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then perform public.refresh_profile_counts(new.artist_id); end if;
  if tg_op in ('DELETE', 'UPDATE') and (tg_op = 'DELETE' or old.artist_id is distinct from new.artist_id) then
    perform public.refresh_profile_counts(old.artist_id);
  end if;
  return null;
end $$;

create or replace function public.trg_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid := coalesce(new.artwork_id, old.artwork_id);
begin
  update public.artworks set like_count = (select count(*) from public.artwork_likes where artwork_id = v_id)
  where id = v_id;
  return null;
end $$;

create or replace function public.trg_wishlist_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_id uuid := coalesce(new.artwork_id, old.artwork_id);
begin
  update public.artworks set wishlist_count = (select count(*) from public.wishlists where artwork_id = v_id)
  where id = v_id;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- Trigger wiring
-- ---------------------------------------------------------------------
create trigger trg_profiles_updated   before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_contacts_updated   before update on public.artist_contacts
  for each row execute function public.set_updated_at();
create trigger trg_artworks_updated   before update on public.artworks
  for each row execute function public.set_updated_at();
create trigger trg_collections_updated before update on public.collections
  for each row execute function public.set_updated_at();
create trigger trg_stories_updated    before update on public.stories
  for each row execute function public.set_updated_at();

create trigger trg_profiles_guard     before update on public.profiles
  for each row execute function public.guard_profile_update();
create trigger trg_artworks_guard     before insert or update on public.artworks
  for each row execute function public.guard_artwork_write();
create trigger trg_collections_guard  before insert or update on public.collections
  for each row execute function public.guard_collection_write();
create trigger trg_stories_guard      before insert or update on public.stories
  for each row execute function public.guard_story_write();

create trigger trg_artworks_limit     before insert on public.artworks
  for each row execute function public.enforce_content_limit();
create trigger trg_collections_limit  before insert on public.collections
  for each row execute function public.enforce_content_limit();
create trigger trg_stories_limit      before insert on public.stories
  for each row execute function public.enforce_content_limit();

create trigger trg_artworks_published    before insert or update on public.artworks
  for each row execute function public.set_published_at();
create trigger trg_collections_published before insert or update on public.collections
  for each row execute function public.set_published_at();
create trigger trg_stories_published     before insert or update on public.stories
  for each row execute function public.set_published_at();

create trigger trg_artworks_counts    after insert or update or delete on public.artworks
  for each row execute function public.trg_profile_counts();
create trigger trg_collections_counts after insert or update or delete on public.collections
  for each row execute function public.trg_profile_counts();
create trigger trg_stories_counts     after insert or update or delete on public.stories
  for each row execute function public.trg_profile_counts();

create trigger trg_followers_counts   after insert or delete on public.followers
  for each row execute function public.trg_profile_counts();

create trigger trg_likes_count        after insert or delete on public.artwork_likes
  for each row execute function public.trg_like_count();
create trigger trg_wishlists_count    after insert or delete on public.wishlists
  for each row execute function public.trg_wishlist_count();

-- ---------------------------------------------------------------------
-- View counter (the only way a visitor can change a counter)
-- Only published content counts. The app additionally dedupes per browser.
-- ---------------------------------------------------------------------
create or replace function public.increment_view(p_kind text, p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind = 'artwork' then
    update public.artworks set view_count = view_count + 1 where id = p_id and status = 'published';
  elsif p_kind = 'story' then
    update public.stories set view_count = view_count + 1 where id = p_id and status = 'published';
  elsif p_kind = 'collection' then
    update public.collections set view_count = view_count + 1 where id = p_id and status = 'published';
  else
    raise exception 'invalid kind';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Masked contact view: logged-in visitors only see channels the artist
-- chose to show. Hidden channels come back as NULL.
-- (Runs with owner rights on purpose; access is controlled by GRANTs.)
-- ---------------------------------------------------------------------
create view public.artist_contacts_public with (security_invoker = false) as
select
  c.artist_id,
  case when c.show_whatsapp  then c.whatsapp_number  end as whatsapp_number,
  case when c.show_instagram then c.instagram_handle end as instagram_handle,
  case when c.show_email     then c.contact_email    end as contact_email
from public.artist_contacts c
join public.profiles p on p.id = c.artist_id and p.is_active;
