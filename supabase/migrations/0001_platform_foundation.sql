-- La Comarca platform foundation.
-- Supabase is not live until this migration, RLS review and the import dry-run pass.
create extension if not exists pgcrypto;

create type public.member_role as enum ('admin','coordinator','editor','catechist','reader');
create type public.record_status as enum ('draft','published','cancelled','archived');
create type public.registration_status as enum ('requested','confirmed','waitlisted','cancelled');
create type public.attendance_status as enum ('unrecorded','present','absent','late','excused');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workspace_memberships (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.member_role not null default 'reader',
  scope jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id),
  title text not null,
  summary text not null default '',
  category text not null default 'general',
  status public.record_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer check (capacity is null or capacity >= 0),
  owner_id uuid references public.profiles(id),
  notion_id text unique,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id),
  title text not null,
  summary text not null default '',
  category text not null default 'general',
  status public.record_status not null default 'draft',
  public_url text,
  notion_id text unique,
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id),
  name text not null,
  email text,
  phone text,
  status public.registration_status not null default 'requested',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  active boolean not null default true
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  display_name text not null,
  tutor_name text,
  tutor_email text,
  tutor_phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id),
  activity_id uuid references public.activities(id),
  starts_at timestamptz not null,
  ends_at timestamptz,
  status public.record_status not null default 'draft',
  topic text not null default ''
);

create table public.attendance (
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  status public.attendance_status not null default 'unrecorded',
  note text not null default '',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  primary key (session_id,student_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'open',
  assignee_id uuid references public.profiles(id),
  due_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  workspace_id uuid references public.workspaces(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activities_starts_at_idx on public.activities(starts_at);
create index registrations_activity_idx on public.registrations(activity_id,status);
create index audit_events_created_at_idx on public.audit_events(created_at desc);

create or replace function public.is_member(target_workspace uuid, allowed_roles public.member_role[] default null)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workspace_memberships m
    where m.workspace_id = target_workspace and m.user_id = auth.uid() and m.active
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.activities enable row level security;
alter table public.materials enable row level security;
alter table public.registrations enable row level security;
alter table public.groups enable row level security;
alter table public.students enable row level security;
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_self on public.profiles for select using (id = auth.uid());
create policy workspaces_member on public.workspaces for select using (public.is_member(id));
create policy memberships_self on public.workspace_memberships for select using (user_id = auth.uid());
create policy activities_member on public.activities for select using (status = 'published' or public.is_member(workspace_id));
create policy activities_editor on public.activities for all using (public.is_member(workspace_id, array['admin','coordinator','editor']::public.member_role[])) with check (public.is_member(workspace_id, array['admin','coordinator','editor']::public.member_role[]));
create policy materials_member on public.materials for select using (status = 'published' or public.is_member(workspace_id));
create policy materials_editor on public.materials for all using (public.is_member(workspace_id, array['admin','coordinator','editor']::public.member_role[])) with check (public.is_member(workspace_id, array['admin','coordinator','editor']::public.member_role[]));
create policy registrations_public_insert on public.registrations for insert with check (true);
create policy registrations_member on public.registrations for select using (public.is_member((select workspace_id from public.activities a where a.id = activity_id)));
create policy groups_member on public.groups for select using (public.is_member(workspace_id));
create policy students_catechism on public.students for select using (public.is_member((select workspace_id from public.groups g where g.id = group_id), array['admin','coordinator','catechist']::public.member_role[]));
create policy sessions_member on public.sessions for select using (public.is_member((select workspace_id from public.groups g where g.id = group_id)));
create policy attendance_catechism on public.attendance for all using (public.is_member((select workspace_id from public.groups g join public.students s on s.group_id = g.id where s.id = student_id), array['admin','coordinator','catechist']::public.member_role[])) with check (public.is_member((select workspace_id from public.groups g join public.students s on s.group_id = g.id where s.id = student_id), array['admin','coordinator','catechist']::public.member_role[]));
create policy tasks_member on public.tasks for all using (public.is_member(workspace_id)) with check (public.is_member(workspace_id));
create policy audit_admin on public.audit_events for select using (public.is_member(workspace_id, array['admin','coordinator']::public.member_role[]));

insert into public.workspaces(key,name,description) values
  ('agenda','Agenda','Actividades y calendario de La Comarca'),
  ('catecismo','Catecismo','Grupos, sesiones y seguimiento privado'),
  ('materiales','Materiales','Recursos editoriales y de trabajo'),
  ('operaciones','Operaciones','Tareas, logística e incidencias')
on conflict (key) do nothing;
