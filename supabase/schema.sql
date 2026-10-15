-- =====================================================================
-- Ruang Nalar — skema database Supabase
-- Jalankan seluruh file ini di Supabase: Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent) untuk tabel & kebijakan.
-- Semua tabel dilindungi Row Level Security (RLS): tiap pengguna hanya
-- melihat data yang memang boleh ia lihat.
-- =====================================================================

-- ---------- Profil pengguna ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Pengguna' check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);

-- Buat profil otomatis saat pengguna mendaftar
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  -- display_name dari formulir daftar; full_name/name dari Google; potong 40 karakter (batas kolom) agar daftar tidak pernah gagal
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
                                nullif(trim(new.raw_user_meta_data ->> 'name'), ''), nullif(split_part(new.email, '@', 1), ''), 'Pengguna'), 40))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Progres belajar (satu baris per pengguna per kursus) ----------
create table if not exists public.progress (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id text not null check (course_id ~ '^[a-z0-9_-]{1,40}$'),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- ---------- Kelas ----------
create or replace function public.gen_join_code() returns text language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), '')
  from generate_series(1, 6)
$$;

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  course_id text not null,
  join_code text not null unique default public.gen_join_code(),
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

-- Fungsi bantu (security definer supaya tidak terjadi rekursi RLS)
create or replace function public.is_class_owner(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.classes where id = cid and owner_id = auth.uid())
$$;
create or replace function public.is_class_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.class_members where class_id = cid and user_id = auth.uid())
$$;
create or replace function public.in_class(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_class_owner(cid) or public.is_class_member(cid)
$$;
-- Apakah pengguna saat ini guru dari siswa `uid` untuk kursus `course`?
create or replace function public.teaches(uid uuid, course text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c join public.class_members m on m.class_id = c.id
    where c.owner_id = auth.uid() and m.user_id = uid and c.course_id = course)
$$;
-- Apakah dua pengguna berada di kelas yang sama (untuk menampilkan nama)?
create or replace function public.shares_class(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classes c
    left join public.class_members m1 on m1.class_id = c.id and m1.user_id = auth.uid()
    left join public.class_members m2 on m2.class_id = c.id and m2.user_id = uid
    where (c.owner_id = auth.uid() or m1.user_id is not null)
      and (c.owner_id = uid or m2.user_id is not null))
$$;

-- Bergabung ke kelas dengan kode
create or replace function public.join_class(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'Harus masuk dulu'; end if;
  select id into cid from public.classes where join_code = upper(trim(p_code));
  if cid is null then raise exception 'Kode kelas tidak ditemukan'; end if;
  insert into public.class_members (class_id, user_id) values (cid, auth.uid()) on conflict do nothing;
  return cid;
end $$;

-- ---------- Tugas ----------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  target jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------- Forum diskusi ----------
create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  body text not null default '' check (char_length(body) <= 5000),
  pinned boolean not null default false,
  solved boolean not null default false,
  created_at timestamptz not null default now(),
  last_activity timestamptz not null default now()
);
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads (id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create or replace function public.touch_thread() returns trigger
language plpgsql security definer set search_path = public as $$
begin update public.forum_threads set last_activity = now() where id = new.thread_id; return new; end $$;
drop trigger if exists on_forum_post on public.forum_posts;
create trigger on_forum_post after insert on public.forum_posts for each row execute function public.touch_thread();

-- ---------- Pesan pribadi guru → siswa ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  to_user uuid not null references public.profiles (id) on delete cascade,
  from_user uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 600),
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Indeks
create index if not exists idx_members_user on public.class_members (user_id);
create index if not exists idx_assign_class on public.assignments (class_id);
create index if not exists idx_threads_class on public.forum_threads (class_id, last_activity desc);
create index if not exists idx_posts_thread on public.forum_posts (thread_id, created_at);
create index if not exists idx_messages_to on public.messages (to_user, created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.classes enable row level security;
alter table public.class_members enable row level security;
alter table public.assignments enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.messages enable row level security;

-- profiles: lihat diri sendiri & teman sekelas; ubah milik sendiri
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or public.shares_class(id));
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- progress: tulis milik sendiri; guru kelas boleh membaca progres siswanya untuk kursus kelas itu
drop policy if exists progress_select on public.progress;
create policy progress_select on public.progress for select to authenticated using (user_id = auth.uid() or public.teaches(user_id, course_id));
drop policy if exists progress_insert on public.progress;
create policy progress_insert on public.progress for insert to authenticated with check (user_id = auth.uid());
drop policy if exists progress_update on public.progress;
create policy progress_update on public.progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists progress_delete on public.progress;
create policy progress_delete on public.progress for delete to authenticated using (user_id = auth.uid());

-- classes: anggota & pemilik melihat; siapa pun yang masuk boleh membuat kelas (jadi gurunya)
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes for select to authenticated using (owner_id = auth.uid() or public.is_class_member(id));
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes for delete to authenticated using (owner_id = auth.uid());

-- class_members: bergabung lewat fungsi join_class; guru boleh mengeluarkan; siswa boleh keluar
drop policy if exists members_select on public.class_members;
create policy members_select on public.class_members for select to authenticated using (public.in_class(class_id));
drop policy if exists members_delete on public.class_members;
create policy members_delete on public.class_members for delete to authenticated using (user_id = auth.uid() or public.is_class_owner(class_id));

-- assignments: anggota membaca, guru menulis
drop policy if exists assign_select on public.assignments;
create policy assign_select on public.assignments for select to authenticated using (public.in_class(class_id));
drop policy if exists assign_write on public.assignments;
create policy assign_write on public.assignments for all to authenticated using (public.is_class_owner(class_id)) with check (public.is_class_owner(class_id));

-- forum: semua anggota kelas boleh membaca & menulis; ubah/hapus milik sendiri; guru memoderasi
drop policy if exists threads_select on public.forum_threads;
create policy threads_select on public.forum_threads for select to authenticated using (public.in_class(class_id));
drop policy if exists threads_insert on public.forum_threads;
create policy threads_insert on public.forum_threads for insert to authenticated with check (author_id = auth.uid() and public.in_class(class_id) and pinned = false);
drop policy if exists threads_update on public.forum_threads;
create policy threads_update on public.forum_threads for update to authenticated using (author_id = auth.uid() or public.is_class_owner(class_id)) with check (public.in_class(class_id));
drop policy if exists threads_delete on public.forum_threads;
create policy threads_delete on public.forum_threads for delete to authenticated using (author_id = auth.uid() or public.is_class_owner(class_id));

-- Hanya guru yang boleh menyematkan (pin) utas
create or replace function public.guard_pin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.pinned is distinct from old.pinned and not public.is_class_owner(new.class_id) then
    raise exception 'Hanya guru yang boleh menyematkan utas';
  end if;
  if new.class_id is distinct from old.class_id or new.author_id is distinct from old.author_id then
    raise exception 'Kelas dan penulis utas tidak boleh diubah';
  end if;
  return new;
end $$;
drop trigger if exists on_thread_update on public.forum_threads;
create trigger on_thread_update before update on public.forum_threads for each row execute function public.guard_pin();

drop policy if exists posts_select on public.forum_posts;
create policy posts_select on public.forum_posts for select to authenticated
  using (exists (select 1 from public.forum_threads t where t.id = thread_id and public.in_class(t.class_id)));
drop policy if exists posts_insert on public.forum_posts;
create policy posts_insert on public.forum_posts for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.forum_threads t where t.id = thread_id and public.in_class(t.class_id)));
drop policy if exists posts_delete on public.forum_posts;
create policy posts_delete on public.forum_posts for delete to authenticated
  using (author_id = auth.uid() or exists (select 1 from public.forum_threads t where t.id = thread_id and public.is_class_owner(t.class_id)));

