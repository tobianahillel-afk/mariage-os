create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 120),
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key,
  name text not null check (char_length(name) between 1 and 160),
  locale text not null default 'fr-FR' check (char_length(locale) between 2 and 35),
  timezone text not null default 'Europe/Paris' check (char_length(timezone) between 1 and 80),
  currency char(3) not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  target_guest_count integer null check (target_guest_count >= 0),
  status text not null default 'planning' check (status in ('planning', 'archived', 'deleting')),
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id),
  revision bigint not null default 1 check (revision > 0)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null references public.app_roles(role_key) on update restrict on delete restrict,
  membership_status text not null default 'active' check (membership_status in ('active', 'revoked')),
  accepted_at timestamptz null,
  revoked_at timestamptz null,
  last_seen_activity_at timestamptz null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id),
  constraint project_members_revocation_consistency check (
    (membership_status = 'active' and revoked_at is null)
    or (membership_status = 'revoked' and revoked_at is not null)
  )
);

create index project_members_user_active_idx
  on public.project_members (user_id, project_id)
  where membership_status = 'active';

create or replace function public.has_project_permission(
  target_project_id uuid,
  requested_permission text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.project_members pm
      where pm.project_id = target_project_id
        and pm.user_id = auth.uid()
        and pm.membership_status = 'active'
        and public.role_has_permission(pm.role_key, requested_permission)
    );
$$;

revoke all on function public.has_project_permission(uuid, text) from public, anon;
grant execute on function public.has_project_permission(uuid, text) to authenticated;

comment on function public.has_project_permission(uuid, text) is
  'Evaluates current auth.uid() against live active project membership and the migration-controlled role-permission catalog. Missing, revoked or unknown state fails closed.';

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_profile_updated_at() from public, anon, authenticated;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row
execute function public.touch_profile_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.projects from public, anon, authenticated;
revoke all on table public.project_members from public, anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.projects to authenticated;
grant select on table public.project_members to authenticated;

create policy profiles_select_self
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy projects_select_member
on public.projects
for select
to authenticated
using (public.has_project_permission(id, 'project.read'));

create policy project_members_select_authorized
on public.project_members
for select
to authenticated
using (public.has_project_permission(project_id, 'members.read'));
