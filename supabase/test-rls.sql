-- Uji kebijakan akses (RLS). Jalankan setelah test-stub.sql dan schema.sql di Postgres uji.
\set ON_ERROR_STOP on
\set G  '''11111111-1111-1111-1111-111111111111'''
\set S1 '''22222222-2222-2222-2222-222222222222'''
\set S2 '''33333333-3333-3333-3333-333333333333'''
\set X  '''44444444-4444-4444-4444-444444444444'''

insert into auth.users (id, email, raw_user_meta_data) values
 (:G, 'guru@x.id', '{"display_name":"Bu Guru"}'), (:S1, 'dika@x.id', '{"display_name":"Dika"}'),
 (:S2, 'sari@x.id', '{}'), (:X, 'luar@x.id', '{"display_name":"Orang Luar"}');
select display_name from public.profiles order by display_name;

create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak sesuai harapan): %', why; return; end;
  raise exception 'GAGAL: seharusnya ditolak: %', why;
end $$;

-- Guru membuat kelas
select pg_temp.as_user(:G);
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas X-3', 'pertidaksamaan');
select join_code ~ '^[A-Z2-9]{6}$' as kode_valid from public.classes;
reset role;
create temp table kode as select join_code, id from public.classes;
grant select on kode to authenticated;

-- Siswa bergabung
select pg_temp.as_user(:S1); select public.join_class((select join_code from kode)) is not null as s1_join; reset role;
select pg_temp.as_user(:S2); select public.join_class(lower((select join_code from kode))) is not null as s2_join_huruf_kecil; reset role;
select pg_temp.as_user(:X); select pg_temp.expect_fail($q$select public.join_class('ZZZZZZ')$q$, 'kode salah'); reset role;

-- Progres
select pg_temp.as_user(:S1); insert into public.progress (user_id, course_id, state) values (:S1, 'pertidaksamaan', '{"v":1}'); insert into public.progress (user_id, course_id, state) values (:S1, 'kimia', '{"v":1}'); reset role;
select pg_temp.as_user(:X); insert into public.progress (user_id, course_id, state) values (:X, 'pertidaksamaan', '{"v":1}');
select pg_temp.expect_fail($q$insert into public.progress (user_id, course_id) values ('22222222-2222-2222-2222-222222222222', 'lain')$q$, 'menulis progres orang lain');
do $$ begin if (select count(*) from public.progress) <> 1 then raise exception 'GAGAL: orang luar melihat progres lain'; end if; end $$;
do $$ begin if (select count(*) from public.classes) <> 0 then raise exception 'GAGAL: orang luar melihat kelas'; end if; end $$;
reset role;
select pg_temp.as_user(:G);
do $$ begin
  if (select count(*) from public.progress where course_id = 'pertidaksamaan') <> 1 then raise exception 'GAGAL: guru harus melihat tepat 1 progres siswa kursus ini'; end if;
  if (select count(*) from public.progress where course_id = 'kimia') <> 0 then raise exception 'GAGAL: guru melihat progres kursus lain'; end if;
  if (select count(*) from public.class_members) <> 2 then raise exception 'GAGAL: guru harus melihat 2 anggota'; end if;
end $$;
reset role;
select pg_temp.as_user(:S2);
do $$ begin
  if (select count(*) from public.progress) <> 0 then raise exception 'GAGAL: siswa melihat progres teman'; end if;
  if (select count(*) from public.profiles) <> 3 then raise exception 'GAGAL: siswa harus melihat nama 3 orang sekelas (termasuk guru)'; end if;
end $$;
reset role;
select pg_temp.as_user(:X);
do $$ begin if (select count(*) from public.profiles) <> 1 then raise exception 'GAGAL: orang luar melihat profil lain'; end if; end $$;
reset role;

-- Tugas
select pg_temp.as_user(:G); insert into public.assignments (class_id, title, target) values ((select id from kode), 'L3 Bagian 5', '{"kind":"practice","sec":5,"lvl":3}'); reset role;
select pg_temp.as_user(:S1);
select pg_temp.expect_fail($q$insert into public.assignments (class_id, title) values ((select id from kode), 'iseng')$q$, 'siswa membuat tugas');
do $$ begin if (select count(*) from public.assignments) <> 1 then raise exception 'GAGAL: siswa harus melihat tugas'; end if; end $$;
reset role;

-- Forum
select pg_temp.as_user(:S1); insert into public.forum_threads (class_id, title, body) values ((select id from kode), 'Kenapa tanda dibalik?', 'Bingung di Bagian 1'); reset role;
create temp table utas as select id from public.forum_threads; grant select on utas to authenticated;
select pg_temp.as_user(:S2); insert into public.forum_posts (thread_id, body) values ((select id from utas), 'Karena bercermin di titik 0!');
update public.forum_threads set title = 'dibajak';
do $$ begin if exists (select 1 from public.forum_threads where title = 'dibajak') then raise exception 'GAGAL: siswa mengubah utas orang lain'; end if; end $$;
reset role;
select pg_temp.as_user(:S1);
select pg_temp.expect_fail($q$update public.forum_threads set pinned = true$q$, 'penulis (siswa) menyematkan utasnya sendiri');
update public.forum_threads set solved = true where id = (select id from utas); reset role;
select pg_temp.as_user(:G); update public.forum_threads set pinned = true where id = (select id from utas); reset role;
select pg_temp.as_user(:X);
select pg_temp.expect_fail($q$insert into public.forum_threads (class_id, title) values ((select id from kode), 'spam')$q$, 'orang luar menulis di forum');
select pg_temp.expect_fail($q$insert into public.forum_posts (thread_id, body) values ((select id from utas), 'spam')$q$, 'orang luar membalas');
do $$ begin if (select count(*) from public.forum_posts) <> 0 then raise exception 'GAGAL: orang luar membaca balasan'; end if; end $$;
reset role;
select pg_temp.as_user(:S2);
do $$ begin if (select count(*) from public.forum_threads where pinned and solved) <> 1 then raise exception 'GAGAL: status utas'; end if; end $$;
delete from public.forum_threads where id = (select id from utas);
do $$ begin if (select count(*) from public.forum_threads) <> 1 then raise exception 'GAGAL: siswa menghapus utas orang lain'; end if; end $$;
reset role;

-- Pesan
select pg_temp.as_user(:G);
insert into public.messages (to_user, body) values (:S1, 'Mantap, lanjut L4!');
select pg_temp.expect_fail($q$insert into public.messages (to_user, body) values ('44444444-4444-4444-4444-444444444444', 'hai')$q$, 'guru mengirim pesan ke orang di luar kelasnya');
reset role;
select pg_temp.as_user(:S1);
update public.messages set read_at = now();
select pg_temp.expect_fail($q$update public.messages set body = 'diubah'$q$, 'penerima mengubah isi pesan');
do $$ begin if (select count(*) from public.messages where read_at is not null) <> 1 then raise exception 'GAGAL: tandai dibaca'; end if; end $$;
reset role;

-- Siswa keluar kelas, guru tidak lagi melihat progresnya
select pg_temp.as_user(:S1); delete from public.class_members where user_id = :S1; reset role;
select pg_temp.as_user(:G);
do $$ begin if (select count(*) from public.progress) <> 0 then raise exception 'GAGAL: guru masih melihat progres siswa yang keluar'; end if; end $$;
reset role;
select 'SEMUA TES RLS LULUS' as hasil;
