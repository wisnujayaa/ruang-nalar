-- Uji akses tabel courses. Jalankan setelah test-stub.sql, schema.sql, courses.sql (database uji kosong).
\set ON_ERROR_STOP on
\set G  '''aaaaaaaa-0000-0000-0000-000000000001'''
\set S  '''aaaaaaaa-0000-0000-0000-000000000002'''
\set X  '''aaaaaaaa-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:G, 'g@x.id', '{"display_name":"Guru"}'), (:S, 's@x.id', '{}'), (:X, 'x@x.id', '{}');
update public.profiles set role = 'teacher' where id = :G;  -- butuh roles.sql
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

-- Draf: hanya pemilik, bahkan anggota kelas pun belum bisa membaca
-- Khusus kelas: hanya anggota kelas milik pembuat kursus
select pg_temp.as_user(:G);
insert into public.courses (title, visibility) values ('Khusus kelas', 'class');
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas draf', (select id from public.courses where title = 'Draf rahasia'));
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas kunci', (select id from public.courses where title = 'Khusus kelas'));
reset role;
drop table ids; create temp table ids as select id, title from public.courses; grant select on ids to authenticated, anon;
create temp table kode as select name, join_code from public.classes; grant select on kode to authenticated;
select pg_temp.as_user(:S);
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'GAGAL: sebelum gabung, siswa hanya melihat 2'; end if; end $$;
select public.join_class((select join_code from kode where name = 'Kelas draf'));
do $$ begin if exists (select 1 from public.courses where title = 'Draf rahasia') then raise exception 'GAGAL: kursus draf tidak boleh terbaca anggota kelas'; end if; end $$;
do $$ begin if exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'GAGAL: kursus khusus kelas terbaca dari kelas lain'; end if; end $$;
select public.join_class((select join_code from kode where name = 'Kelas kunci'));
do $$ begin if not exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'GAGAL: anggota kelas harus bisa membaca kursus khusus kelasnya'; end if; end $$;
-- Siswa keluar dari kelas: kunci tertutup lagi
delete from public.class_members where user_id = auth.uid() and class_id = (select c.id from public.classes c where c.name = 'Kelas kunci');
do $$ begin if exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'GAGAL: setelah keluar kelas, akses harus hilang'; end if; end $$;
reset role;
set role anon;
do $$ begin if exists (select 1 from public.courses where visibility in ('draft', 'class')) then raise exception 'GAGAL: anon membaca kursus terkunci'; end if; end $$;
reset role;

-- Orang lain tidak bisa "membuka kunci" dengan membuat kelas sendiri yang memakai kursus terkunci
update public.profiles set role = 'teacher' where id = :X;
select pg_temp.as_user(:X);
select pg_temp.expect_fail(format($q$insert into public.classes (owner_id, name, course_id) values (%L, 'Kelas curian', %L)$q$, auth.uid(), (select id from ids where title = 'Khusus kelas')), 'memakai kursus khusus kelas milik guru lain');
select pg_temp.expect_fail(format($q$insert into public.classes (owner_id, name, course_id) values (%L, 'Kelas curian', %L)$q$, auth.uid(), (select id from ids where title = 'Draf rahasia')), 'memakai kursus draf milik guru lain');
insert into public.classes (owner_id, name, course_id) values (auth.uid(), 'Kelas tautan', (select id from ids where title = 'Lewat tautan'));
insert into public.classes (owner_id, name, course_id) values (auth.uid(), 'Kelas berkas', 'pertidaksamaan');
select pg_temp.expect_fail(format($q$update public.classes set course_id = %L where name = 'Kelas tautan'$q$, (select id from ids where title = 'Khusus kelas')), 'mengganti kursus kelas ke kursus terkunci milik guru lain');
reset role;
-- Jika pemilik mengunci kursus yang sudah dipakai kelas guru lain, anggota kelas itu kehilangan akses
select pg_temp.as_user(:G);
update public.courses set visibility = 'class' where title = 'Lewat tautan';
reset role;
insert into kode select name, join_code from public.classes where name = 'Kelas tautan';
select pg_temp.as_user(:S);
select public.join_class((select join_code from kode where name = 'Kelas tautan'));
do $$ begin if exists (select 1 from public.courses where title = 'Lewat tautan') then raise exception 'GAGAL: kelas guru lain tidak boleh membuka kunci'; end if; end $$;
reset role;
select pg_temp.as_user(:G);
update public.courses set visibility = 'unlisted' where title = 'Lewat tautan';
reset role;

-- Pemilik mengubah & menghapus
select pg_temp.as_user(:G);
update public.courses set title = 'Draf v2', updated_at = now() where title = 'Draf rahasia';
delete from public.courses where title = 'Publik';
do $$ begin if (select count(*) from public.courses) <> 3 then raise exception 'GAGAL: pemilik hapus'; end if; end $$;
reset role;
select 'SEMUA TES RLS KURSUS LULUS' as hasil;
