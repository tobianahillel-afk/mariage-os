begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'd9111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp28b-storage-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd9222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp28b-storage-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B Storage reservation project',
  'd9111111-1111-4111-8111-111111111111',
  'd9111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('d9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd9111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('d9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd9222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'd9100000-0000-4000-8000-000000000001',
  'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP28BS',
  'WP-2.8B Storage reservation venue',
  'research',
  'd9111111-1111-4111-8111-111111111111',
  'd9111111-1111-4111-8111-111111111111'
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

create function pg_temp.try_storage_rename(old_name text, new_name text)
returns boolean
language plpgsql
as $$
declare
  changed_rows integer;
begin
  update storage.objects
  set name = new_name
  where bucket_id = 'project-private'
    and name = old_name;
  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
exception
  when insufficient_privilege then return false;
end;
$$;

create function pg_temp.try_storage_delete(object_name text)
returns boolean
language plpgsql
as $$
declare
  changed_rows integer;
begin
  delete from storage.objects
  where bucket_id = 'project-private'
    and name = object_name;
  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
exception
  when insufficient_privilege then return false;
end;
$$;

select set_config('storage.allow_delete_query', 'true', true);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd9400000-0000-4000-8000-000000000001',
      'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd9200000-0000-4000-8000-000000000001',
      'd9100000-0000-4000-8000-000000000001',
      'd9300000-0000-4000-8000-000000000001',
      'own_visit',
      'Storage RED photo',
      'Storage-Red.JPG',
      'image/jpeg',
      1024,
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  'writer can reserve the first private original'
);

select ok(
  pg_temp.try_storage_insert(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
  ),
  'writer may upload at the exact pending reservation path'
);

select ok(
  not pg_temp.try_storage_insert(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000099/original'
  ),
  'valid namespace knowledge without a pending media reservation is insufficient for upload'
);
select ok(
  not pg_temp.try_storage_insert(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/preview-v1'
  ),
  'a pending media reservation authorizes only its exact reserved Storage path'
);

reset role;
delete from storage.objects
where bucket_id = 'project-private'
  and name in (
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000099/original',
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/preview-v1'
  );
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select ok(
  not pg_temp.try_storage_rename(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original',
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/thumbnail-v1'
  ),
  'private media objects cannot be renamed or replaced through Storage UPDATE'
);

reset role;
update storage.objects
set name = 'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
where bucket_id = 'project-private'
  and name = 'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/thumbnail-v1';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
  ),
  1,
  'writer may observe the exact pending object for recovery/finalization'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d9222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
  ),
  0,
  'media.read-only viewer cannot read an uncommitted pending private object'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select lives_ok(
  $$
    select public.manage_venue_private_media(
      'finalize_original',
      'd9400000-0000-4000-8000-000000000002',
      'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd9200000-0000-4000-8000-000000000001'
    )
  $$,
  'writer finalizes after the exact reserved object exists'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d9222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
  ),
  1,
  'media.read viewer may read the finalized ready private object'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select ok(
  not pg_temp.try_storage_delete(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000001/original'
  ),
  'ready private binary is terminal and cannot be deleted directly in WP-2.8B'
);

select lives_ok(
  $$
    select public.manage_venue_private_media(
      'reserve_original',
      'd9400000-0000-4000-8000-000000000003',
      'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd9200000-0000-4000-8000-000000000002',
      'd9100000-0000-4000-8000-000000000001',
      'd9300000-0000-4000-8000-000000000002',
      'own_visit',
      'Cleanup photo',
      'Cleanup.PNG',
      'image/png',
      2048,
      'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
      32,
      32,
      null,
      null,
      null
    )
  $$,
  'writer can reserve a second pending original for cleanup recovery'
);
select ok(
  pg_temp.try_storage_insert(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000002/original'
  ),
  'pending cleanup reservation accepts its exact upload path'
);
select ok(
  pg_temp.try_storage_delete(
    'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/d9200000-0000-4000-8000-000000000002/original'
  ),
  'writer may delete only a pending reserved object for explicit cleanup'
);
select lives_ok(
  $$
    select public.manage_venue_private_media(
      'abandon_original',
      'd9400000-0000-4000-8000-000000000004',
      'd9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'd9200000-0000-4000-8000-000000000002'
    )
  $$,
  'pending reservation can be abandoned after exact-path Storage cleanup'
);

reset role;
select * from finish();
rollback;
