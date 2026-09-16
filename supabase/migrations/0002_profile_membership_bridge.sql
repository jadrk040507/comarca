-- Transitional bridge: Better Auth identities are linked by email until Supabase Auth is cut over.
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists auth_user_id uuid references auth.users(id) on delete set null;
create unique index if not exists profiles_email_unique on public.profiles(lower(email)) where email is not null;
create unique index if not exists profiles_auth_user_unique on public.profiles(auth_user_id) where auth_user_id is not null;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for select using (auth_user_id = (select auth.uid()));

create or replace function public.is_member(target_workspace uuid, allowed_roles public.member_role[] default null)
returns boolean language sql stable security invoker set search_path = public as $$
  select exists (
    select 1 from public.workspace_memberships m
    join public.profiles p on p.id = m.user_id
    where m.workspace_id = target_workspace and p.auth_user_id = (select auth.uid()) and m.active
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;
