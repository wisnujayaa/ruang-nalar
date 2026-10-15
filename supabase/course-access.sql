-- =====================================================================
-- Ruang Nalar — course access: who may open teacher-made courses
-- Run AFTER schema.sql, courses.sql, and roles.sql. Safe to re-run.
--
--   draft    : owner only (work in progress)
--   class    : owner + members of THE OWNER'S CLASSES that use this course  ← "locked"
--   unlisted : anyone with the link (not shown in the catalog)
--   public   : everyone, shown in the catalog
--
-- A class is the "door" to a class-only course: students get access by joining
-- with the class code. Leaving / being removed from the class revokes access.
-- =====================================================================

-- 1) New visibility value: 'class'
alter table public.courses drop constraint if exists courses_visibility_check;
alter table public.courses add constraint courses_visibility_check
  check (visibility in ('draft', 'class', 'unlisted', 'public'));

-- 2) Who may read
alter policy courses_select_anon on public.courses using (visibility in ('unlisted', 'public'));
alter policy courses_select_auth on public.courses using (
  visibility in ('unlisted', 'public')
  or owner_id = auth.uid()
  or (visibility = 'class' and exists (
        select 1 from public.classes c
        where c.course_id = courses.id
          and c.owner_id = courses.owner_id      -- only classes owned by the course author unlock it
          and public.in_class(c.id))));

-- 3) A class may only use a teacher course if the class owner owns it,
--    or if it is open anyway (unlisted / public). Without this, anyone who guesses a course id
--    could create their own class to "unlock" someone else's course.
create or replace function public.guard_class_course() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.course_id ~ '^c-' and not exists (
       select 1 from public.courses k
       where k.id = new.course_id
         and (k.owner_id = new.owner_id or k.visibility in ('unlisted', 'public'))) then
    raise exception 'Kursus ini terkunci dan tidak bisa dipakai di kelasmu.';
  end if;
  return new;
end $$;
revoke all on function public.guard_class_course() from public, anon, authenticated;
create or replace trigger trg_guard_class_course
  before insert or update of course_id on public.classes
  for each row execute function public.guard_class_course();
