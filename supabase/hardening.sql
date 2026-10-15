-- =====================================================================
-- Ruang Nalar — security hardening (from an audit). Run AFTER all other SQL files. Safe to re-run.
--  1. Least-privilege column grants: each table may only be written in the columns the app actually uses.
--     (Prevents, e.g., a thread author changing author_id to make a thread look like the teacher wrote it.)
--  2. Size limits on user-written data (progress, assignment targets, message links).
--  3. Rate limit on class-code attempts (anti code guessing).
-- =====================================================================

-- 1) Column grants ------------------------------------------------------
-- Classes: created with name, course, owner; only name, course, and code may change.
revoke insert, update on public.classes from authenticated;
grant insert (name, course_id, owner_id) on public.classes to authenticated;
grant update (name, course_id, join_code) on public.classes to authenticated;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'classes_join_code_format') then
    alter table public.classes add constraint classes_join_code_format check (join_code ~ '^[A-Z0-9]{6,12}$');
  end if;
end $$;

-- Forum: author & timestamps are set by the server; only title, body, pinned, solved may change.
revoke insert, update on public.forum_threads from authenticated;
grant insert (class_id, title, body) on public.forum_threads to authenticated;
grant update (title, body, pinned, solved) on public.forum_threads to authenticated;
revoke insert, update on public.forum_posts from authenticated;
grant insert (thread_id, body) on public.forum_posts to authenticated;

-- Members are only added through join_class (code). Leaving/removal still goes through DELETE + policy.
revoke insert, update on public.class_members from authenticated;

-- Assignments: creator & timestamps are set by the server.
revoke insert, update on public.assignments from authenticated;
grant insert (class_id, title, description, target, due_at) on public.assignments to authenticated;

-- Messages: sender & timestamps are set by the server; recipients can only mark as read.
revoke insert on public.messages from authenticated;
grant insert (to_user, body, link) on public.messages to authenticated;

-- Profiles are created by the sign-up trigger; never created/deleted directly through the API.
revoke insert, delete on public.profiles from authenticated;

-- 2) Size limits --------------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'progress_state_size') then
    alter table public.progress add constraint progress_state_size check (octet_length(state::text) <= 600000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assignments_target_size') then
    alter table public.assignments add constraint assignments_target_size check (octet_length(target::text) <= 2000);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'messages_link_len') then
    alter table public.messages add constraint messages_link_len check (link is null or char_length(link) <= 300);
  end if;
end $$;

-- 3) Class-code attempt limit ------------------------------------------
-- 10 wrong codes per hour per account. The code space is 32^6 ≈ 1 billion, so random guessing is impractical.
create table if not exists public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists idx_join_attempts on public.join_attempts (user_id, at);
alter table public.join_attempts enable row level security;   -- no policies: not reachable through the API
revoke all on public.join_attempts from anon, authenticated;

-- A wrong code no longer raises an error (which would roll back the attempt record);
-- it returns NULL and the app shows "class code not found".
create or replace function public.join_class(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare cid uuid; fails int;
begin
  if auth.uid() is null then raise exception 'Harus masuk dulu'; end if;
  select count(*) into fails from public.join_attempts where user_id = auth.uid() and at > now() - interval '1 hour';
  if fails >= 10 then raise exception 'Terlalu banyak kode salah. Tunggu sekitar satu jam, lalu coba lagi.'; end if;
  select id into cid from public.classes where join_code = upper(trim(coalesce(p_code, '')));
  if cid is null then
    insert into public.join_attempts (user_id) values (auth.uid());
    return null;
  end if;
  insert into public.class_members (class_id, user_id) values (cid, auth.uid()) on conflict do nothing;
  return cid;
end $$;
revoke execute on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;
