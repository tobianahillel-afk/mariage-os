begin;

create extension if not exists pgtap with schema extensions;
select plan(43);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e9111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp29a-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e9222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp29a-viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e9333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'wp29a-foreign-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP-2.9A Project A', 'e9111111-1111-4111-8111-111111111111', 'e9111111-1111-4111-8111-111111111111'),
  ('e9bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'WP-2.9A Project B', 'e9333333-3333-4333-8333-333333333333', 'e9333333-3333-4333-8333-333333333333');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e9111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e9222222-2222-4222-8222-222222222222', 'viewer', 'active', now(), null),
  ('e9bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e9333333-3333-4333-8333-333333333333', 'owner', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('e9100000-0000-4000-8000-000000000001', 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP29A1', 'Venue A1', 'research', 'e9111111-1111-4111-8111-111111111111', 'e9111111-1111-4111-8111-111111111111'),
  ('e9100000-0000-4000-8000-000000000002', 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP29A2', 'Venue A2', 'research', 'e9111111-1111-4111-8111-111111111111', 'e9111111-1111-4111-8111-111111111111'),
  ('e9100000-0000-4000-8000-000000000003', 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP29A3', 'Venue A3', 'research', 'e9111111-1111-4111-8111-111111111111', 'e9111111-1111-4111-8111-111111111111'),
  ('e9100000-0000-4000-8000-000000000004', 'e9bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'WP29AB', 'Venue B', 'research', 'e9333333-3333-4333-8333-333333333333', 'e9333333-3333-4333-8333-333333333333');

insert into public.sources (
  id, project_id, source_type, title, evidence_level, status, created_by, updated_by
)
values
  ('e9200000-0000-4000-8000-000000000001', 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'contract', 'Project A contract source', 'contractual', 'active', 'e9111111-1111-4111-8111-111111111111', 'e9111111-1111-4111-8111-111111111111'),
  ('e9200000-0000-4000-8000-000000000002', 'e9bbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'contract', 'Project B contract source', 'contractual', 'active', 'e9333333-3333-4333-8333-333333333333', 'e9333333-3333-4333-8333-333333333333');

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

create function pg_temp.try_storage_delete(object_name text)
returns boolean
language plpgsql
as $$
declare
  changed_rows integer;
begin
  delete from storage.objects
  where bucket_id = 'project-private' and name = object_name;
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
  '{"sub":"e9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- 1
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'e9500000-0000-4000-8000-000000000001',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Venue A contract',
    'Contrat Salle A.PDF', 'application/pdf', 128,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'e9200000-0000-4000-8000-000000000001'
  )$$,
  'writer reserves private PDF metadata before binary upload'
);
-- 2
select is(
  (select upload_status from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  'pending',
  'reserved document is pending recovery state'
);
-- 3
select is(
  (select original_filename from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  'Contrat Salle A.PDF',
  'original filename is preserved only as metadata'
);
-- 4
select is(
  (select storage_path from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original',
  'Storage identity is opaque and UUID-derived'
);
-- 5
select ok(
  position(
    'Contrat Salle A.PDF' in
    (select storage_path from public.documents where id = 'e9300000-0000-4000-8000-000000000001')
  ) = 0,
  'display filename never enters Storage path identity'
);
-- 6
select ok(
  pg_temp.try_storage_insert(
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  'writer may upload only at exact pending reservation path'
);
-- 7
select ok(
  not pg_temp.try_storage_insert(
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000099/original'
  ),
  'namespace knowledge without pending reservation does not authorize upload'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
-- 8
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  0,
  'documents.read viewer cannot observe pending metadata'
);
-- 9
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  0,
  'documents.read viewer cannot observe pending private binary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
-- 10
select is(
  (public.manage_private_document(
    'reserve_upload', 'e9500000-0000-4000-8000-000000000001',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Venue A contract',
    'Contrat Salle A.PDF', 'application/pdf', 128,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'e9200000-0000-4000-8000-000000000001'
  ) ->> 'replayed'),
  'true',
  'exact reserve operation replay returns stored receipt snapshot'
);
-- 11
select throws_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'e9500000-0000-4000-8000-000000000001',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Changed title',
    'Contrat Salle A.PDF', 'application/pdf', 128,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'e9200000-0000-4000-8000-000000000001'
  )$$,
  '23505', 'private document conflict',
  'semantic reuse of an operation id fails closed'
);
-- 12
select lives_ok(
  $$select public.manage_private_document(
    'finalize_upload', 'e9500000-0000-4000-8000-000000000002',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001'
  )$$,
  'writer finalizes only after exact reserved object exists'
);
-- 13
select is(
  (select upload_status from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  'ready',
  'finalization commits ready document truth'
);
-- 14
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  2::bigint,
  'finalization advances optimistic revision'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
-- 15
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  1,
  'documents.read viewer sees ready active metadata'
);
-- 16
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  1,
  'documents.read viewer sees ready active binary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
-- 17
select ok(
  not pg_temp.try_storage_delete(
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  'ready private binary is immutable and cannot be deleted directly'
);
-- 18
select lives_ok(
  $$select public.manage_private_document(
    'link_venue', 'e9500000-0000-4000-8000-000000000003',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    'e9100000-0000-4000-8000-000000000001',
    'e9400000-0000-4000-8000-000000000001', 2
  )$$,
  'ready document links to first same-project Venue'
);
-- 19
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  3::bigint,
  'first Venue link advances revision'
);
-- 20
select lives_ok(
  $$select public.manage_private_document(
    'link_venue', 'e9500000-0000-4000-8000-000000000004',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    'e9100000-0000-4000-8000-000000000002',
    'e9400000-0000-4000-8000-000000000002', 3
  )$$,
  'same document links to a second Venue without binary duplication'
);
-- 21
select is(
  (select count(*)::integer from public.document_links where document_id = 'e9300000-0000-4000-8000-000000000001'),
  2,
  'two Venue links point at one logical document'
);
-- 22
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  1,
  'multi-Venue linking does not duplicate document metadata'
);
-- 23
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  1,
  'multi-Venue linking does not duplicate binary object'
);
-- 24
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  4::bigint,
  'second Venue link advances revision exactly once'
);
-- 25
select throws_ok(
  $$select public.manage_private_document(
    'link_venue', 'e9500000-0000-4000-8000-000000000005',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    'e9100000-0000-4000-8000-000000000003',
    'e9400000-0000-4000-8000-000000000003', 3
  )$$,
  '40001', 'stale private document',
  'stale expected revision cannot create a new link'
);
-- 26
select throws_ok(
  $$select public.manage_private_document(
    'link_venue', 'e9500000-0000-4000-8000-000000000006',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    'e9100000-0000-4000-8000-000000000004',
    'e9400000-0000-4000-8000-000000000004', 4
  )$$,
  '42501', 'private document unavailable',
  'foreign-project Venue injection fails without disclosure'
);
-- 27
select lives_ok(
  $$select public.manage_private_document(
    'unlink_venue', 'e9500000-0000-4000-8000-000000000007',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    'e9100000-0000-4000-8000-000000000001',
    'e9400000-0000-4000-8000-000000000001', 4
  )$$,
  'writer unlinks one Venue with current revision'
);
-- 28
select is(
  (select count(*)::integer from public.document_links where document_id = 'e9300000-0000-4000-8000-000000000001'),
  1,
  'unlink removes only the requested Venue link'
);
-- 29
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  5::bigint,
  'unlink advances revision exactly once'
);
-- 30
select lives_ok(
  $$select public.manage_private_document(
    'soft_delete', 'e9500000-0000-4000-8000-000000000008',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    null, null, 5
  )$$,
  'writer soft-deletes ready document metadata'
);
-- 31
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  6::bigint,
  'soft-delete advances revision and preserves binary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
-- 32
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  0,
  'documents.read viewer cannot see soft-deleted metadata'
);
-- 33
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  0,
  'documents.read viewer cannot see soft-deleted binary'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e9111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
-- 34
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  1,
  'documents.write member retains deleted metadata for recovery'
);
-- 35
select is(
  (
    select count(*)::integer from storage.objects
    where bucket_id = 'project-private'
      and name = 'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/e9300000-0000-4000-8000-000000000001/original'
  ),
  1,
  'documents.write member retains deleted binary for restore'
);
-- 36
select lives_ok(
  $$select public.manage_private_document(
    'restore', 'e9500000-0000-4000-8000-000000000009',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000001',
    null, null, 6
  )$$,
  'writer restores soft-deleted document'
);
-- 37
select is(
  (select revision from public.documents where id = 'e9300000-0000-4000-8000-000000000001'),
  7::bigint,
  'restore advances revision exactly once'
);

