begin;

create extension if not exists pgtap with schema extensions;

select plan(41);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'projects', 'projects table exists');
select has_table('public', 'project_members', 'project_members table exists');
select has_function(
  'public',
  'has_project_permission',
  array['uuid', 'text'],
  'membership-aware permission helper exists'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select')
  and not has_table_privilege('anon', 'public.projects', 'select')
  and not has_table_privilege('anon', 'public.project_members', 'select'),
  'anonymous role has no read grant on any core tenancy table'
);

select ok(
  not has_function_privilege('anon', 'public.has_project_permission(uuid,text)', 'execute')
  and has_function_privilege('authenticated', 'public.has_project_permission(uuid,text)', 'execute'),
  'permission RPC is executable only by authenticated client role'
);

select ok(
  has_table_privilege('authenticated', 'public.projects', 'select')
  and not has_table_privilege('authenticated', 'public.projects', 'insert')
  and not has_table_privilege('authenticated', 'public.projects', 'update')
  and not has_table_privilege('authenticated', 'public.projects', 'delete'),
  'projects expose read only at PostgreSQL grant layer'
);

select ok(
  has_table_privilege('authenticated', 'public.project_members', 'select')
  and not has_table_privilege('authenticated', 'public.project_members', 'insert')
  and not has_table_privilege('authenticated', 'public.project_members', 'update')
  and not has_table_privilege('authenticated', 'public.project_members', 'delete'),
  'project memberships expose read only at PostgreSQL grant layer'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select')
  and not has_table_privilege('authenticated', 'public.profiles', 'insert')
  and not has_table_privilege('authenticated', 'public.profiles', 'update')
  and not has_table_privilege('authenticated', 'public.profiles', 'delete')
  and has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'id', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'update'),
  'profiles expose self-readable data and only ordinary profile columns are update-granted'
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
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'multi-project@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '77777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, display_name, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'Owner A', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('22222222-2222-4222-8222-222222222222', 'Editor A', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('33333333-3333-4333-8333-333333333333', 'Viewer A', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('44444444-4444-4444-8444-444444444444', 'Multi Project', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('55555555-5555-4555-8555-555555555555', 'Outsider', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('66666666-6666-4666-8666-666666666666', 'Revoked', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z'),
  ('77777777-7777-4777-8777-777777777777', 'Owner B', '2000-01-01T00:00:00Z', '2000-01-01T00:00:00Z');

insert into public.projects (id, name, created_by, updated_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Synthetic Project A', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Synthetic Project B', '77777777-7777-4777-8777-777777777777', '77777777-7777-4777-8777-777777777777'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Synthetic Project C', null, null);

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at,
  revoked_at
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '44444444-4444-4444-8444-444444444444', 'editor', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '77777777-7777-4777-8777-777777777777', 'owner', 'active', now(), null);

set local role anon;
select throws_ok(
  $$select * from public.projects$$,
  '42501',
  'permission denied for table projects',
  'anonymous project access is denied before RLS row access'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select array_agg(id order by id) from public.projects),
  array['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid],
  'project A owner sees only project A'
);

select is(
  (select count(*)::integer from public.project_members),
  5,
  'project A owner with members.read sees only project A memberships including revoked history'
);

select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'members.invite'),
  'active owner receives owner-only membership permission'
);

select ok(
  not public.has_project_permission('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'project.read'),
  'project A owner cannot authorize against project B by knowing its UUID'
);

select throws_ok(
  $$
    insert into public.projects (id, name)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Unauthorized Project')
  $$,
  '42501',
  'permission denied for table projects',
  'ordinary authenticated owner cannot create a project through generic CRUD'
);

select throws_ok(
  $$update public.projects set name = 'Unauthorized Rename' where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501',
  'permission denied for table projects',
  'ordinary authenticated owner cannot update a project through generic CRUD'
);

select throws_ok(
  $$delete from public.projects where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501',
  'permission denied for table projects',
  'ordinary authenticated owner cannot delete a project through generic CRUD'
);

select throws_ok(
  $$
    update public.project_members
    set role_key = 'viewer'
    where project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '22222222-2222-4222-8222-222222222222'
  $$,
  '42501',
  'permission denied for table project_members',
  'ordinary client cannot mutate protected membership role through generic CRUD'
);

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role_key, membership_status)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '11111111-1111-4111-8111-111111111111',
      'owner',
      'active'
    )
  $$,
  '42501',
  'permission denied for table project_members',
  'client cannot inject itself into a different project through generic membership CRUD'
);

select throws_ok(
  $$
    delete from public.project_members
    where project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '22222222-2222-4222-8222-222222222222'
  $$,
  '42501',
  'permission denied for table project_members',
  'ordinary client cannot delete a membership through generic CRUD'
);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'authenticated user sees only their own auth-global profile'
);

select lives_ok(
  $$update public.profiles set display_name = 'Owner A Updated' where id = '11111111-1111-4111-8111-111111111111'$$,
  'user may update their own ordinary profile fields'
);

select ok(
  (select updated_at > '2000-01-01T00:00:00Z' from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  'profile updated_at is maintained server-side'
);

select throws_ok(
  $$update public.profiles set updated_at = '1999-01-01T00:00:00Z' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'client cannot mutate protected profile audit columns'
);

select throws_ok(
  $$insert into public.profiles (id, display_name) values ('11111111-1111-4111-8111-111111111111', 'Duplicate Profile')$$,
  '42501',
  'permission denied for table profiles',
  'client cannot create profiles through generic CRUD'
);

select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'client cannot delete profiles through generic CRUD'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.projects),
  1,
  'editor reads the active project through project.read'
);
select is(
  (select count(*)::integer from public.project_members),
  5,
  'editor receives members.read and sees same-project membership rows'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'members.invite'),
  'editor does not receive owner-only invitation permission'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.projects),
  1,
  'viewer may read the project through project.read'
);
select is(
  (select count(*)::integer from public.project_members),
  0,
  'viewer cannot enumerate project membership without members.read'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'finance.read'),
  'viewer finance permission fails closed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is(
  (select array_agg(id order by id) from public.projects),
  array[
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid
  ],
  'multi-project user sees exactly projects A and B, never project C'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.projects),
  0,
  'outsider sees no projects'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'project.read'),
  'outsider permission evaluation fails closed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.projects),
  0,
  'revoked member loses cloud project reads without a fresh login'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'project.read'),
  'revoked membership fails permission evaluation immediately'
);

reset role;

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role_key, membership_status)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '55555555-5555-4555-8555-555555555555',
      'unknown-role',
      'active'
    )
  $$,
  '23503',
  null,
  'unknown membership role is rejected by the role catalog foreign key'
);

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role_key, membership_status, revoked_at)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '55555555-5555-4555-8555-555555555555',
      'viewer',
      'active',
      now()
    )
  $$,
  '23514',
  null,
  'active membership cannot carry a revoked timestamp'
);

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role_key, membership_status)
    values (
      'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      '55555555-5555-4555-8555-555555555555',
      'viewer',
      'active'
    )
  $$,
  '23503',
  null,
  'membership cannot reference a nonexistent project'
);

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role_key, membership_status)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'owner',
      'active'
    )
  $$,
  '23505',
  null,
  'duplicate project membership is rejected by the canonical compound key'
);

select * from finish();
rollback;
