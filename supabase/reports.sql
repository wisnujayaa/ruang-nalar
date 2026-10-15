-- =====================================================================
-- Ruang Nalar — problem reports from users (bugs, wrong questions, wrong lessons, suggestions)
-- Run AFTER schema.sql and roles.sql. Safe to re-run.
--   - Anyone may report (including signed-out visitors), with an hourly limit.
--   - Reporters only see their own reports; admins see & manage all of them.
--   - Email notifications are sent by the Edge Function supabase/functions/notify-report.
-- =====================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references public.profiles (id) on delete set null,
  kind text not null check (kind in ('bug', 'soal', 'materi', 'saran', 'lain')),
  body text not null check (char_length(body) between 5 and 2000),
  contact text not null default '' check (char_length(contact) <= 120),
  context jsonb not null default '{}'::jsonb check (octet_length(context::text) <= 4000),
  status text not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  admin_note text not null default '' check (char_length(admin_note) <= 1000),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reports_created on public.reports (created_at desc);
create index if not exists idx_reports_user on public.reports (user_id);

alter table public.reports enable row level security;

drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports for insert to anon, authenticated
  with check (user_id is not distinct from auth.uid());
drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists reports_update on public.reports;
create policy reports_update on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists reports_delete on public.reports;
create policy reports_delete on public.reports for delete to authenticated using (public.is_admin());

-- Column grants: reporters only fill in the report itself (the id may be generated in the browser so
-- anonymous visitors can still trigger a notification); status & notes are admin-only.
revoke all on public.reports from anon, authenticated;
grant insert (id, kind, body, contact, context) on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;
grant update (status, admin_note) on public.reports to authenticated;

-- Limits: 10 reports/hour per account, 20 reports/hour across all anonymous visitors
create or replace function public.limit_reports() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if (select count(*) from public.reports where user_id = auth.uid() and created_at > now() - interval '1 hour') >= 10 then
      raise exception 'Terlalu banyak laporan dalam satu jam. Coba lagi nanti.';
    end if;
  elsif (select count(*) from public.reports where user_id is null and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Terlalu banyak laporan dari pengunjung tanpa akun. Masuk dulu, atau coba lagi nanti.';
  end if;
  return new;
end $$;
revoke all on function public.limit_reports() from public, anon, authenticated;
create or replace trigger trg_limit_reports before insert on public.reports
  for each row execute function public.limit_reports();