-- messages: penerima & pengirim membaca; hanya guru kelas yang sama boleh mengirim; penerima menandai dibaca
drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select to authenticated using (to_user = auth.uid() or from_user = auth.uid());
drop policy if exists msg_insert on public.messages;
create policy msg_insert on public.messages for insert to authenticated
  with check (from_user = auth.uid() and exists (
    select 1 from public.classes c join public.class_members m on m.class_id = c.id
    where c.owner_id = auth.uid() and m.user_id = to_user));
drop policy if exists msg_update on public.messages;
create policy msg_update on public.messages for update to authenticated using (to_user = auth.uid()) with check (to_user = auth.uid());

-- Hak akses dasar untuk peran Supabase
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.join_class(text) to authenticated;
-- Batasi kolom yang boleh diubah
revoke update on public.messages from authenticated;
grant update (read_at) on public.messages to authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
revoke all on all tables in schema public from anon;

-- Pengerasan: fungsi hanya bisa dipanggil pengguna yang sudah masuk
alter function public.gen_join_code() set search_path = public;
revoke execute on all functions in schema public from public, anon;
grant execute on function public.gen_join_code(), public.is_class_owner(uuid), public.is_class_member(uuid), public.in_class(uuid),
  public.teaches(uuid, text), public.shares_class(uuid), public.join_class(text) to authenticated;
-- Fungsi trigger tidak perlu dipanggil langsung lewat API
revoke execute on function public.guard_pin(), public.handle_new_user(), public.touch_thread() from authenticated, anon, public;
-- Hak yang tidak dibutuhkan API (TRUNCATE tidak tunduk pada RLS)
revoke truncate, references, trigger on all tables in schema public from authenticated, anon;
