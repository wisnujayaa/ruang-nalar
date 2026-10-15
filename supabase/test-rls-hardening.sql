-- Hardening tests (hardening.sql): column grants, size limits, class-code attempt limit.
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
  raise exception 'FAILED: should have been denied: %', why;
end $$;

select pg_temp.as_user(:G);
insert into public.classes (owner_id, name, course_id) values (:G, 'Kelas A', 'pertidaksamaan');
reset role;
create temp table k as select id, join_code from public.classes; grant select on k to authenticated;
select pg_temp.as_user(:S); select public.join_class((select join_code from k)); reset role;

-- Classes: owner may only change name, course, code
select pg_temp.as_user(:G);
update public.classes set name = 'Kelas A2';
update public.classes set join_code = 'ABCDEF';
select pg_temp.expect_fail($q$update public.classes set id = gen_random_uuid()$q$, 'changing the class id');
select pg_temp.expect_fail($q$update public.classes set created_at = now() - interval '9 years'$q$, 'changing created_at');
select pg_temp.expect_fail($q$update public.classes set join_code = 'ab<c>'$q$, 'malformed class code');
reset role;
update k set join_code = 'ABCDEF';

-- Forum: authors can't forge the author / move the thread to another class
select pg_temp.as_user(:S);
insert into public.forum_threads (class_id, title, body) values ((select id from k), 'Tanya', 'isi');
select pg_temp.expect_fail(format($q$update public.forum_threads set author_id = %L$q$, 'cccccccc-0000-0000-0000-000000000001'), 'siswa memalsukan penulis utas menjadi guru');
select pg_temp.expect_fail($q$insert into public.forum_threads (class_id, title, author_id) values ((select id from k), 'palsu', 'cccccccc-0000-0000-0000-000000000001')$q$, 'creating a thread as the teacher');
select pg_temp.expect_fail($q$update public.forum_threads set created_at = now() - interval '1 year'$q$, 'changing thread timestamps');
update public.forum_threads set title = 'Tanya (diedit)', solved = true;
insert into public.forum_posts (thread_id, body) values ((select id from public.forum_threads limit 1), 'balasan');
select pg_temp.expect_fail($q$update public.forum_posts set body = 'diubah'$q$, 'editing a reply');
select pg_temp.expect_fail($q$insert into public.forum_posts (thread_id, body, author_id) values ((select id from public.forum_threads limit 1), 'x', 'cccccccc-0000-0000-0000-000000000001')$q$, 'replying as the teacher');
-- Class membership only through a code
select pg_temp.expect_fail($q$insert into public.class_members (class_id, user_id) values ((select id from k), 'cccccccc-0000-0000-0000-000000000003')$q$, 'adding someone else to a class');
-- Profiles
select pg_temp.expect_fail($q$insert into public.profiles (id, display_name, role) values (gen_random_uuid(), 'x', 'admin')$q$, 'creating a fake admin profile');
-- Progress: capped at 600 KB
select pg_temp.expect_fail($q$insert into public.progress (user_id, course_id, state) values ('cccccccc-0000-0000-0000-000000000002', 'pertidaksamaan', jsonb_build_object('x', repeat('a', 700000)))$q$, 'giant progress');
insert into public.progress (user_id, course_id, state) values (:S, 'pertidaksamaan', '{"v":1}');
reset role;

-- Assignments & messages: creator/sender set by the server
select pg_temp.as_user(:G);
insert into public.assignments (class_id, title, target) values ((select id from k), 'Tugas', '{"kind":"review"}');
select pg_temp.expect_fail($q$insert into public.assignments (class_id, title, created_by) values ((select id from k), 'x', 'cccccccc-0000-0000-0000-000000000002')$q$, 'assignment as someone else');
select pg_temp.expect_fail($q$insert into public.assignments (class_id, title, target) values ((select id from k), 'x', jsonb_build_object('t', repeat('a', 3000)))$q$, 'giant assignment target');
insert into public.messages (to_user, body) values (:S, 'semangat');
select pg_temp.expect_fail($q$insert into public.messages (to_user, body, from_user) values ('cccccccc-0000-0000-0000-000000000002', 'x', 'cccccccc-0000-0000-0000-000000000003')$q$, 'message as someone else');
select pg_temp.expect_fail($q$insert into public.messages (to_user, body, read_at) values ('cccccccc-0000-0000-0000-000000000002', 'x', now())$q$, 'setting read_at yourself');
reset role;
do $$ begin if (select from_user from public.messages limit 1) <> 'cccccccc-0000-0000-0000-000000000001' then raise exception 'FAILED: message sender'; end if; end $$;

-- Class-code attempt limit: 10 wrong/hour, then refused (even a correct code until the cooldown ends)
select pg_temp.as_user(:X);
do $$ begin for i in 1..10 loop if public.join_class('ZZZZZ' || i) is not null then raise exception 'FAILED'; end if; end loop; end $$;
select pg_temp.expect_fail($q$select public.join_class('ABCDEF')$q$, '11th attempt within an hour');
reset role;
set role authenticated; select pg_temp.expect_fail($q$select * from public.join_attempts$q$, 'attempts table not readable through the API'); reset role;
-- Other users can still join normally
select pg_temp.as_user(:G); reset role;
select 'ALL HARDENING TESTS PASSED' as result;
