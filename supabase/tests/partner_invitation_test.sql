begin;

create extension if not exists pgtap with schema extensions;

select plan(43);

select has_table(
  'public',
  'project_invitations',
  'project invitation table exists'
);
select has_function(
  'public',
  'create_project_invitation',
  array['uuid', 'text', 'text'],
  'protected invitation creation command exists'
);
select has_function(
  'public',
  'revoke_project_invitation',
  array['uuid'],
  'protected invitation revocation command exists'
);
select has_function(
  'public',
  'accept_project_invitation',
  array['text'],
  'identity-bound invitation acceptance command exists'
);
select has_function(
  'public',
  'change_project_member_role',
  array['uuid', 'uuid', 'text'],
  'protected membership role command exists'
);
select has_function(
  'public',
  'revoke_project_member',
  array['uuid', 'uuid'],
  'protected membership revocation command exists'
);

select ok(
  not has_table_privilege('anon', 'public.project_invitations', 'select')
  and not has_table_privilege('authenticated', 'public.project_invitations', 'select')
  and not has_table_privilege('authenticated', 'public.project_invitations', 'insert')
  and not has_table_privilege('authenticated', 'public.project_invitations', 'update')
  and not has_table_privilege('authenticated', 'public.project_invitations', 'delete'),
  'invitation persistence is not directly browser-readable or writable'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.create_project_invitation(uuid,text,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.create_project_invitation(uuid,text,text)',
    'execute'
  ),
  'invitation creation is callable only by authenticated clients before permission checks'
);

select ok(
  has_function_privilege('authenticated', 'public.revoke_project_invitation(uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.accept_project_invitation(text)', 'execute')
  and has_function_privilege(
    'authenticated',
    'public.change_project_member_role(uuid,uuid,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.revoke_project_member(uuid,uuid)',
    'execute'
  )
  and not has_function_privilege('anon', 'public.accept_project_invitation(text)', 'execute'),
  'remaining invitation and membership commands expose no anonymous execution path'
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
    '91111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'owner.one@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '92222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'partner.two@example.invalid',
    '',
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '93333333-3333-4333-8333-333333333333',
    'authenticated',
    'authenticated',
    'wrong.account@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '94444444-4444-4444-8444-444444444444',
    'authenticated',
    'authenticated',
    'viewer@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '95555555-5555-4555-8555-555555555555',
    'authenticated',
    'authenticated',
    'revokee@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '96666666-6666-4666-8666-666666666666',
    'authenticated',
    'authenticated',
    'expired@example.invalid',
    '',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  );

insert into public.projects (id, name)
values
  ('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Invitation Project A'),
  ('9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Invitation Project B');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at
)
values
  (
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '91111111-1111-4111-8111-111111111111',
    'owner',
    'active',
    now()
  ),
  (
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '94444444-4444-4444-8444-444444444444',
    'viewer',
    'active',
    now()
  ),
  (
    '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '93333333-3333-4333-8333-333333333333',
    'owner',
    'active',
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config('mariage.test.token', raw_token, true),
       set_config('mariage.test.invite_id', invitation_id::text, true)
from public.create_project_invitation(
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '  Partner.Two@Example.Invalid  ',
  'owner'
);
reset role;

select ok(
  current_setting('mariage.test.token') ~ '^[0-9a-f]{64}$',
  'created raw token contains 256 bits encoded as URL-safe hex'
);
select is(
  (
    select token_hash
    from public.project_invitations
    where id = current_setting('mariage.test.invite_id')::uuid
  ),
  encode(
    extensions.digest(current_setting('mariage.test.token'), 'sha256'),
    'hex'
  ),
  'only the SHA-256 token hash is persisted'
);
select is(
  (
    select count(*)::integer
    from public.project_invitations
    where token_hash = current_setting('mariage.test.token')
  ),
  0,
  'raw invitation token is absent from persistent token storage'
);
select is(
  (
    select intended_email_normalized || ':' || role_key
    from public.project_invitations
    where id = current_setting('mariage.test.invite_id')::uuid
  ),
  'partner.two@example.invalid:owner',
  'invitation persists normalized intended identity and allowed role'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  format(
    'select public.accept_project_invitation(%L)',
    current_setting('mariage.test.token')
  ),
  '42501',
  'invitation unavailable',
  'wrong verified identity cannot accept invitation'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  format(
    'select public.accept_project_invitation(%L)',
    current_setting('mariage.test.token')
  ),
  '42501',
  'invitation unavailable',
  'matching but unverified identity cannot accept invitation'
);
reset role;

update auth.users
set email_confirmed_at = now(),
    updated_at = now()
where id = '92222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  public.accept_project_invitation(current_setting('mariage.test.token')),
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'matching verified partner accepts invitation'
);
reset role;

select is(
  (
    select role_key || ':' || membership_status
    from public.project_members
    where project_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '92222222-2222-4222-8222-222222222222'
  ),
  'owner:active',
  'acceptance creates exact active owner membership'
);
select ok(
  (
    select accepted_at is not null
      and accepted_by = '92222222-2222-4222-8222-222222222222'::uuid
    from public.project_invitations
    where id = current_setting('mariage.test.invite_id')::uuid
  ),
  'acceptance marks invitation consumed by immutable Auth user ID'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  public.accept_project_invitation(current_setting('mariage.test.token')),
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'repeating successful acceptance is idempotent'
);
reset role;

