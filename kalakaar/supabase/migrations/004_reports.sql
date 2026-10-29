-- =====================================================================
-- Kalakaar — 004_reports.sql
-- "Report" button: any signed-in user can flag an artist / artwork / story.
-- Only admins can read or manage reports. Run AFTER 001-003.
-- =====================================================================

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  item_type   text not null check (item_type in ('artist', 'artwork', 'story')),
  item_id     uuid not null,
  reason      text not null check (char_length(reason) between 3 and 500),
  status      text not null default 'pending' check (status in ('pending', 'reviewed', 'ignored', 'archived')),
  created_at  timestamptz not null default now(),
  unique (reporter_id, item_type, item_id)          -- one report per person per item
);

create index idx_reports_status on public.reports (status, created_at desc);

-- anti-spam: max 20 reports per user per 24h
create or replace function public.limit_reports()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- (SECURITY DEFINER: current_user is the owner here, so we key off the JWT user instead.)
  if auth.uid() is not null and not public.is_admin() then
    new.status := 'pending';
    if (select count(*) from public.reports
         where reporter_id = new.reporter_id and created_at > now() - interval '24 hours') >= 20 then
      raise exception 'Too many reports today. Please try again tomorrow.';
    end if;
  end if;
  return new;
end $$;

create trigger trg_limit_reports before insert on public.reports
  for each row execute function public.limit_reports();

alter table public.reports enable row level security;

-- Supabase auto-grants new tables to anon/authenticated; start from nothing, then grant only what is needed.
revoke all on public.reports from anon, authenticated;
revoke all on function public.limit_reports() from public, anon, authenticated;

grant select, insert, update, delete on public.reports to authenticated;

create policy "reports: signed-in insert own"
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_active_user());

create policy "reports: admin read"
  on public.reports for select to authenticated using (public.is_admin());

create policy "reports: admin update"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "reports: admin delete"
  on public.reports for delete to authenticated using (public.is_admin());
