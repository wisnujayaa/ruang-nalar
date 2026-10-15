-- Uji peran akun. Jalankan setelah test-stub.sql, schema.sql, courses.sql, roles.sql (database uji kosong).
\set ON_ERROR_STOP on
\set AD '''bbbbbbbb-0000-0000-0000-000000000001'''
\set GU '''bbbbbbbb-0000-0000-0000-000000000002'''
\set SI '''bbbbbbbb-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:AD, 'admin@x.id', '{}'), (:GU, 'guru@x.id', '{}'), (:SI, 'siswa@x.id', '{}');
update public.profiles set role = 'admin' where id = :AD;
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak): %', why; return; end;
  raise exception 'GAGAL: seharusnya ditolak: %', why;
end $$;
do $$ begin if (select role from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000003') <> 'student' then raise exception 'GAGAL: peran bawaan harus siswa'; end if; end $$;

-- Siswa tidak bisa membuat kursus, tidak bisa menaikkan perannya sendiri, tidak bisa memakai fungsi admin
select pg_temp.as_user(:SI);
select pg_temp.expect_fail($q$insert into public.courses (title) values ('kursus siswa')$q$, 'siswa membuat kursus');
select pg_temp.expect_fail($q$update public.profiles set role = 'admin' where id = auth.uid()$q$, 'siswa menaikkan peran sendiri');
select pg_temp.expect_fail($q$select * from public.admin_list_users()$q$, 'siswa melihat daftar pengguna');
select pg_temp.expect_fail($q$select public.admin_set_role(auth.uid(), 'teacher')$q$, 'siswa mengangkat dirinya guru');
reset role;

-- Admin melihat semua pengguna & mengangkat guru
select pg_temp.as_user(:AD);
do $$ begin if (select count(*) from public.admin_list_users()) <> 3 then raise exception 'GAGAL: admin harus melihat 3 pengguna'; end if; end $$;
do $$ begin if not exists (select 1 from public.admin_list_users() where email = 'guru@x.id') then raise exception 'GAGAL: email tidak tampil'; end if; end $$;
select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000002', 'teacher');
select pg_temp.expect_fail($q$select public.admin_set_role(auth.uid(), 'student')$q$, 'admin terakhir menurunkan dirinya');
select pg_temp.expect_fail($q$select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000003', 'raja')$q$, 'peran tidak dikenal');
insert into public.courses (title) values ('Kursus admin');
reset role;

-- Guru membuat kursus; setelah diturunkan, tidak bisa mengubahnya lagi
select pg_temp.as_user(:GU);
insert into public.courses (title) values ('Kursus guru');
update public.courses set title = 'Kursus guru v2' where title = 'Kursus guru';
do $$ begin if not exists (select 1 from public.courses where title = 'Kursus guru v2') then raise exception 'GAGAL: guru mengubah kursusnya'; end if; end $$;
reset role;
select pg_temp.as_user(:AD); select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000002', 'student'); reset role;
select pg_temp.as_user(:GU);
update public.courses set title = 'diubah setelah turun' where title = 'Kursus guru v2';
do $$ begin if exists (select 1 from public.courses where title = 'diubah setelah turun') then raise exception 'GAGAL: mantan guru masih bisa mengubah kursus'; end if; end $$;
reset role;
select 'SEMUA TES PERAN LULUS' as hasil;
