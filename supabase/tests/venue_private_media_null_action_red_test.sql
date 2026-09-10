begin;

create extension if not exists pgtap with schema extensions;
select plan(1);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'da111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'wp28b-null-action@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B null-action RED project',
  'da111111-1111-4111-8111-111111111111',
  'da111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"da111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select throws_ok(
  $$
    select public.manage_venue_private_media(
      null,
      'da400000-0000-4000-8000-000000000001',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000001'
    )
  $$,
  '22023',
  'venue private media unavailable',
  'NULL lifecycle action is rejected at the public validation boundary'
);

select * from finish();
rollback;
