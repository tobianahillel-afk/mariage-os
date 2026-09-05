begin;

create extension if not exists pgtap with schema extensions;

select plan(38);

select has_table('storage', 'buckets', 'Supabase Storage buckets table exists');
select is(
  (select public from storage.buckets where id = 'project-private'),
  false,
  'project-private bucket is private'
);
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
        'project_private_media_select',
        'project_private_media_insert',
        'project_private_media_update',
        'project_private_media_delete'
      )
  ),
  4,
  'all four project-private media Storage policies exist'
);
select ok(
  (
    select c.relrowsecurity
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage'
      and c.relname = 'objects'
  ),
  'storage.objects has RLS enabled'
);
select is(
  (
    select count(*)::integer
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
  ),
  0,
  'no public application table is exposed through the Supabase Realtime publication'
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

insert into public.projects (id, name)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Synthetic Project A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Synthetic Project B'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Synthetic Project C');

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

insert into storage.objects (bucket_id, name)
values
  ('project-private', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a1000000-0000-4000-8000-000000000001/original'),
  ('project-private', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/b1000000-0000-4000-8000-000000000001/original'),
  ('project-private', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/media/c1000000-0000-4000-8000-000000000001/original');

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

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.read'),
  'owner receives media.read'
);
select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.write'),
  'owner receives media.write'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.read'),
  'editor receives media.read'
);
select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.write'),
  'editor receives media.write'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select ok(
  public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.read'),
  'viewer receives media.read'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.write'),
  'viewer does not receive media.write'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  1,
  'project A owner sees only project A private object'
);
select ok(
  pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a2000000-0000-4000-8000-000000000002/original'),
  'project A owner may insert a valid project A media path'
);
select ok(
  not pg_temp.try_storage_insert('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/b2000000-0000-4000-8000-000000000002/original'),
  'project A owner cannot insert into a known project B path'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/not-a-uuid/original'),
  'malformed object UUID path fails closed instead of authorizing'
);
select ok(
  pg_temp.try_storage_rename(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a1000000-0000-4000-8000-000000000001/original',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a1000000-0000-4000-8000-000000000001/thumbnail-v1'
  ),
  'project A owner may rename within an authorized valid project A namespace'
);
select ok(
  not pg_temp.try_storage_rename(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a1000000-0000-4000-8000-000000000001/thumbnail-v1',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/a1000000-0000-4000-8000-000000000001/thumbnail-v1'
  ),
  'update WITH CHECK prevents moving an authorized object into project B'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  2,
  'editor sees the two project A objects and no other project objects'
);
select ok(
  pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a3000000-0000-4000-8000-000000000003/original'),
  'editor may insert project A media because media.write is granted'
);
select ok(
  (
    select cmd = 'DELETE'
      and 'authenticated'::name = any(roles)
      and qual like '%project-private%'
      and qual like '%media.write%'
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'project_private_media_delete'
  ),
  'delete policy is bound to authenticated clients and live media.write authorization'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  3,
  'viewer may read project A media'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a4000000-0000-4000-8000-000000000004/original'),
  'viewer cannot insert project A media without media.write'
);
select ok(
  not pg_temp.try_storage_rename(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a2000000-0000-4000-8000-000000000002/original',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a2000000-0000-4000-8000-000000000002/thumbnail-v1'
  ),
  'viewer cannot update project A media without media.write'
);
select ok(
  not public.has_project_permission('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'media.write'),
  'viewer cannot satisfy the media.write permission required by the delete policy'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  4,
  'multi-project member sees only projects A and B, not project C'
);
select ok(
  pg_temp.try_storage_insert('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/b2000000-0000-4000-8000-000000000002/original'),
  'multi-project owner in B may insert project B media'
);
select ok(
  not pg_temp.try_storage_insert('cccccccc-cccc-4ccc-8ccc-cccccccccccc/media/c2000000-0000-4000-8000-000000000002/original'),
  'multi-project identity cannot use a known project C path without membership'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc/media/c1000000-0000-4000-8000-000000000001/original'
  ),
  0,
  'exact project C object path knowledge does not make the object readable'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"77777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  2,
  'project B owner sees only project B objects'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name like 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/%'
  ),
  0,
  'project B owner cannot read project A even with its exact namespace known'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  0,
  'authenticated outsider reads no private project objects'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a5000000-0000-4000-8000-000000000005/original'),
  'authenticated outsider cannot insert into a known project A path'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  0,
  'revoked member reads no private project objects'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a6000000-0000-4000-8000-000000000006/original'),
  'revoked member cannot insert using stale project knowledge'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  0,
  'anonymous client reads no private project objects'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a7000000-0000-4000-8000-000000000007/original'),
  'anonymous client cannot insert into private project Storage'
);
select set_config(
  'request.jwt.claims',
  '{"role":"anon","project_id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","rsvp_token":"synthetic-capability"}',
  true
);
select is(
  (select count(*)::integer from storage.objects where bucket_id = 'project-private'),
  0,
  'guest-like capability claims do not grant private Storage reads'
);
select ok(
  not pg_temp.try_storage_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/a8000000-0000-4000-8000-000000000008/original'),
  'guest-like capability claims do not grant private Storage writes'
);

reset role;
select * from finish();
rollback;
