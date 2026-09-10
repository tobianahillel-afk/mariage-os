begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e8111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp28b-pending-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e8222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp28b-pending-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B pending visibility project',
  'e8111111-1111-4111-8111-111111111111',
  'e8111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e8111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e8222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'e8100000-0000-4000-8000-000000000001',
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP28BP',
  'WP-2.8B pending visibility venue',
  'research',
  'e8111111-1111-4111-8111-111111111111',
  'e8111111-1111-4111-8111-111111111111'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e8111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'e8400000-0000-4000-8000-000000000001',
      'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'e8200000-0000-4000-8000-000000000001',
      'e8100000-0000-4000-8000-000000000001',
      'e8300000-0000-4000-8000-000000000001',
      'own_visit',
      'Pending private image',
      'pending.jpg',
      'image/jpeg',
      1024,
      'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  'writer reserves pending private media'
);

select is(
  (select count(*)::integer from public.media where id = 'e8200000-0000-4000-8000-000000000001'),
  1,
  'writer recovery boundary can read pending media metadata'
);
select is(
  (select count(*)::integer from public.media_links where id = 'e8300000-0000-4000-8000-000000000001'),
  1,
  'writer recovery boundary can read pending media link metadata'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e8222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select count(*)::integer from public.media where id = 'e8200000-0000-4000-8000-000000000001'),
  0,
  'media.read-only viewer cannot read pending private media metadata'
);
select is(
  (select count(*)::integer from public.media_links where id = 'e8300000-0000-4000-8000-000000000001'),
  0,
  'media.read-only viewer cannot read pending private media link metadata'
);

reset role;
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/e8200000-0000-4000-8000-000000000001/original'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e8111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select public.manage_venue_private_media(
  'finalize_original',
  'e8400000-0000-4000-8000-000000000002',
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e8200000-0000-4000-8000-000000000001'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e8222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select count(*)::integer from public.media where id = 'e8200000-0000-4000-8000-000000000001'),
  1,
  'media.read-only viewer can read committed ready private media metadata'
);
select is(
  (select count(*)::integer from public.media_links where id = 'e8300000-0000-4000-8000-000000000001'),
  1,
  'media.read-only viewer can read committed ready private media link metadata'
);

select * from finish();
rollback;
