begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'ed111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'wp29c-abandon-owner@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.9C abandon cleanup project',
  'ed111111-1111-4111-8111-111111111111',
  'ed111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'ed111111-1111-4111-8111-111111111111',
  'owner', 'active', now(), null
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ed111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- 1: create an exact pending reservation through the ordinary protected boundary.
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'ed500000-0000-4000-8000-000000000001',
    'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ed300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Interrupted staging cleanup',
    'interrupted.pdf', 'application/pdf', 64,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    null
  )$$,
  'writer can reserve the pending document used by the cleanup guard'
);

-- Model bytes already accepted into the private staging bucket. Browser callers
-- cannot read/update/delete these bytes, so only the trusted cleanup boundary
-- may remove them before metadata abandonment is allowed.
reset role;
set local role service_role;
insert into storage.objects (bucket_id, name)
values (
  'document-ingest-staging',
  'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/ed300000-0000-4000-8000-000000000001/original'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ed111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- 2: direct RPC abandonment must fail closed while staged bytes still exist.
select throws_ok(
  $$select public.manage_private_document(
    'abandon_upload', 'ed500000-0000-4000-8000-000000000002',
    'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ed300000-0000-4000-8000-000000000001'
  )$$,
  '55000',
  'private document object still present',
  'pending metadata cannot be abandoned while staging bytes still exist'
);

-- 3: a rejected direct abandon preserves the pending reservation for trusted cleanup.
select is(
  (
    select count(*)::integer
    from public.documents
    where project_id = 'edaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and id = 'ed300000-0000-4000-8000-000000000001'
  ),
  1,
  'failed direct abandon preserves pending metadata for trusted cleanup'
);

reset role;
select * from finish();
rollback;
