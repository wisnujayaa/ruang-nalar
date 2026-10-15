-- =====================================================================
-- Ruang Nalar — teacher-made courses (web course editor)
-- Run AFTER schema.sql, then roles.sql and course-access.sql (course access). Safe to re-run.
-- =====================================================================
create table if not exists public.courses (
  id text primary key default ('c-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10))
     check (id ~ '^c-[a-z0-9]{6,20}$'),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  subject text not null default '' check (char_length(subject) <= 40),
  level text not null default '' check (char_length(level) <= 60),
  blurb text not null default '' check (char_length(blurb) <= 300),
  glyph text not null default '' check (char_length(glyph) <= 8),
  color text not null default 'accent' check (color in ('accent', 'sol')),
  visibility text not null default 'draft' check (visibility in ('draft', 'unlisted', 'public')),
  content jsonb not null default '{}'::jsonb check (octet_length(content::text) < 1500000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_courses_owner on public.courses (owner_id);
create index if not exists idx_courses_public on public.courses (visibility) where visibility = 'public';

alter table public.courses enable row level security;

-- Anonymous visitors: public / unlisted courses only
drop policy if exists courses_select_anon on public.courses;
create policy courses_select_anon on public.courses for select to anon using (visibility <> 'draft');
-- Signed-in users: non-draft courses, their own courses, or courses used by their classes
drop policy if exists courses_select_auth on public.courses;
create policy courses_select_auth on public.courses for select to authenticated using (
  visibility <> 'draft' or owner_id = auth.uid()
  or exists (select 1 from public.classes c where c.course_id = courses.id and public.in_class(c.id)));
drop policy if exists courses_insert on public.courses;
create policy courses_insert on public.courses for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists courses_update on public.courses;
create policy courses_update on public.courses for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists courses_delete on public.courses;
create policy courses_delete on public.courses for delete to authenticated using (owner_id = auth.uid());

grant select on public.courses to anon, authenticated;
grant insert, delete on public.courses to authenticated;
-- owner & id cannot be changed
revoke update on public.courses from authenticated;
grant update (title, subject, level, blurb, glyph, color, visibility, content, updated_at) on public.courses to authenticated;
revoke insert, delete, truncate, references, trigger on public.courses from anon;
revoke truncate, references, trigger on public.courses from authenticated;
