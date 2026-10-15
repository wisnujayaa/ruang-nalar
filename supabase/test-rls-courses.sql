-- Uji akses tabel courses. Jalankan setelah test-stub.sql, schema.sql, courses.sql (database uji kosong).
\set ON_ERROR_STOP on
\set G  '''aaaaaaaa-0000-0000-0000-000000000001'''
\set S  '''aaaaaaaa-0000-0000-0000-000000000002'''
\set X  '''aaaaaaaa-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:G, 'g@x.id', '{"display_name":"Guru"}'), (:S, 's@x.id', '{}'), (:X, 'x@x.id', '{}');
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak): %', why; return; end;
  raise exception 'GAGAL: seharusnya ditolak: %', why;
end $$;

-- Guru membuat 3 kursus: draf, bertautan, publik
select pg_temp.as_user(:G);
insert into public.courses (title, visibility) values ('Draf rahasia', 'draft'), ('Lewat tautan', 'unlisted'), ('Publik', 'public');
do $$ begin if (select count(*) from public.courses where id ~ '^c-[a-z0-9]{10}$') <> 3 then raise exception 'GAGAL: id otomatis'; end if; end $$;
select pg_temp.expect_fail($q$insert into public.courses (owner_id, title) values ('aaaaaaaa-0000-0000-0000-000000000002', 'palsu')$q$, 'membuat kursus atas nama orang lain');
select pg_temp.expect_fail($q$update public.courses set owner_id = 'aaaaaaaa-0000-0000-0000-000000000003'$q$, 'memindahkan kepemilikan');
reset role;
create temp table ids as select id, title from public.courses; grant select on ids to authenticated, anon;

-- Orang lain: tidak melihat draf, tidak bisa mengubah/menghapus
select pg_temp.as_user(:X);
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'GAGAL: orang lain harus melihat 2 (tanpa draf)'; end if; end $$;
update public.courses set title = 'dibajak';
delete from public.courses;
reset role;
do $$ begin if exists (select 1 from public.courses where title = 'dibajak') or (select count(*) from public.courses) <> 3 then raise exception 'GAGAL: orang lain mengubah/menghapus kursus'; end if; end $$;

-- Pengunjung anonim
set role anon;
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'GAGAL: anon harus melihat 2'; end if; end $$;
select pg_temp.expect_fail($q$insert into public.courses (title) values ('spam')$q$, 'anon membuat kursus');
reset role;

-- Siswa di kelas yang memakai kursus draf boleh membacanya
select pg_temp.as_user(:G);
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas draf', (select id from ids where title = 'Draf rahasia'));
reset role;
create temp table kode as select join_code from public.classes; grant select on kode to authenticated;
select pg_temp.as_user(:S);
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'GAGAL: sebelum gabung, siswa tidak melihat draf'; end if; end $$;
select public.join_class((select join_code from kode));
do $$ begin if (select count(*) from public.courses) <> 3 then raise exception 'GAGAL: anggota kelas harus bisa membaca kursus draf kelasnya'; end if; end $$;
reset role;

-- Pemilik mengubah & menghapus
select pg_temp.as_user(:G);
update public.courses set title = 'Draf v2', updated_at = now() where title = 'Draf rahasia';
delete from public.courses where title = 'Publik';
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'GAGAL: pemilik hapus'; end if; end $$;
reset role;
select 'SEMUA TES RLS KURSUS LULUS' as hasil;
