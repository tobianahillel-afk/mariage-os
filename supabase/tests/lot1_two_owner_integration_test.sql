begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

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
    'a1111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'lot1.owner.one@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a2222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'lot1.owner.two@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a3333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'lot1.outsider@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

update public.deployment_provisioning_policy
set bootstrap_status = 'open',
    intended_owner_email_normalized = 'lot1.owner.one@example.invalid',
    updated_at = now()
where policy_key = 'primary';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config(
  'mariage.test.lot1_project_id',
  public.provision_private_initial_project(
    'Lot 1 Integration Wedding',
    'Owner One'
  )::text,
  true
);

select isnt(
  current_setting('mariage.test.lot1_project_id')::uuid,
  null::uuid,
  'first verified owner bootstraps the integration project'
);
select is(
  (
    select role_key || ':' || membership_status
    from public.project_members
    where project_id = current_setting('mariage.test.lot1_project_id')::uuid
      and user_id = 'a1111111-1111-4111-8111-111111111111'
  ),
  'owner:active',
  'bootstrap establishes the first active owner'
);

select set_config('mariage.test.lot1_invite_token', raw_token, true)
from public.create_project_invitation(
  current_setting('mariage.test.lot1_project_id')::uuid,
  'lot1.owner.two@example.invalid',
  'owner'
);
select ok(
  current_setting('mariage.test.lot1_invite_token') ~ '^[0-9a-f]{64}$',
  'first owner creates an identity-bound partner invitation'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  public.accept_project_invitation(
    current_setting('mariage.test.lot1_invite_token')
  ),
  current_setting('mariage.test.lot1_project_id')::uuid,
  'second verified owner accepts the invitation into the same project'
);
reset role;

select is(
  (
    select count(*)::integer
    from public.project_members
    where project_id = current_setting('mariage.test.lot1_project_id')::uuid
      and role_key = 'owner'
      and membership_status = 'active'
  ),
  2,
  'project contains exactly two active owners after acceptance'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from public.projects
    where id = current_setting('mariage.test.lot1_project_id')::uuid
  ),
  1,
  'first owner reads the shared project through project RLS'
);
select ok(
  public.has_project_permission(
    current_setting('mariage.test.lot1_project_id')::uuid,
    'project.read'
  ),
  'first owner retains live project.read permission'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from public.projects
    where id = current_setting('mariage.test.lot1_project_id')::uuid
  ),
  1,
  'second owner reads the same shared project through project RLS'
);
select ok(
  public.has_project_permission(
    current_setting('mariage.test.lot1_project_id')::uuid,
    'project.read'
  ),
  'second owner receives live project.read permission from accepted membership'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from public.projects
    where id = current_setting('mariage.test.lot1_project_id')::uuid
  ),
  0,
  'verified outsider cannot read the two-owner project'
);
reset role;

select * from finish();
rollback;
