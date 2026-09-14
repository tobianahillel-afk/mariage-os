begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

-- 1
select ok(
  (select relrowsecurity from pg_class where oid = 'public.documents'::regclass),
  'documents has RLS enabled'
);
-- 2
select ok(
  (select relrowsecurity from pg_class where oid = 'public.document_links'::regclass),
  'document_links has RLS enabled'
);
-- 3
select ok(
  not has_table_privilege('authenticated', 'public.documents', 'INSERT'),
  'authenticated cannot directly insert document metadata'
);
-- 4
select ok(
  not has_table_privilege('authenticated', 'public.documents', 'UPDATE'),
  'authenticated cannot directly update document metadata'
);
-- 5
select ok(
  not has_table_privilege('authenticated', 'public.documents', 'DELETE'),
  'authenticated cannot directly delete document metadata'
);
-- 6
select ok(
  not has_table_privilege('authenticated', 'public.document_links', 'INSERT'),
  'authenticated cannot directly insert document links'
);
-- 7
select ok(
  not has_table_privilege('authenticated', 'public.document_links', 'UPDATE'),
  'authenticated cannot directly update document links'
);
-- 8
select ok(
  not has_table_privilege('authenticated', 'public.document_links', 'DELETE'),
  'authenticated cannot directly delete document links'
);
-- 9
select ok(
  has_function_privilege(
    'authenticated',
    'public.manage_private_document(text,uuid,uuid,uuid,uuid,uuid,bigint,text,text,text,text,bigint,text,uuid)',
    'EXECUTE'
  ),
  'authenticated reaches only the protected document command boundary'
);
-- 10
select ok(
  not has_function_privilege(
    'anon',
    'public.manage_private_document(text,uuid,uuid,uuid,uuid,uuid,bigint,text,text,text,text,bigint,text,uuid)',
    'EXECUTE'
  ),
  'anonymous role cannot execute private document command'
);
-- 11
select ok(
  not has_function_privilege(
    'authenticated', 'public.private_document_assert_writer(uuid)', 'EXECUTE'
  ),
  'authenticated cannot call private writer authorization helper directly'
);
-- 12
select ok(
  not has_function_privilege(
    'authenticated',
    'public.private_document_replay_receipt(uuid,text,uuid,uuid,jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot call private replay helper directly'
);
-- 13
select ok(
  not has_function_privilege(
    'authenticated',
    'public.private_document_record_operation(uuid,text,uuid,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot forge private document activity receipts'
);
-- 14
select ok(
  (
    select p.prosecdef
      and p.proconfig = array['search_path=pg_catalog']::text[]
    from pg_proc p
    where p.oid = 'public.manage_private_document(text,uuid,uuid,uuid,uuid,uuid,bigint,text,text,text,text,bigint,text,uuid)'::regprocedure
  ),
  'protected document command is SECURITY DEFINER with fixed pg_catalog search path'
);
-- 15
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
  3,
  'project-private keeps select/insert/delete only after Documents extension'
);
-- 16
select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'project_private_media_update'
  ),
  0,
  'no Storage UPDATE policy exists for overwrite or rename'
);
-- 17
select ok(
  not has_function_privilege(
    'authenticated',
    'public.attest_private_document_ingest(uuid,uuid,text,bigint)',
    'EXECUTE'
  ),
  'authenticated cannot forge trusted private-document ingest attestations'
);
-- 18
select ok(
  has_function_privilege(
    'service_role',
    'public.attest_private_document_ingest(uuid,uuid,text,bigint)',
    'EXECUTE'
  ),
  'service role alone may call the trusted ingest attestation boundary'
);
-- 19
select ok(
  (
    select p.prosecdef
      and p.proconfig = array['search_path=pg_catalog']::text[]
    from pg_proc p
    where p.oid = 'public.attest_private_document_ingest(uuid,uuid,text,bigint)'::regprocedure
  ),
  'trusted ingest attestation is SECURITY DEFINER with fixed pg_catalog search path'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'ea111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'wp29a-live-auth@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.9A live authorization project',
  'ea111111-1111-4111-8111-111111111111',
  'ea111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'ea111111-1111-4111-8111-111111111111',
  'owner', 'active', now(), null
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

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
-- 20
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'ea500000-0000-4000-8000-000000000001',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Authorization probe',
    'probe.pdf', 'application/pdf', 64,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    null
  )$$,
  'owner with live documents.write may reserve upload'
);
-- 21
select ok(
  not pg_temp.try_storage_insert(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/ea300000-0000-4000-8000-000000000001/original'
  ),
  'owner cannot bypass trusted server ingestion with direct Document Storage INSERT'
);

reset role;
set local role service_role;
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/ea300000-0000-4000-8000-000000000001/original'
);
select public.attest_private_document_ingest(
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'ea300000-0000-4000-8000-000000000001',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  64
);
reset role;

update public.project_members
set role_key = 'viewer'
where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'ea111111-1111-4111-8111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
-- 22
select throws_ok(
  $$select public.manage_private_document(
    'finalize_upload', 'ea500000-0000-4000-8000-000000000002',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea300000-0000-4000-8000-000000000001'
  )$$,
  '42501', 'private document unavailable',
  'live role downgrade revokes documents.write before finalize'
);
-- 23
select is(
  (select count(*)::integer from public.documents where id = 'ea300000-0000-4000-8000-000000000001'),
  0,
  'downgraded documents.read-only viewer cannot observe pending metadata'
);

reset role;
select * from finish();
rollback;
