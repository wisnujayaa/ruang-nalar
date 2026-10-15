-- Access tests for the courses table. Run after test-stub.sql, schema.sql, courses.sql (empty test database).
\set ON_ERROR_STOP on
\set G  '''aaaaaaaa-0000-0000-0000-000000000001'''
\set S  '''aaaaaaaa-0000-0000-0000-000000000002'''
\set X  '''aaaaaaaa-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:G, 'g@x.id', '{"display_name":"Guru"}'), (:S, 's@x.id', '{}'), (:X, 'x@x.id', '{}');
update public.profiles set role = 'teacher' where id = :G;  -- needs roles.sql
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak): %', why; return; end;
  raise exception 'FAILED: should have been denied: %', why;
end $$;

-- Teacher creates 3 courses: draft, unlisted, public
select pg_temp.as_user(:G);
insert into public.courses (title, visibility) values ('Draf rahasia', 'draft'), ('Lewat tautan', 'unlisted'), ('Publik', 'public');
do $$ begin if (select count(*) from public.courses where id ~ '^c-[a-z0-9]{10}$') <> 3 then raise exception 'FAILED: automatic id'; end if; end $$;
select pg_temp.expect_fail($q$insert into public.courses (owner_id, title) values ('aaaaaaaa-0000-0000-0000-000000000002', 'palsu')$q$, 'creating a course as someone else');
select pg_temp.expect_fail($q$update public.courses set owner_id = 'aaaaaaaa-0000-0000-0000-000000000003'$q$, 'transferring ownership');
reset role;
create temp table ids as select id, title from public.courses; grant select on ids to authenticated, anon;

-- Others: can't see drafts, can't edit/delete
select pg_temp.as_user(:X);
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'FAILED: others must see 2 (no drafts)'; end if; end $$;
update public.courses set title = 'dibajak';
delete from public.courses;
reset role;
do $$ begin if exists (select 1 from public.courses where title = 'dibajak') or (select count(*) from public.courses) <> 3 then raise exception 'FAILED: others edited/deleted the course'; end if; end $$;

-- Anonymous visitor
set role anon;
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'FAILED: anon must see 2'; end if; end $$;
select pg_temp.expect_fail($q$insert into public.courses (title) values ('spam')$q$, 'anon creates a course');
reset role;

-- Draft: owner only, even class members can't read it yet
-- Class-only: only members of the course author's classes
select pg_temp.as_user(:G);
insert into public.courses (title, visibility) values ('Khusus kelas', 'class');
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas draf', (select id from public.courses where title = 'Draf rahasia'));
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas kunci', (select id from public.courses where title = 'Khusus kelas'));
reset role;
drop table ids; create temp table ids as select id, title from public.courses; grant select on ids to authenticated, anon;
create temp table kode as select name, join_code from public.classes; grant select on kode to authenticated;
select pg_temp.as_user(:S);
do $$ begin if (select count(*) from public.courses) <> 2 then raise exception 'FAILED: before joining, the student sees only 2'; end if; end $$;
select public.join_class((select join_code from kode where name = 'Kelas draf'));
do $$ begin if exists (select 1 from public.courses where title = 'Draf rahasia') then raise exception 'FAILED: draft course must not be readable by class members'; end if; end $$;
do $$ begin if exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'FAILED: class-only course readable from another class'; end if; end $$;
select public.join_class((select join_code from kode where name = 'Kelas kunci'));
do $$ begin if not exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'FAILED: class members must be able to read their class-only course'; end if; end $$;
-- Student leaves the class: locked again
delete from public.class_members where user_id = auth.uid() and class_id = (select c.id from public.classes c where c.name = 'Kelas kunci');
do $$ begin if exists (select 1 from public.courses where title = 'Khusus kelas') then raise exception 'FAILED: after leaving the class, access must be gone'; end if; end $$;
reset role;
set role anon;
do $$ begin if exists (select 1 from public.courses where visibility in ('draft', 'class')) then raise exception 'FAILED: anon read a locked course'; end if; end $$;
reset role;

-- Others can't "unlock" by creating their own class that uses a locked course
update public.profiles set role = 'teacher' where id = :X;
select pg_temp.as_user(:X);
select pg_temp.expect_fail(format($q$insert into public.classes (owner_id, name, course_id) values (%L, 'Kelas curian', %L)$q$, auth.uid(), (select id from ids where title = 'Khusus kelas')), 'memakai kursus khusus kelas milik guru lain');
select pg_temp.expect_fail(format($q$insert into public.classes (owner_id, name, course_id) values (%L, 'Kelas curian', %L)$q$, auth.uid(), (select id from ids where title = 'Draf rahasia')), 'memakai kursus draf milik guru lain');
insert into public.classes (owner_id, name, course_id) values (auth.uid(), 'Kelas tautan', (select id from ids where title = 'Lewat tautan'));
insert into public.classes (owner_id, name, course_id) values (auth.uid(), 'Kelas berkas', 'pertidaksamaan');
select pg_temp.expect_fail(format($q$update public.classes set course_id = %L where name = 'Kelas tautan'$q$, (select id from ids where title = 'Khusus kelas')), 'mengganti kursus kelas ke kursus terkunci milik guru lain');
reset role;
-- If the owner locks a course already used by another teacher's class, that class loses access
select pg_temp.as_user(:G);
update public.courses set visibility = 'class' where title = 'Lewat tautan';
reset role;
insert into kode select name, join_code from public.classes where name = 'Kelas tautan';
select pg_temp.as_user(:S);
select public.join_class((select join_code from kode where name = 'Kelas tautan'));
do $$ begin if exists (select 1 from public.courses where title = 'Lewat tautan') then raise exception 'FAILED: a class of another teacher must not unlock'; end if; end $$;
reset role;
select pg_temp.as_user(:G);
update public.courses set visibility = 'unlisted' where title = 'Lewat tautan';
reset role;

-- Owner edits & deletes
select pg_temp.as_user(:G);
update public.courses set title = 'Draf v2', updated_at = now() where title = 'Draf rahasia';
delete from public.courses where title = 'Publik';
do $$ begin if (select count(*) from public.courses) <> 3 then raise exception 'FAILED: owner delete'; end if; end $$;
reset role;
select 'ALL COURSE RLS TESTS PASSED' as result;
