begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'fa111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp28b-accept-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'fa222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp28b-accept-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B acceptance project',
  'fa111111-1111-4111-8111-111111111111',
  'fa111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'fa111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'fa222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'fa100000-0000-4000-8000-000000000001',
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP28BACCEPT',
  'WP-2.8B acceptance venue',
  'research',
  'fa111111-1111-4111-8111-111111111111',
  'fa111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_storage_insert(object_name text)
returns boolean
language plpgsql
as $$
begin
  insert into storage.objects (bucket_id, name)
  values ('project-private', object_name);
  return true;
exception
  when insufficient_privilege then return false;
end;
$$;

create function pg_temp.reserve_original(
  operation_id uuid,
  media_id uuid,
  link_id uuid,
  original_filename text,
  sha text
)
returns void
language plpgsql
as $$
begin
  perform public.manage_venue_private_media(
    'reserve_original',
    operation_id,
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    media_id,
    'fa100000-0000-4000-8000-000000000001',
    link_id,
    'own_visit',
    'Private acceptance image',
    original_filename,
    'image/jpeg',
    128,
    sha,
    4,
    4,
    null,
    null,
    null
  );
end;
$$;

create function pg_temp.reserve_derivative(
  operation_id uuid,
  media_id uuid,
  parent_id uuid,
  derivative_version integer,
  sha text
)
returns void
language plpgsql
as $$
begin
  perform public.manage_venue_private_media(
    'reserve_derivative',
    operation_id,
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    media_id,
    null,
    null,
    null,
    null,
    null,
    'image/jpeg',
    64,
    sha,
    2,
    2,
    parent_id,
    'thumbnail',
    derivative_version
  );
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"fa111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- ACC-055, interruption before binary upload: pending is recovery state only.
select lives_ok(
  $$select pg_temp.reserve_original(
    'fa400000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'fa300000-0000-4000-8000-000000000001',
    'Interrupted_Before_Upload.jpg',
    '1111111111111111111111111111111111111111111111111111111111111111'
  )$$,
  'ACC-055 can persist a pending reservation before upload'
);
select is(
  (select upload_status from public.media where id = 'fa200000-0000-4000-8000-000000000001'),
  'pending',
  'ACC-055 pre-upload interruption is pending, never Ready'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select count(*)::integer from public.media where id = 'fa200000-0000-4000-8000-000000000001'),
  0,
  'ACC-055 viewer does not receive pre-upload pending media as committed truth'
);
select is(
  (select count(*)::integer from public.media_links where media_id = 'fa200000-0000-4000-8000-000000000001'),
  0,
  'ACC-055 viewer does not receive the pending gallery link'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'abandon_original',
    'fa400000-0000-4000-8000-000000000002',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'fa100000-0000-4000-8000-000000000001',
    'fa300000-0000-4000-8000-000000000001'
  )$$,
  'ACC-055 pre-upload orphan has a clean abandon path after confirmed absence'
);
select is(
  (select count(*)::integer from public.media where id = 'fa200000-0000-4000-8000-000000000001'),
  0,
  'ACC-055 abandon removes the pending media reservation'
);
select is(
  (select count(*)::integer from public.media_links where id = 'fa300000-0000-4000-8000-000000000001'),
  0,
  'ACC-055 abandon removes its pending Venue gallery link'
);

