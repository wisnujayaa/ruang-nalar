-- Uji pengerasan (hardening.sql): hak kolom, batas ukuran, batas percobaan kode kelas.
\set ON_ERROR_STOP on
\set G  '''cccccccc-0000-0000-0000-000000000001'''
\set S  '''cccccccc-0000-0000-0000-000000000002'''
\set X  '''cccccccc-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:G, 'g@x.id', '{"display_name":"Guru"}'), (:S, 's@x.id', '{"display_name":"Siswa"}'), (:X, 'x@x.id', '{}');
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak): %', why; return; end;
  raise exception 'GAGAL: seharusnya ditolak: %', why;
end $$;

select pg_temp.as_user(:G);
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas A', 'pertidaksamaan');
reset role;
create temp table k as select id, join_code from public.classes; grant select on k to authenticated;
select pg_temp.as_user(:S); select public.join_class((select join_code from k)); reset role;

-- Kelas: pemilik hanya boleh mengubah nama, kursus, kode
select pg_temp.as_user(:G);
update public.classes set name = 'Kelas A2';
update public.classes set join_code = 'ABCDEF';
select pg_temp.expect_fail($q$update public.classes set id = gen_random_uuid()$q$, 'mengubah id kelas');
select pg_temp.expect_fail($q$update public.classes set created_at = now() - interval '9 years'$q$, 'mengubah waktu dibuat');
select pg_temp.expect_fail($q$update public.classes set join_code = 'ab<c>'$q$, 'kode kelas berformat aneh');
reset role;
update k set join_code = 'ABCDEF';

-- Forum: penulis tidak bisa memalsukan penulis / memindahkan kelas
select pg_temp.as_user(:S);
insert into public.forum_threads (class_id, title, body) values ((select id from k), 'Tanya', 'isi');
select pg_temp.expect_fail(format($q$update public.forum_threads set author_id = %L$q$, 'cccccccc-0000-0000-0000-000000000001'), 'siswa memalsukan penulis utas menjadi guru');
select pg_temp.expect_fail($q$insert into public.forum_threads (class_id, title, author_id) values ((select id from k), 'palsu', 'cccccccc-0000-0000-0000-000000000001')$q$, 'membuat utas atas nama guru');
select pg_temp.expect_fail($q$update public.forum_threads set created_at = now() - interval '1 year'$q$, 'mengubah waktu utas');
update public.forum_threads set title = 'Tanya (diedit)', solved = true;
insert into public.forum_posts (thread_id, body) values ((select id from public.forum_threads limit 1), 'balasan');
select pg_temp.expect_fail($q$update public.forum_posts set body = 'diubah'$q$, 'mengubah balasan');
select pg_temp.expect_fail($q$insert into public.forum_posts (thread_id, body, author_id) values ((select id from public.forum_threads limit 1), 'x', 'cccccccc-0000-0000-0000-000000000001')$q$, 'membalas atas nama guru');
-- Anggota kelas hanya lewat kode
select pg_temp.expect_fail($q$insert into public.class_members (class_id, user_id) values ((select id from k), 'cccccccc-0000-0000-0000-000000000003')$q$, 'memasukkan orang lain ke kelas');
-- Profil
select pg_temp.expect_fail($q$insert into public.profiles (id, display_name, role) values (gen_random_uuid(), 'x', 'admin')$q$, 'membuat profil admin palsu');
-- Progres: dibatasi 600 KB
select pg_temp.expect_fail($q$insert into public.progress (user_id, course_id, state) values ('cccccccc-0000-0000-0000-000000000002', 'pertidaksamaan', jsonb_build_object('x', repeat('a', 700000)))$q$, 'progres raksasa');
insert into public.progress (user_id, course_id, state) values (:S, 'pertidaksamaan', '{"v":1}');
reset role;

-- Tugas & pesan: pembuat/pengirim diisi server
select pg_temp.as_user(:G);
insert into public.assignments (class_id, title, target) values ((select id from k), 'Tugas', '{"kind":"review"}');
select pg_temp.expect_fail($q$insert into public.assignments (class_id, title, created_by) values ((select id from k), 'x', 'cccccccc-0000-0000-0000-000000000002')$q$, 'tugas atas nama orang lain');
select pg_temp.expect_fail($q$insert into public.assignments (class_id, title, target) values ((select id from k), 'x', jsonb_build_object('t', repeat('a', 3000)))$q$, 'target tugas raksasa');
insert into public.messages (to_user, body) values (:S, 'semangat');
select pg_temp.expect_fail($q$insert into public.messages (to_user, body, from_user) values ('cccccccc-0000-0000-0000-000000000002', 'x', 'cccccccc-0000-0000-0000-000000000003')$q$, 'pesan atas nama orang lain');
select pg_temp.expect_fail($q$insert into public.messages (to_user, body, read_at) values ('cccccccc-0000-0000-0000-000000000002', 'x', now())$q$, 'mengisi read_at sendiri');
reset role;
do $$ begin if (select from_user from public.messages limit 1) <> 'cccccccc-0000-0000-0000-000000000001' then raise exception 'GAGAL: pengirim pesan'; end if; end $$;

-- Batas percobaan kode kelas: 10 salah/jam, lalu ditolak (kode benar pun ditolak sampai jeda)
select pg_temp.as_user(:X);
do $$ begin for i in 1..10 loop if public.join_class('ZZZZZ' || i) is not null then raise exception 'GAGAL'; end if; end loop; end $$;
select pg_temp.expect_fail($q$select public.join_class('ABCDEF')$q$, 'percobaan ke-11 dalam satu jam');
reset role;
set role authenticated; select pg_temp.expect_fail($q$select * from public.join_attempts$q$, 'tabel percobaan tidak terbaca lewat API'); reset role;
-- Orang lain tetap bisa bergabung normal
select pg_temp.as_user(:G); reset role;
select 'SEMUA TES PENGERASAN LULUS' as hasil;
