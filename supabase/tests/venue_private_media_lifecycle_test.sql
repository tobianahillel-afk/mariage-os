begin;

create extension if not exists pgtap with schema extensions;
select plan(20);

select ok(
  to_regprocedure(
    'public.manage_venue_private_media(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)'
  ) is not null,
  'WP-2.8B lifecycle wrapper exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.manage_venue_private_media(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.manage_venue_private_media(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)',
    'execute'
  ),
  'only authenticated clients receive lifecycle execute privilege'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_private_media_assert_writer(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.venue_private_media_replay_receipt(uuid,text,uuid,uuid,jsonb)',
    'execute'
  ),
  'private media lifecycle helpers are not client executable'
);
select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.manage_venue_private_media(text,uuid,uuid,uuid,uuid,uuid,text,text,text,text,bigint,text,integer,integer,uuid,text,integer)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'lifecycle wrapper uses a fixed trusted search_path'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'd8111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp28b-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd8222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp28b-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B lifecycle project',
  'd8111111-1111-4111-8111-111111111111',
  'd8111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('d8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd8111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('d8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd8222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'd8100000-0000-4000-8000-000000000001',
  'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP28B',
  'WP-2.8B lifecycle venue',
  'research',
  'd8111111-1111-4111-8111-111111111111',
  'd8111111-1111-4111-8111-111111111111'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d8111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd8400000-0000-4000-8000-000000000001',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000001',
      'own_visit',
      ' Visit photo ',
      'Visit.JPG',
      'image/jpeg',
      1024,
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  'owner reserves a private Venue original'
);
select is(
  (
    select upload_status || ':' || storage_path
    from public.media
    where id = 'd8200000-0000-4000-8000-000000000001'
  ),
  'pending:d8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d8200000-0000-4000-8000-000000000001/original',
  'reservation stores pending metadata at the server-generated opaque path'
);
select is(
  (
    select count(*)::integer
    from public.media_links
    where id = 'd8300000-0000-4000-8000-000000000001'
      and media_id = 'd8200000-0000-4000-8000-000000000001'
      and target_id = 'd8100000-0000-4000-8000-000000000001'
  ),
  1,
  'original reservation atomically creates its Venue gallery link'
);
select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd8400000-0000-4000-8000-000000000001',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000001',
      'own_visit',
      ' Visit photo ',
      'Visit.JPG',
      'image/jpeg',
      1024,
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  'same operation and canonical payload replays successfully'
);
select is(
  (
    select count(*)::integer
    from public.activity_log
    where project_id = 'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and event_type = 'venue_private_media_reserve_original'
      and operation_id = 'd8400000-0000-4000-8000-000000000001'
  ),
  1,
  'replay keeps one durable operation record'
);
select throws_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd8400000-0000-4000-8000-000000000001',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000001',
      'own_visit',
      'different caption',
      'Visit.JPG',
      'image/jpeg',
      1024,
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  '23505',
  'venue private media conflict',
  'same operation identity with a different payload conflicts'
);
select throws_ok(
  $$
    select public.manage_venue_private_media(
      'finalize_original',
      'd8400000-0000-4000-8000-000000000002',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001'
    )
  $$,
  '55000',
  'venue private media object unavailable',
  'finalize refuses a pending reservation without its exact Storage object'
);

reset role;
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d8200000-0000-4000-8000-000000000001/original'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d8111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'finalize_original',
      'd8400000-0000-4000-8000-000000000003',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001'
    )
  $$,
  'finalize succeeds after the exact Storage object exists'
);
select is(
  (select upload_status from public.media where id = 'd8200000-0000-4000-8000-000000000001'),
  'ready',
  'finalize transitions pending to ready'
);
select lives_ok(
  $$
    select public.manage_venue_private_media(
      'finalize_original',
      'd8400000-0000-4000-8000-000000000004',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000001'
    )
  $$,
  'finalizing an already-ready identical reservation succeeds'
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_derivative',
      'd8400000-0000-4000-8000-000000000005',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000002',
      null,
      null,
      null,
      null,
      null,
      'image/png',
      512,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      16,
      16,
      'd8200000-0000-4000-8000-000000000001',
      'thumbnail',
      1
    )
  $$,
  'ready private original may receive a derivative reservation'
);
select is(
  (
    select storage_path
    from public.media
    where id = 'd8200000-0000-4000-8000-000000000002'
  ),
  'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d8200000-0000-4000-8000-000000000002/thumbnail-v1',
  'derivative path is server-generated from media identity, kind and version'
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd8400000-0000-4000-8000-000000000006',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000003',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000003',
      'own_visit',
      null,
      'Abandon.webp',
      'image/webp',
      256,
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      8,
      8,
      null,
      null,
      null
    )
  $$,
  'second pending original is reservable for abandon coverage'
);
select lives_ok(
  $$
    select public.manage_venue_private_media(
      'abandon_original',
      'd8400000-0000-4000-8000-000000000007',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000003',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000003'
    )
  $$,
  'pending original may be abandoned when its Storage object is absent'
);
select is(
  (select count(*)::integer from public.media where id = 'd8200000-0000-4000-8000-000000000003'),
  0,
  'abandon removes pending metadata and its cascading link'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d8222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd8400000-0000-4000-8000-000000000008',
      'd8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd8200000-0000-4000-8000-000000000004',
      'd8100000-0000-4000-8000-000000000001',
      'd8300000-0000-4000-8000-000000000004',
      'own_visit',
      null,
      'Denied.jpg',
      'image/jpeg',
      128,
      'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
      4,
      4,
      null,
      null,
      null
    )
  $$,
  '42501',
  'venue private media unavailable',
  'viewer cannot reserve private media without live media.write'
);

select * from finish();
rollback;