-- 38
select throws_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'e9500000-0000-4000-8000-000000000010',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000002',
    null, null, null, 'venue_contract', 'Foreign source attempt',
    'foreign-source.pdf', 'application/pdf', 64,
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    'e9200000-0000-4000-8000-000000000002'
  )$$,
  '42501', 'private document unavailable',
  'foreign-project Source injection fails without disclosure'
);
-- 39
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'e9500000-0000-4000-8000-000000000011',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000003',
    null, null, null, 'venue_quote', 'Missing binary',
    'missing.pdf', 'application/pdf', 64,
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    null
  )$$,
  'writer may reserve another pending document'
);
-- 40
select throws_ok(
  $$select public.manage_private_document(
    'finalize_upload', 'e9500000-0000-4000-8000-000000000012',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000003'
  )$$,
  '55000', 'private document object unavailable',
  'finalization cannot commit truth before binary exists'
);
-- 41
select lives_ok(
  $$select public.manage_private_document(
    'abandon_upload', 'e9500000-0000-4000-8000-000000000013',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000003'
  )$$,
  'pending reservation with no object can be abandoned cleanly'
);
-- 42
select is(
  (select count(*)::integer from public.documents where id = 'e9300000-0000-4000-8000-000000000003'),
  0,
  'abandon removes only pending metadata after binary absence is proven'
);
-- 43
select is(
  (public.manage_private_document(
    'abandon_upload', 'e9500000-0000-4000-8000-000000000013',
    'e9aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e9300000-0000-4000-8000-000000000003'
  ) ->> 'replayed'),
  'true',
  'abandon operation replay returns exact stored absence receipt'
);

reset role;
select * from finish();
rollback;
