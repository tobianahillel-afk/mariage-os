begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'ec111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'wp29c-owner@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.9C trusted-ingest RED project',
  'ec111111-1111-4111-8111-111111111111',
  'ec111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'ec111111-1111-4111-8111-111111111111',
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
  '{"sub":"ec111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- 1: reservation remains an authenticated protected-DB operation.
select lives_ok(
  $$select public.manage_private_document(
    'reserve_upload', 'ec500000-0000-4000-8000-000000000001',
    'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ec300000-0000-4000-8000-000000000001',
    null, null, null, 'venue_contract', 'Trusted ingest RED',
    'trusted-ingest.pdf', 'application/pdf', 64,
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    null
  )$$,
  'authorized writer can reserve pending Document metadata'
);

-- 2: ordinary authenticated clients must not create Document original objects
-- directly; only the trusted WP-2.9C server-ingest boundary may create this
-- namespace.
select ok(
  not pg_temp.try_storage_insert(
    'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/ec300000-0000-4000-8000-000000000001/original'
  ),
  'ordinary authenticated writer cannot directly insert a Document original object'
);

-- Inject the exact object with privileged Storage authority but deliberately do
-- not create the trusted-ingest attestation. This separates "object exists"
-- from "the trusted server independently verified these reserved bytes".
reset role;
set local role service_role;
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/documents/ec300000-0000-4000-8000-000000000001/original'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ec111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

-- 3: privileged object presence alone is still not trusted evidence. The
-- pending -> ready transition requires the service-only verified-ingest proof.
select throws_ok(
  $$select public.manage_private_document(
    'finalize_upload', 'ec500000-0000-4000-8000-000000000002',
    'ecaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ec300000-0000-4000-8000-000000000001'
  )$$,
  '55000',
  'private document object unavailable',
  'untrusted object presence alone cannot satisfy pending-to-ready finalization'
);

reset role;
select * from finish();
rollback;
