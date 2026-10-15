-- Access tests for the reports table. Run after test-stub.sql, schema.sql, courses.sql, roles.sql, reports.sql.
\set ON_ERROR_STOP on
\set A  '''bbbbbbbb-0000-0000-0000-000000000001'''
\set S  '''bbbbbbbb-0000-0000-0000-000000000002'''
\set X  '''bbbbbbbb-0000-0000-0000-000000000003'''
insert into auth.users (id, email, raw_user_meta_data) values (:A, 'a@x.id', '{}'), (:S, 's@x.id', '{}'), (:X, 'x@x.id', '{}');
update public.profiles set role = 'admin' where id = :A;
create or replace function pg_temp.as_user(u uuid) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', u::text, false); execute 'set role authenticated'; end $$;
create or replace function pg_temp.expect_fail(q text, why text) returns void language plpgsql as $$
begin
  begin execute q; exception when others then raise notice 'OK (ditolak): %', why; return; end;
  raise exception 'FAILED: should have been denied: %', why;
end $$;

-- A student reports; can't forge the reporter, status, or notification flag
select pg_temp.as_user(:S);
insert into public.reports (kind, body, context) values ('soal', 'Kunci soal nomor 3 salah', '{"qid":"b1"}');
select pg_temp.expect_fail($q$insert into public.reports (kind, body, user_id) values ('bug', 'atas nama orang', 'bbbbbbbb-0000-0000-0000-000000000003')$q$, 'reporting as someone else');
select pg_temp.expect_fail($q$insert into public.reports (kind, body, status) values ('bug', 'langsung selesai', 'selesai')$q$, 'setting status yourself');
select pg_temp.expect_fail($q$insert into public.reports (kind, body, notified_at) values ('bug', 'sudah dikirim', now())$q$, 'setting notified_at');
select pg_temp.expect_fail($q$insert into public.reports (kind, body) values ('aneh', 'jenis salah')$q$, 'unknown kind');
select pg_temp.expect_fail($q$insert into public.reports (kind, body) values ('bug', 'abc')$q$, 'body too short');
do $$ begin if (select count(*) from public.reports) <> 1 then raise exception 'FAILED: student must see their own report'; end if; end $$;
update public.reports set status = 'selesai';
reset role;
do $$ begin if exists (select 1 from public.reports where status <> 'baru') then raise exception 'FAILED: student changed the status'; end if; end $$;

-- Others can't see the student's report
select pg_temp.as_user(:X);
do $$ begin if (select count(*) from public.reports) <> 0 then raise exception 'FAILED: others see the report'; end if; end $$;
delete from public.reports;
reset role;
do $$ begin if (select count(*) from public.reports) <> 1 then raise exception 'FAILED: others deleted the report'; end if; end $$;

-- Anonymous visitors may report (id generated in the browser) but can't read
select set_config('request.jwt.claim.sub', '', false);
set role anon;
insert into public.reports (id, kind, body) values ('cccccccc-0000-0000-0000-000000000001', 'bug', 'Tombol tidak berfungsi di HP');
select pg_temp.expect_fail($q$select * from public.reports$q$, 'anon reads reports');
reset role;
do $$ begin if (select user_id from public.reports where id = 'cccccccc-0000-0000-0000-000000000001') is not null then raise exception 'FAILED: anonymous report must have no user_id'; end if; end $$;

-- Admin sees everything, changes status & notes, deletes
select pg_temp.as_user(:A);
do $$ begin if (select count(*) from public.reports) <> 2 then raise exception 'FAILED: admin must see everything'; end if; end $$;
update public.reports set status = 'diproses', admin_note = 'sedang dicek' where kind = 'soal';
select pg_temp.expect_fail($q$update public.reports set body = 'diubah admin'$q$, 'admin edits the report body');
delete from public.reports where kind = 'bug';
do $$ begin if (select count(*) from public.reports) <> 1 or (select status from public.reports) <> 'diproses' then raise exception 'FAILED: admin manages reports'; end if; end $$;
reset role;

-- Limit: 10 reports per hour per account
select pg_temp.as_user(:X);
do $$ begin for i in 1..10 loop insert into public.reports (kind, body) values ('saran', 'saran nomor ' || i); end loop; end $$;
select pg_temp.expect_fail($q$insert into public.reports (kind, body) values ('saran', 'saran kesebelas')$q$, 'more than 10 reports per hour');
reset role;
select 'ALL REPORT TESTS PASSED' as result;