-- ACC-055, interruption after Storage succeeds but before finalize.
select lives_ok(
  $$select pg_temp.reserve_original(
    'fa400000-0000-4000-8000-000000000003',
    'fa200000-0000-4000-8000-000000000002',
    'fa300000-0000-4000-8000-000000000002',
    'Photo_NomPrive.jpg',
    '2222222222222222222222222222222222222222222222222222222222222222'
  )$$,
  'ACC-055 reserves the original used for post-upload interruption recovery'
);
select ok(
  pg_temp.try_storage_insert(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original'
  ),
  'ACC-055 exact reserved binary object can exist before metadata finalization'
);
select is(
  (select upload_status from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  'pending',
  'ACC-055 Storage success without finalize still remains pending'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select count(*)::integer from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  0,
  'ACC-055 viewer cannot see post-upload pre-finalize metadata'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original'
  ),
  0,
  'ACC-055 viewer cannot retrieve the post-upload pending binary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_original',
    'fa400000-0000-4000-8000-000000000004',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000002'
  )$$,
  'ACC-055 post-upload interruption recovers by retrying finalize on the same object'
);
select is(
  (select upload_status from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  'ready',
  'ACC-055 recovered original becomes Ready only after finalization'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (select count(*)::integer from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  1,
  'ACC-055 ready original becomes committed media for an authorized viewer'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original'
  ),
  1,
  'ACC-055 ready binary becomes readable after successful finalization'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"fa111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- ACC-058: filename is private metadata, never Storage path identity.
select is(
  (select original_filename from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  'Photo_NomPrive.jpg',
  'ACC-058 preserves the original filename as authorized metadata'
);
select is(
  (select storage_path from public.media where id = 'fa200000-0000-4000-8000-000000000002'),
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original',
  'ACC-058 uses the opaque canonical ID path for the original'
);
select ok(
  position(
    'NomPrive' in (select storage_path from public.media where id = 'fa200000-0000-4000-8000-000000000002')
  ) = 0,
  'ACC-058 private filename content is absent from the Storage object path'
);

-- ACC-056: derivative regeneration appends v2 and leaves original + v1 intact.
select lives_ok(
  $$select pg_temp.reserve_derivative(
    'fa400000-0000-4000-8000-000000000005',
    'fa200000-0000-4000-8000-000000000010',
    'fa200000-0000-4000-8000-000000000002',
    1,
    '3333333333333333333333333333333333333333333333333333333333333333'
  )$$,
  'ACC-056 reserves thumbnail v1 as a separate derivative row'
);
select ok(
  pg_temp.try_storage_insert(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000010/thumbnail-v1'
  ),
  'ACC-056 uploads thumbnail v1 at its versioned derivative path'
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_derivative',
    'fa400000-0000-4000-8000-000000000006',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000010'
  )$$,
  'ACC-056 finalizes thumbnail v1'
);
select lives_ok(
  $$select pg_temp.reserve_derivative(
    'fa400000-0000-4000-8000-000000000007',
    'fa200000-0000-4000-8000-000000000011',
    'fa200000-0000-4000-8000-000000000002',
    2,
    '4444444444444444444444444444444444444444444444444444444444444444'
  )$$,
  'ACC-056 regeneration reserves thumbnail v2 as a new row'
);
select ok(
  pg_temp.try_storage_insert(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000011/thumbnail-v2'
  ),
  'ACC-056 uploads thumbnail v2 without overwriting v1'
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_derivative',
    'fa400000-0000-4000-8000-000000000008',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000011'
  )$$,
  'ACC-056 finalizes thumbnail v2 independently'
);
select is(
  (
    select storage_path || '|' || sha256
    from public.media
    where id = 'fa200000-0000-4000-8000-000000000002'
  ),
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original|2222222222222222222222222222222222222222222222222222222222222222',
  'ACC-056 original path and exact-byte hash identity remain unchanged after v2'
);
select is(
  (
    select count(*)::integer
    from public.media
    where derivative_of_id = 'fa200000-0000-4000-8000-000000000002'
      and derivative_kind = 'thumbnail'
      and upload_status = 'ready'
  ),
  2,
  'ACC-056 both ready derivative versions are retained'
);
select is(
  (
    select count(*)::integer
    from public.media
    where id = 'fa200000-0000-4000-8000-000000000010'
      and derivative_version = 1
      and upload_status = 'ready'
  ),
  1,
  'ACC-056 thumbnail v1 remains ready after v2 regeneration'
);
select is(
  (
    select count(*)::integer
    from public.media
    where id = 'fa200000-0000-4000-8000-000000000011'
      and derivative_version = 2
      and upload_status = 'ready'
  ),
  1,
  'ACC-056 thumbnail v2 is independently ready'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000002/original'
  ),
  1,
  'ACC-056 original Storage object identity remains present exactly once'
);
select is(
  (
    select count(distinct storage_path)::integer
    from public.media
    where derivative_of_id = 'fa200000-0000-4000-8000-000000000002'
      and derivative_kind = 'thumbnail'
      and upload_status = 'ready'
  ),
  2,
  'ACC-056 v1 and v2 use distinct immutable derivative paths'
);

reset role;
select * from finish();
rollback;
