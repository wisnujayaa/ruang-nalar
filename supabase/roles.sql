-- =====================================================================
-- Ruang Nalar — account roles: student / teacher / admin
-- Run AFTER schema.sql and courses.sql. Safe to re-run.
--   student : learn, join classes, discuss
--   teacher : + create courses in the Studio
--   admin   : + promote/demote teachers & admins
-- The first admin is set manually (see docs/SUPABASE.md):
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'YOUR_EMAIL');
-- =====================================================================
alter table public.profiles add column if not exists role text not null default 'student';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));
  end if;
end $$;

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('teacher', 'admin'))
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Only teachers/admins may create & edit courses
alter policy courses_insert on public.courses with check (owner_id = auth.uid() and public.is_teacher());
alter policy courses_update on public.courses using (owner_id = auth.uid() and public.is_teacher()) with check (owner_id = auth.uid());

-- User list for the admin page (including emails from auth.users)
create or replace function public.admin_list_users()
returns table (id uuid, display_name text, email text, role text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  return query select p.id, p.display_name, u.email::text, p.role, p.created_at
    from public.profiles p join auth.users u on u.id = p.id order by p.created_at desc;
end $$;

-- Change a role (the last admin cannot be removed)
create or replace function public.admin_set_role(p_user uuid, p_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_role not in ('student', 'teacher', 'admin') then raise exception 'Peran tidak dikenal'; end if;
  if p_role <> 'admin' and (select role from public.profiles where id = p_user) = 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Minimal harus ada satu admin';
  end if;
  update public.profiles set role = p_role where id = p_user;
end $$;

revoke execute on function public.is_teacher(), public.is_admin(), public.admin_list_users(), public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.is_teacher(), public.is_admin(), public.admin_list_users(), public.admin_set_role(uuid, text) to authenticated;
