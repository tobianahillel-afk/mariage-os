create extension if not exists pgcrypto with schema extensions;

create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  intended_email_normalized text not null,
  role_key text not null references public.app_roles(role_key) on update restrict on delete restrict,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz null,
  revoked_by uuid null references auth.users(id),
  accepted_at timestamptz null,
  accepted_by uuid null references auth.users(id),
  constraint project_invitations_email_normalized check (
    intended_email_normalized = lower(btrim(intended_email_normalized))
    and char_length(intended_email_normalized) between 3 and 254
  ),
  constraint project_invitations_token_hash_format check (
    token_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint project_invitations_expiry_after_creation check (
    expires_at > created_at
  ),
  constraint project_invitations_revocation_consistency check (
    (revoked_at is null and revoked_by is null)
    or (revoked_at is not null and revoked_by is not null)
  ),
  constraint project_invitations_acceptance_consistency check (
    (accepted_at is null and accepted_by is null)
    or (accepted_at is not null and accepted_by is not null)
  ),
  constraint project_invitations_terminal_state check (
    not (revoked_at is not null and accepted_at is not null)
  )
);

create unique index project_invitations_one_open_email_idx
  on public.project_invitations (project_id, intended_email_normalized)
  where revoked_at is null and accepted_at is null;

create index project_invitations_project_created_idx
  on public.project_invitations (project_id, created_at desc);

alter table public.project_invitations enable row level security;

revoke all on table public.project_invitations from public, anon, authenticated;

create or replace function public.create_project_invitation(
  target_project_id uuid,
  intended_email text,
  invited_role text
)
returns table (
  invitation_id uuid,
  raw_token text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_email text;
  generated_token text;
  generated_hash text;
  invitation_row public.project_invitations%rowtype;
begin
  if auth.uid() is null
    or not public.has_project_permission(target_project_id, 'members.invite') then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  normalized_email := lower(btrim(intended_email));
  if normalized_email is null
    or char_length(normalized_email) not between 3 and 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invitation unavailable' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.app_roles ar
    where ar.role_key = invited_role
      and ar.is_assignable
  ) then
    raise exception 'invitation unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if exists (
    select 1
    from auth.users u
    join public.project_members pm
      on pm.user_id = u.id
     and pm.project_id = target_project_id
    where lower(u.email) = normalized_email
      and u.email_confirmed_at is not null
      and pm.membership_status = 'active'
  ) then
    raise exception 'invitation unavailable' using errcode = '23505';
  end if;

  update public.project_invitations pi
  set revoked_at = now(),
      revoked_by = auth.uid()
  where pi.project_id = target_project_id
    and pi.intended_email_normalized = normalized_email
    and pi.accepted_at is null
    and pi.revoked_at is null;

  generated_token := encode(extensions.gen_random_bytes(32), 'hex');
  generated_hash := encode(
    extensions.digest(generated_token, 'sha256'),
    'hex'
  );

  insert into public.project_invitations (
    project_id,
    intended_email_normalized,
    role_key,
    token_hash,
    expires_at,
    created_by
  )
  values (
    target_project_id,
    normalized_email,
    invited_role,
    generated_hash,
    now() + interval '7 days',
    auth.uid()
  )
  returning * into invitation_row;

  return query
  select invitation_row.id, generated_token, invitation_row.expires_at;
end;
$$;

