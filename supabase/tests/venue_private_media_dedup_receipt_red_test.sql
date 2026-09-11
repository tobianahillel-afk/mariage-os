begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'da111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'wp28b-dedup-a@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'db111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'wp28b-dedup-b@example.invalid', '', now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now()
  );

insert into public.projects (id, name, created_by, updated_by)
values
  (
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'WP-2.8B dedup receipt project A',
    'da111111-1111-4111-8111-111111111111',
    'da111111-1111-4111-8111-111111111111'
  ),
  (
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'WP-2.8B dedup receipt project B',
    'db111111-1111-4111-8111-111111111111',
    'db111111-1111-4111-8111-111111111111'
  );

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  (
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da111111-1111-4111-8111-111111111111',
    'owner', 'active', now(), null
  ),
  (
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'db111111-1111-4111-8111-111111111111',
    'owner', 'active', now(), null
  );

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  (
    'da100000-0000-4000-8000-000000000001',
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'WP28BDEDUPA', 'WP-2.8B dedup receipt venue A', 'research',
    'da111111-1111-4111-8111-111111111111',
    'da111111-1111-4111-8111-111111111111'
  ),
  (
    'db100000-0000-4000-8000-000000000001',
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'WP28BDEDUPB', 'WP-2.8B dedup receipt venue B', 'research',
    'db111111-1111-4111-8111-111111111111',
    'db111111-1111-4111-8111-111111111111'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"da111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select public.manage_venue_private_media(
  'reserve_original',
  'da400000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000001',
  'da100000-0000-4000-8000-000000000001',
  'da300000-0000-4000-8000-000000000001',
  'own_visit', null, 'First.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/da200000-0000-4000-8000-000000000001/original'
);
select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000002',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000001'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '[]'::jsonb,
  'MED-006 first finalization reports an explicit empty duplicate list'
);

select public.manage_venue_private_media(
  'reserve_original',
  'da400000-0000-4000-8000-000000000003',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000002',
  'da100000-0000-4000-8000-000000000001',
  'da300000-0000-4000-8000-000000000002',
  'own_visit', null, 'Second.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/da200000-0000-4000-8000-000000000002/original'
);
select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000004',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000002'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '["da200000-0000-4000-8000-000000000001"]'::jsonb,
  'MED-006 finalization reports same-project equal-SHA original IDs'
);

select public.manage_venue_private_media(
  'reserve_original',
  'da400000-0000-4000-8000-000000000005',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000003',
  'da100000-0000-4000-8000-000000000001',
  'da300000-0000-4000-8000-000000000003',
  'own_visit', null, 'Third.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/da200000-0000-4000-8000-000000000003/original'
);
select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000006',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000003'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '["da200000-0000-4000-8000-000000000001","da200000-0000-4000-8000-000000000002"]'::jsonb,
  'MED-006 duplicate IDs are deterministic and exclude the finalized original itself'
);

select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000004',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000002'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '["da200000-0000-4000-8000-000000000001"]'::jsonb,
  'MED-006 replay preserves the original duplicate snapshot after later duplicates appear'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"db111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select public.manage_venue_private_media(
  'reserve_original',
  'db400000-0000-4000-8000-000000000001',
  'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  'db200000-0000-4000-8000-000000000001',
  'db100000-0000-4000-8000-000000000001',
  'db300000-0000-4000-8000-000000000001',
  'own_visit', null, 'Foreign.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/db200000-0000-4000-8000-000000000001/original'
);
select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'db400000-0000-4000-8000-000000000002',
      'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'db200000-0000-4000-8000-000000000001'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '[]'::jsonb,
  'MED-006 SECURITY DEFINER receipt never discloses equal-SHA originals from another project'
);

reset role;
select * from finish();
rollback;
