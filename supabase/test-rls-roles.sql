-- Account role tests. Run after test-stub.sql, schema.sql, courses.sql, roles.sql (empty test database).
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
  raise exception 'FAILED: should have been denied: %', why;
end $$;
do $$ begin if (select role from public.profiles where id = 'bbbbbbbb-0000-0000-0000-000000000003') <> 'student' then raise exception 'FAILED: default role must be student'; end if; end $$;

-- Students can't create courses, can't promote themselves, can't use admin functions
select pg_temp.as_user(:SI);
select pg_temp.expect_fail($q$insert into public.courses (title) values ('kursus siswa')$q$, 'student creates a course');
select pg_temp.expect_fail($q$update public.profiles set role = 'admin' where id = auth.uid()$q$, 'student raises own role');
select pg_temp.expect_fail($q$select * from public.admin_list_users()$q$, 'student sees the user list');
select pg_temp.expect_fail($q$select public.admin_set_role(auth.uid(), 'teacher')$q$, 'student makes themselves teacher');
reset role;

-- Admin sees all users & promotes a teacher
select pg_temp.as_user(:AD);
do $$ begin if (select count(*) from public.admin_list_users()) <> 3 then raise exception 'FAILED: admin must see 3 users'; end if; end $$;
do $$ begin if not exists (select 1 from public.admin_list_users() where email = 'guru@x.id') then raise exception 'FAILED: email not shown'; end if; end $$;
select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000002', 'teacher');
select pg_temp.expect_fail($q$select public.admin_set_role(auth.uid(), 'student')$q$, 'last admin demotes themselves');
select pg_temp.expect_fail($q$select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000003', 'raja')$q$, 'unknown role');
insert into public.courses (title) values ('Kursus admin');
reset role;

-- Teacher creates a course; after being demoted, can no longer edit it
select pg_temp.as_user(:GU);
insert into public.courses (title) values ('Kursus guru');
update public.courses set title = 'Kursus guru v2' where title = 'Kursus guru';
do $$ begin if not exists (select 1 from public.courses where title = 'Kursus guru v2') then raise exception 'FAILED: teacher edits own course'; end if; end $$;
reset role;
select pg_temp.as_user(:AD); select public.admin_set_role('bbbbbbbb-0000-0000-0000-000000000002', 'student'); reset role;
select pg_temp.as_user(:GU);
update public.courses set title = 'diubah setelah turun' where title = 'Kursus guru v2';
do $$ begin if exists (select 1 from public.courses where title = 'diubah setelah turun') then raise exception 'FAILED: former teacher can still edit a course'; end if; end $$;
reset role;
select 'ALL ROLE TESTS PASSED' as result;
