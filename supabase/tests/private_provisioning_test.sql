begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

select has_table(
  'public',
  'deployment_provisioning_policy',
  'deployment provisioning policy table exists'
);
select has_function(
  'public',
  'provision_private_initial_project',
  array['text', 'text'],
  'private first-owner provisioning command exists'
);
select has_function(
  'public',
  'has_auth_assurance',
  array['text'],
  'auth assurance hook exists'
);

select ok(
  not has_table_privilege('anon', 'public.deployment_provisioning_policy', 'select')
  and not has_table_privilege('authenticated', 'public.deployment_provisioning_policy', 'select')
  and not has_table_privilege('authenticated', 'public.deployment_provisioning_policy', 'update'),
  'deployment provisioning policy is not browser-readable or browser-writable'
);

select ok(
  not has_function_privilege('anon', 'public.provision_private_initial_project(text,text)', 'execute')
  and has_function_privilege('authenticated', 'public.provision_private_initial_project(text,text)', 'execute'),
  'private provisioning command is exposed only to authenticated clients'
);

select ok(
  not has_function_privilege('anon', 'public.has_auth_assurance(text)', 'execute')
  and has_function_privilege('authenticated', 'public.has_auth_assurance(text)', 'execute'),
  'auth assurance hook is exposed only to authenticated clients'
);

select is(
  (
    select mode || ':' || bootstrap_status
    from public.deployment_provisioning_policy
    where policy_key = 'primary'
  ),
  'private_pair:closed',
  'private deployment starts fail-closed until operator opens intended bootstrap identity'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '81111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'first.owner@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '82222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'outsider@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '83333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'unverified@example.invalid',
    '',
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

insert into public.projects (id, name)
values (
  '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Independent Synthetic Project'
);

insert into public.profiles (id, display_name)
values (
  '81111111-1111-4111-8111-111111111111',
  'Existing First Owner Profile'
);

update public.deployment_provisioning_policy
set bootstrap_status = 'open',
    intended_owner_email_normalized = 'unverified@example.invalid',
    updated_at = now()
where policy_key = 'primary';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.provision_private_initial_project('Denied Wedding', 'Unverified Owner')$$,
  '42501',
  'private provisioning unavailable',
  'matching but unverified Auth identity cannot bootstrap private deployment'
);
reset role;

select is(
  (
    select bootstrap_status
    from public.deployment_provisioning_policy
    where policy_key = 'primary'
  ),
  'open',
  'failed unverified attempt does not consume bootstrap state'
);

update public.deployment_provisioning_policy
set intended_owner_email_normalized = 'first.owner@example.invalid',
    updated_at = now()
where policy_key = 'primary';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.provision_private_initial_project('Denied Wedding', 'Outsider')$$,
  '42501',
  'private provisioning unavailable',
  'unrelated verified account cannot consume intended private bootstrap'
);
reset role;

select is(
  (
    select bootstrap_status
    from public.deployment_provisioning_policy
    where policy_key = 'primary'
  ),
  'open',
  'wrong verified identity does not consume bootstrap state'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config(
  'app.wp13_bootstrap_project_id',
  public.provision_private_initial_project(
    '  Mariage Synthétique  ',
    '  First Owner  '
  )::text,
  true
);

select isnt(
  current_setting('app.wp13_bootstrap_project_id')::uuid,
  null::uuid,
  'intended verified owner receives a project identifier from atomic bootstrap'
);

select is(
  (
    select p.name
    from public.projects p
    where p.id = current_setting('app.wp13_bootstrap_project_id')::uuid
  ),
  'Mariage Synthétique',
  'bootstrap creates trimmed project identity'
);

select is(
  (
    select display_name
    from public.profiles
    where id = '81111111-1111-4111-8111-111111111111'
  ),
  'First Owner',
  'bootstrap creates or updates the intended owner profile atomically'
);

select is(
  (
    select pm.role_key || ':' || pm.membership_status
    from public.project_members pm
    where pm.project_id = current_setting('app.wp13_bootstrap_project_id')::uuid
      and pm.user_id = '81111111-1111-4111-8111-111111111111'
  ),
  'owner:active',
  'bootstrap creates exactly an active owner membership'
);

select is(
  (
    select count(*)::integer
    from public.project_members pm
    where pm.project_id = current_setting('app.wp13_bootstrap_project_id')::uuid
  ),
  1,
  'bootstrap project begins with exactly one membership'
);

reset role;

select is(
  (select count(*)::integer from public.projects),
  2,
  'private bootstrap succeeds even when another synthetic project already exists'
);

select ok(
  (
    select p.bootstrap_status = 'claimed'
      and p.claimed_by = '81111111-1111-4111-8111-111111111111'::uuid
      and p.claimed_project_id = current_setting('app.wp13_bootstrap_project_id')::uuid
      and p.claimed_at is not null
    from public.deployment_provisioning_policy p
    where p.policy_key = 'primary'
  ),
  'successful bootstrap atomically consumes policy state and records claimant/project'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$select public.provision_private_initial_project('Second Wedding', 'First Owner')$$,
  '42501',
  'private provisioning unavailable',
  'same authenticated owner cannot replay consumed private bootstrap'
);

select ok(
  public.has_auth_assurance('aal1'),
  'aal1 session satisfies aal1 assurance requirement'
);
select ok(
  not public.has_auth_assurance('aal2'),
  'aal1 session does not satisfy aal2 assurance requirement'
);
select ok(
  not public.has_auth_assurance('unknown'),
  'unknown assurance requirement fails closed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.has_auth_assurance('aal1')
  and public.has_auth_assurance('aal2'),
  'aal2 session satisfies both aal1 and aal2 assurance requirements'
);

reset role;

select throws_ok(
  $$
    update public.deployment_provisioning_policy
    set mode = 'public_saas'
    where policy_key = 'primary'
  $$,
  '23514',
  null,
  'provisioning policy cannot switch modes while private bootstrap claim fields remain populated'
);

select * from finish();
rollback;