select is(
  (
    select count(*)::integer
    from public.project_members
    where project_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '92222222-2222-4222-8222-222222222222'
  ),
  1,
  'replayed successful acceptance cannot duplicate membership'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  format(
    'select public.accept_project_invitation(%L)',
    current_setting('mariage.test.token')
  ),
  '42501',
  'invitation unavailable',
  'consumed token remains unusable by a different identity'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config('mariage.test.revoked_token', raw_token, true),
       set_config('mariage.test.revoked_id', invitation_id::text, true)
from public.create_project_invitation(
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'revokee@example.invalid',
  'editor'
);
select ok(
  public.revoke_project_invitation(
    current_setting('mariage.test.revoked_id')::uuid
  ),
  'authorized owner can revoke an open invitation'
);
reset role;

select ok(
  (
    select revoked_at is not null
      and revoked_by = '91111111-1111-4111-8111-111111111111'::uuid
    from public.project_invitations
    where id = current_setting('mariage.test.revoked_id')::uuid
  ),
  'revocation records actor and timestamp without deleting evidence'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"95555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  format(
    'select public.accept_project_invitation(%L)',
    current_setting('mariage.test.revoked_token')
  ),
  '42501',
  'invitation unavailable',
  'revoked invitation cannot be accepted'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config('mariage.test.expired_token', raw_token, true),
       set_config('mariage.test.expired_id', invitation_id::text, true)
from public.create_project_invitation(
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'expired@example.invalid',
  'viewer'
);
reset role;

update public.project_invitations
set created_at = now() - interval '8 days',
    expires_at = now() - interval '1 day'
where id = current_setting('mariage.test.expired_id')::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"96666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  format(
    'select public.accept_project_invitation(%L)',
    current_setting('mariage.test.expired_token')
  ),
  '42501',
  'invitation unavailable',
  'expired invitation cannot be accepted'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select * from public.create_project_invitation(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'partner.two@example.invalid',
      'owner'
    )
  $$,
  '23505',
  'invitation unavailable',
  'active project member cannot receive a redundant invitation'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"94444444-4444-4444-8444-444444444444","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select * from public.create_project_invitation(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'someone@example.invalid',
      'viewer'
    )
  $$,
  '42501',
  'invitation unavailable',
  'viewer cannot issue invitations'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select * from public.create_project_invitation(
      '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'someone@example.invalid',
      'viewer'
    )
  $$,
  '42501',
  'invitation unavailable',
  'owner cannot issue invitation for unrelated project'
);
select throws_ok(
  $$
    select public.change_project_member_role(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '92222222-2222-4222-8222-222222222222',
      'editor'
    )
  $$,
  '42501',
  'membership change unavailable',
  'aal1 owner cannot mutate a member role'
);
select throws_ok(
  $$
    select public.revoke_project_member(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '94444444-4444-4444-8444-444444444444'
    )
  $$,
  '42501',
  'membership change unavailable',
  'aal1 owner cannot revoke a member'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '92222222-2222-4222-8222-222222222222',
    'editor'
  ),
  'aal2 owner can demote another owner while one owner remains'
);
select throws_ok(
  $$
    select public.change_project_member_role(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '91111111-1111-4111-8111-111111111111',
      'viewer'
    )
  $$,
  '23514',
  'project requires an active owner',
  'last active owner cannot be demoted'
);
select throws_ok(
  $$
    select public.revoke_project_member(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '91111111-1111-4111-8111-111111111111'
    )
  $$,
  '23514',
  'project requires an active owner',
  'last active owner cannot be revoked'
);
select ok(
  public.change_project_member_role(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '92222222-2222-4222-8222-222222222222',
    'owner'
  ),
  'aal2 owner can promote active member to owner'
);
select ok(
  public.revoke_project_member(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '91111111-1111-4111-8111-111111111111'
  ),
  'one owner can be revoked after another active owner exists'
);
reset role;

select is(
  (
    select string_agg(
      user_id::text || ':' || membership_status || ':' || role_key,
      ',' order by user_id
    )
    from public.project_members
    where project_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id in (
        '91111111-1111-4111-8111-111111111111'::uuid,
        '92222222-2222-4222-8222-222222222222'::uuid
      )
  ),
  '91111111-1111-4111-8111-111111111111:revoked:owner,92222222-2222-4222-8222-222222222222:active:owner',
  'membership mutations preserve one active owner and record revoked state'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select throws_ok(
  $$
    select public.change_project_member_role(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '92222222-2222-4222-8222-222222222222',
      'viewer'
    )
  $$,
  '42501',
  'membership change unavailable',
  'revoked former owner loses membership administration permission immediately'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal2"}',
  true
);
select throws_ok(
  $$
    select public.revoke_project_member(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '92222222-2222-4222-8222-222222222222'
    )
  $$,
  '23514',
  'project requires an active owner',
  'remaining owner cannot revoke itself'
);
select set_config('mariage.test.reactivate_token', raw_token, true)
from public.create_project_invitation(
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'owner.one@example.invalid',
  'owner'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  public.accept_project_invitation(
    current_setting('mariage.test.reactivate_token')
  ),
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'matching invitation can reactivate same-role revoked membership'
);
reset role;

select is(
  (
    select role_key || ':' || membership_status
    from public.project_members
    where project_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and user_id = '91111111-1111-4111-8111-111111111111'
  ),
  'owner:active',
  'reactivated membership restores exact invited owner role'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select * from public.create_project_invitation(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'new.person@example.invalid',
      'unknown_role'
    )
  $$,
  '22023',
  'invitation unavailable',
  'unknown role cannot be embedded in invitation'
);
select throws_ok(
  $$
    select * from public.create_project_invitation(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'not-an-email',
      'viewer'
    )
  $$,
  '22023',
  'invitation unavailable',
  'invalid intended email fails closed before persistence'
);
select throws_ok(
  format(
    'select public.revoke_project_invitation(%L::uuid)',
    current_setting('mariage.test.invite_id')
  ),
  '55000',
  'invitation unavailable',
  'accepted invitation cannot later be revoked into conflicting terminal state'
);
reset role;

select * from finish();
rollback;