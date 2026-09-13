begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'eb111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp29a-restore-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'eb222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp29a-restore-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP-2.9A restore project',
  'eb111111-1111-4111-8111-111111111111', 'eb111111-1111-4111-8111-111111111111'
);
insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eb111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'eb222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"eb111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
-- 1
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'eb500000-0000-4000-8000-000000000001',
    'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Restore probe',
    'restore.pdf', 'application/pdf', 64,
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd', null
  )$$,
  'restore probe reservation succeeds'
);
-- 2
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values (
    'project-private',
    'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/eb300000-0000-4000-8000-000000000001/original'
  )$$,
  'exact pending restore probe object uploads'
);
-- 3
select lives_ok(
  $$select public.manage_private_document(
    'finalize_upload', 'eb500000-0000-4000-8000-000000000002',
    'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb300000-0000-4000-8000-000000000001'
  )$$,
  'restore probe finalizes'
);
-- 4
select lives_ok(
  $$select public.manage_private_document(
    'soft_delete', 'eb500000-0000-4000-8000-000000000003',
    'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb300000-0000-4000-8000-000000000001', null, null, 2
  )$$,
  'restore probe soft-deletes'
);

select set_config('request.jwt.claims', '{"sub":"eb222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
-- 5
select is(
  (select count(*)::integer from public.documents where id = 'eb300000-0000-4000-8000-000000000001'),
  0,
  'viewer loses soft-deleted document visibility'
);

select set_config('request.jwt.claims', '{"sub":"eb111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
-- 6
select lives_ok(
  $$select public.manage_private_document(
    'restore', 'eb500000-0000-4000-8000-000000000004',
    'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb300000-0000-4000-8000-000000000001', null, null, 3
  )$$,
  'writer restores deleted document without rewriting binary'
);

select set_config('request.jwt.claims', '{"sub":"eb222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
-- 7
select is(
  (select count(*)::integer from public.documents where id = 'eb300000-0000-4000-8000-000000000001'),
  1,
  'viewer regains metadata visibility after restore'
);
-- 8
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'ebaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/eb300000-0000-4000-8000-000000000001/original'
  ),
  1,
  'viewer regains the same immutable binary after restore'
);

reset role;
select * from finish();
rollback;
