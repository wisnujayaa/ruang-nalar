-- =====================================================================
-- Ruang Nalar — akses kursus: siapa yang boleh membuka kursus buatan guru
-- Jalankan SETELAH schema.sql, courses.sql, dan roles.sql. Aman dijalankan ulang.
--
--   draft    : hanya pemilik (sedang ditulis)
--   class    : pemilik + anggota KELAS MILIK PEMILIK yang memakai kursus ini  ← "terkunci"
--   unlisted : siapa pun yang punya tautannya (tidak muncul di katalog)
--   public   : semua orang, tampil di katalog
--
-- Kelas adalah "pintu" kursus berstatus class: siswa mendapat akses dengan bergabung
-- memakai kode kelas. Keluar/dikeluarkan dari kelas = aksesnya ikut hilang.
-- =====================================================================

-- 1) Nilai visibilitas baru: 'class'
alter table public.courses drop constraint if exists courses_visibility_check;
alter table public.courses add constraint courses_visibility_check
  check (visibility in ('draft', 'class', 'unlisted', 'public'));

-- 2) Siapa yang boleh membaca
alter policy courses_select_anon on public.courses using (visibility in ('unlisted', 'public'));
alter policy courses_select_auth on public.courses using (
  visibility in ('unlisted', 'public')
  or owner_id = auth.uid()
  or (visibility = 'class' and exists (
        select 1 from public.classes c
        where c.course_id = courses.id
          and c.owner_id = courses.owner_id      -- hanya kelas milik pembuat kursus yang membuka kunci
          and public.in_class(c.id))));

-- 3) Kelas hanya boleh memakai kursus buatan guru bila kursus itu milik pembuat kelas,
--    atau memang terbuka (lewat tautan / publik). Tanpa ini, siapa pun yang menebak id kursus
--    bisa membuat kelas sendiri untuk "membuka" kursus orang lain.
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
