create table public.deployment_provisioning_policy (
  policy_key text primary key,
  mode text not null check (mode in ('private_pair', 'public_saas')),
  bootstrap_status text not null check (bootstrap_status in ('closed', 'open', 'claimed')),
  intended_owner_email_normalized text null,
  claimed_by uuid null references auth.users(id) on delete restrict,
  claimed_project_id uuid null references public.projects(id) on delete restrict,
  claimed_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint deployment_provisioning_policy_key check (policy_key = 'primary'),
  constraint deployment_provisioning_private_state check (
    (
      mode = 'private_pair'
      and (
        (
          bootstrap_status = 'closed'
          and intended_owner_email_normalized is null
          and claimed_by is null
          and claimed_project_id is null
          and claimed_at is null
        )
        or (
          bootstrap_status = 'open'
          and intended_owner_email_normalized is not null
          and claimed_by is null
          and claimed_project_id is null
          and claimed_at is null
        )
        or (
          bootstrap_status = 'claimed'
          and intended_owner_email_normalized is not null
          and claimed_by is not null
          and claimed_project_id is not null
          and claimed_at is not null
        )
      )
    )
    or (
      mode = 'public_saas'
      and bootstrap_status = 'closed'
      and intended_owner_email_normalized is null
      and claimed_by is null
      and claimed_project_id is null
      and claimed_at is null
    )
  ),
  constraint deployment_provisioning_email_normalized check (
    intended_owner_email_normalized is null
    or (
      intended_owner_email_normalized = lower(btrim(intended_owner_email_normalized))
      and position('@' in intended_owner_email_normalized) > 1
    )
  )
);

insert into public.deployment_provisioning_policy (
  policy_key,
  mode,
  bootstrap_status
)
values ('primary', 'private_pair', 'closed');

alter table public.deployment_provisioning_policy enable row level security;

revoke all on table public.deployment_provisioning_policy from public, anon, authenticated;

create or replace function public.provision_private_initial_project(
  requested_project_name text,
  requested_owner_display_name text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_user_id uuid;
  current_user_email text;
  expected_email text;
  new_project_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'private provisioning unavailable' using errcode = '42501';
  end if;

  if requested_project_name is null
    or char_length(btrim(requested_project_name)) not between 1 and 160
    or requested_owner_display_name is null
    or char_length(btrim(requested_owner_display_name)) not between 1 and 120
  then
    raise exception 'invalid bootstrap input' using errcode = '22023';
  end if;

  select lower(btrim(u.email))
    into current_user_email
  from auth.users u
  where u.id = current_user_id
    and u.email is not null
    and u.email_confirmed_at is not null;

  if current_user_email is null then
    raise exception 'private provisioning unavailable' using errcode = '42501';
  end if;

  select p.intended_owner_email_normalized
    into expected_email
  from public.deployment_provisioning_policy p
  where p.policy_key = 'primary'
    and p.mode = 'private_pair'
    and p.bootstrap_status = 'open'
    and p.claimed_at is null
  for update;

  if expected_email is null or expected_email <> current_user_email then
    raise exception 'private provisioning unavailable' using errcode = '42501';
  end if;

  new_project_id := gen_random_uuid();

  insert into public.profiles (id, display_name)
  values (current_user_id, btrim(requested_owner_display_name))
  on conflict (id) do update
  set display_name = excluded.display_name,
      updated_at = now();

  insert into public.projects (
    id,
    name,
    created_by,
    updated_by
  )
  values (
    new_project_id,
    btrim(requested_project_name),
    current_user_id,
    current_user_id
  );

  insert into public.project_members (
    project_id,
    user_id,
    role_key,
    membership_status,
    accepted_at
  )
  values (
    new_project_id,
    current_user_id,
    'owner',
    'active',
    now()
  );

  update public.deployment_provisioning_policy
  set bootstrap_status = 'claimed',
      claimed_by = current_user_id,
      claimed_project_id = new_project_id,
      claimed_at = now(),
      updated_at = now()
  where policy_key = 'primary';

  return new_project_id;
end;
$$;

revoke all on function public.provision_private_initial_project(text, text) from public;
revoke all on function public.provision_private_initial_project(text, text) from anon;
grant execute on function public.provision_private_initial_project(text, text) to authenticated;

comment on function public.provision_private_initial_project(text, text) is
  'Private-pair deployment bootstrap. Requires a verified authenticated user whose normalized email was opened out-of-band in the deployment provisioning policy. Creates profile, project and owner membership atomically and consumes the private bootstrap state once.';

create or replace function public.has_auth_assurance(required_aal text)
returns boolean
language sql
stable
set search_path = pg_catalog
as $$
  select case
    when auth.uid() is null then false
    when required_aal = 'aal1' then coalesce(auth.jwt() ->> 'aal', '') in ('aal1', 'aal2')
    when required_aal = 'aal2' then coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
    else false
  end;
$$;

revoke all on function public.has_auth_assurance(text) from public;
revoke all on function public.has_auth_assurance(text) from anon;
grant execute on function public.has_auth_assurance(text) to authenticated;

comment on function public.has_auth_assurance(text) is
  'Fail-closed Supabase Auth assurance-level hook. This proves AAL only; recent-auth timing is deliberately handled by the later session/security packet rather than inferred from JWT refresh time.';