create or replace function public.revoke_project_invitation(
  target_invitation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  invitation_row public.project_invitations%rowtype;
begin
  select *
  into invitation_row
  from public.project_invitations pi
  where pi.id = target_invitation_id
  for update;

  if not found
    or auth.uid() is null
    or not public.has_project_permission(invitation_row.project_id, 'members.invite') then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  if invitation_row.accepted_at is not null then
    raise exception 'invitation unavailable' using errcode = '55000';
  end if;

  if invitation_row.revoked_at is not null then
    return true;
  end if;

  update public.project_invitations
  set revoked_at = now(),
      revoked_by = auth.uid()
  where id = target_invitation_id;

  return true;
end;
$$;

create or replace function public.accept_project_invitation(
  presented_token text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_user_id uuid;
  current_verified_email text;
  presented_hash text;
  invitation_row public.project_invitations%rowtype;
  membership_row public.project_members%rowtype;
begin
  current_user_id := auth.uid();
  if current_user_id is null
    or presented_token is null
    or presented_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  select lower(u.email)
  into current_verified_email
  from auth.users u
  where u.id = current_user_id
    and u.email is not null
    and u.email_confirmed_at is not null;

  if current_verified_email is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  presented_hash := encode(
    extensions.digest(presented_token, 'sha256'),
    'hex'
  );

  select *
  into invitation_row
  from public.project_invitations pi
  where pi.token_hash = presented_hash
  for update;

  if not found then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  if invitation_row.intended_email_normalized <> current_verified_email then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  if invitation_row.accepted_at is not null then
    if invitation_row.accepted_by <> current_user_id then
      raise exception 'invitation unavailable' using errcode = '42501';
    end if;

    select *
    into membership_row
    from public.project_members pm
    where pm.project_id = invitation_row.project_id
      and pm.user_id = current_user_id;

    if not found
      or membership_row.membership_status <> 'active'
      or membership_row.role_key <> invitation_row.role_key then
      raise exception 'invitation unavailable' using errcode = '42501';
    end if;

    return invitation_row.project_id;
  end if;

  if invitation_row.revoked_at is not null
    or invitation_row.expires_at <= now()
    or not exists (
      select 1
      from public.app_roles ar
      where ar.role_key = invitation_row.role_key
        and ar.is_assignable
    ) then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = invitation_row.project_id
  for update;

  select *
  into membership_row
  from public.project_members pm
  where pm.project_id = invitation_row.project_id
    and pm.user_id = current_user_id
  for update;

  if found then
    if membership_row.membership_status <> 'revoked'
      or membership_row.role_key <> invitation_row.role_key then
      raise exception 'invitation unavailable' using errcode = '40900';
    end if;

    update public.project_members
    set membership_status = 'active',
        accepted_at = now(),
        revoked_at = null
    where project_id = invitation_row.project_id
      and user_id = current_user_id;
  else
    insert into public.project_members (
      project_id,
      user_id,
      role_key,
      membership_status,
      accepted_at
    )
    values (
      invitation_row.project_id,
      current_user_id,
      invitation_row.role_key,
      'active',
      now()
    );
  end if;

  update public.project_invitations
  set accepted_at = now(),
      accepted_by = current_user_id
  where id = invitation_row.id;

  return invitation_row.project_id;
end;
$$;

create or replace function public.change_project_member_role(
  target_project_id uuid,
  target_user_id uuid,
  new_role text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  target_membership public.project_members%rowtype;
  active_owner_count integer;
begin
  if auth.uid() is null
    or not public.has_project_permission(target_project_id, 'members.manage_roles') then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.app_roles ar
    where ar.role_key = new_role
      and ar.is_assignable
  ) then
    raise exception 'membership change unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  select *
  into target_membership
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = target_user_id
  for update;

  if not found or target_membership.membership_status <> 'active' then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

  if target_membership.role_key = 'owner' and new_role <> 'owner' then
    select count(*)::integer
    into active_owner_count
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.membership_status = 'active'
      and pm.role_key = 'owner';

    if active_owner_count <= 1 then
      raise exception 'project requires an active owner' using errcode = '23514';
    end if;
  end if;

  update public.project_members
  set role_key = new_role
  where project_id = target_project_id
    and user_id = target_user_id;

  return true;
end;
$$;

create or replace function public.revoke_project_member(
  target_project_id uuid,
  target_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  target_membership public.project_members%rowtype;
  active_owner_count integer;
begin
  if auth.uid() is null
    or not public.has_project_permission(target_project_id, 'members.manage_roles') then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  select *
  into target_membership
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = target_user_id
  for update;

  if not found then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

  if target_membership.membership_status = 'revoked' then
    return true;
  end if;

  if target_membership.role_key = 'owner' then
    select count(*)::integer
    into active_owner_count
    from public.project_members pm
    where pm.project_id = target_project_id
      and pm.membership_status = 'active'
      and pm.role_key = 'owner';

    if active_owner_count <= 1 then
      raise exception 'project requires an active owner' using errcode = '23514';
    end if;
  end if;

  update public.project_members
  set membership_status = 'revoked',
      revoked_at = now()
  where project_id = target_project_id
    and user_id = target_user_id;

  return true;
end;
$$;

revoke all on function public.create_project_invitation(uuid, text, text) from public, anon;
revoke all on function public.revoke_project_invitation(uuid) from public, anon;
revoke all on function public.accept_project_invitation(text) from public, anon;
revoke all on function public.change_project_member_role(uuid, uuid, text) from public, anon;
revoke all on function public.revoke_project_member(uuid, uuid) from public, anon;

grant execute on function public.create_project_invitation(uuid, text, text) to authenticated;
grant execute on function public.revoke_project_invitation(uuid) to authenticated;
grant execute on function public.accept_project_invitation(text) to authenticated;
grant execute on function public.change_project_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_project_member(uuid, uuid) to authenticated;

comment on table public.project_invitations is
  'Identity-bound invitation persistence. Only token hashes are stored; browser roles receive no direct table privileges.';

comment on function public.accept_project_invitation(text) is
  'Accepts one raw invitation capability, derives verified Auth identity server-side, and atomically creates or reactivates the exact invited membership.';

comment on function public.revoke_project_member(uuid, uuid) is
  'Protected membership revocation serialized on the project row so concurrent commands cannot remove the final active owner.';
