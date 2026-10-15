-- =====================================================================
-- Ruang Nalar — pengerasan keamanan (hasil audit). Jalankan SETELAH semua file SQL lain. Aman dijalankan ulang.
--  1. Hak kolom paling minim: tiap tabel hanya boleh diisi/diubah di kolom yang memang dipakai aplikasi.
--     (Mencegah, misalnya, penulis utas mengganti author_id supaya utasnya tampak ditulis guru.)
--  2. Batas ukuran data yang ditulis pengguna (progres, target tugas, tautan pesan).
--  3. Batas percobaan kode kelas (anti tebak-tebakan kode).
-- =====================================================================

-- 1) Hak kolom ---------------------------------------------------------
-- Kelas: dibuat dengan nama, kursus, pemilik; yang boleh diubah hanya nama, kursus, dan kode.
revoke insert, update on public.classes from authenticated;
grant insert (name, course_id, owner_id) on public.classes to authenticated;
grant update (name, course_id, join_code) on public.classes to authenticated;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'classes_join_code_format') then
    alter table public.classes add constraint classes_join_code_format check (join_code ~ '^[A-Z0-9]{6,12}$');
  end if;
end $$;

-- Forum: penulis & waktu diisi server; yang bisa diubah hanya judul, isi, sematkan, selesai.
revoke insert, update on public.forum_threads from authenticated;
grant insert (class_id, title, body) on public.forum_threads to authenticated;
grant update (title, body, pinned, solved) on public.forum_threads to authenticated;
revoke insert, update on public.forum_posts from authenticated;
grant insert (thread_id, body) on public.forum_posts to authenticated;

-- Anggota kelas hanya bertambah lewat join_class (kode). Keluar/dikeluarkan tetap lewat DELETE + kebijakan.
revoke insert, update on public.class_members from authenticated;

-- Tugas: pembuat & waktu diisi server.
revoke insert, update on public.assignments from authenticated;
grant insert (class_id, title, description, target, due_at) on public.assignments to authenticated;

-- Pesan: pengirim & waktu diisi server; penerima hanya bisa menandai dibaca.
revoke insert on public.messages from authenticated;
grant insert (to_user, body, link) on public.messages to authenticated;

-- Profil dibuat oleh trigger saat daftar; tidak pernah dibuat/dihapus langsung lewat API.
revoke insert, delete on public.profiles from authenticated;

-- 2) Batas ukuran ------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'progress_state_size') then
    alter table public.progress add constraint progress_state_size check (octet_length(state::text) <= 600000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assignments_target_size') then
    alter table public.assignments add constraint assignments_target_size check (octet_length(target::text) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_link_len') then
    alter table public.messages add constraint messages_link_len check (link is null or char_length(link) <= 300);
  end if;
end $$;

-- 3) Batas percobaan kode kelas ------------------------------------------
-- 10 kode salah per jam per akun. Ruang kode 32^6 ≈ 1 miliar, jadi menebak acak praktis mustahil.
create table if not exists public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists idx_join_attempts on public.join_attempts (user_id, at);
alter table public.join_attempts enable row level security;   -- tanpa kebijakan: tidak bisa diakses lewat API
revoke all on public.join_attempts from anon, authenticated;

-- Kode salah tidak lagi melempar error (supaya catatan percobaan tidak ikut dibatalkan),
-- melainkan mengembalikan NULL; aplikasi menampilkan "Kode kelas tidak ditemukan".
create or replace function public.join_class(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; fails int;
begin
  if auth.uid() is null then raise exception 'Harus masuk dulu'; end if;
  select count(*) into fails from public.join_attempts where user_id = auth.uid() and at > now() - interval '1 hour';
  if fails >= 10 then raise exception 'Terlalu banyak kode salah. Tunggu sekitar satu jam, lalu coba lagi.'; end if;
  select id into cid from public.classes where join_code = upper(trim(coalesce(p_code, '')));
  if cid is null then
    insert into public.join_attempts (user_id) values (auth.uid());
    return null;
  end if;
  insert into public.class_members (class_id, user_id) values (cid, auth.uid()) on conflict do nothing;
  return cid;
end $$;
revoke execute on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;
