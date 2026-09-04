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
  target_project_id uuid;
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

  -- Discover the project without taking the invitation lock. All invitation
  -- lifecycle writers then serialize on the project row before locking an
  -- invitation row, avoiding project/invitation lock-order inversion.
  select pi.project_id
  into target_project_id
  from public.project_invitations pi
  where pi.token_hash = presented_hash;

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
  where pi.token_hash = presented_hash
    and pi.project_id = target_project_id
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
    or not public.has_project_permission(target_project_id, 'members.manage_roles')
    or not public.has_auth_assurance('aal2') then
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
    or not public.has_project_permission(target_project_id, 'members.manage_roles')
    or not public.has_auth_assurance('aal2') then
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

comment on function public.accept_project_invitation(text) is
  'Accepts one raw invitation capability, derives verified Auth identity server-side, serializes on the project before invitation mutation, and atomically creates or reactivates the exact invited membership.';

comment on function public.change_project_member_role(uuid, uuid, text) is
  'Privileged membership-role mutation requiring live members.manage_roles permission plus Supabase aal2 assurance; serialized on the project row to preserve the active-owner invariant.';

comment on function public.revoke_project_member(uuid, uuid) is
  'Privileged membership revocation requiring live members.manage_roles permission plus Supabase aal2 assurance; serialized on the project row so concurrent commands cannot remove the final active owner.';
