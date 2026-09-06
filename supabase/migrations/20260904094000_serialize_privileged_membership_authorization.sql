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
  if auth.uid() is null then
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

  if not found
    or not public.has_project_permission(target_project_id, 'members.invite') then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

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
  target_project_id uuid;
  invitation_row public.project_invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  select pi.project_id
  into target_project_id
  from public.project_invitations pi
  where pi.id = target_invitation_id;

  if not found then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found then
    raise exception 'invitation unavailable' using errcode = '42501';
  end if;

  select *
  into invitation_row
  from public.project_invitations pi
  where pi.id = target_invitation_id
    and pi.project_id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'members.invite') then
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
  if auth.uid() is null or not public.has_auth_assurance('aal2') then
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

  if not found
    or not public.has_project_permission(target_project_id, 'members.manage_roles') then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

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
  if auth.uid() is null or not public.has_auth_assurance('aal2') then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'members.manage_roles') then
    raise exception 'membership change unavailable' using errcode = '42501';
  end if;

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

comment on function public.create_project_invitation(uuid, text, text) is
  'Creates a hash-at-rest invitation only after project serialization and a live members.invite authorization check, preventing stale-authority issuance races.';

comment on function public.revoke_project_invitation(uuid) is
  'Revokes an invitation using project-first serialization and a post-lock live members.invite authorization check.';

comment on function public.change_project_member_role(uuid, uuid, text) is
  'Privileged role mutation: aal2 first, project serialization second, then live members.manage_roles authorization and final-owner enforcement.';

comment on function public.revoke_project_member(uuid, uuid) is
  'Privileged member revocation: aal2 first, project serialization second, then live members.manage_roles authorization and final-owner enforcement.';
