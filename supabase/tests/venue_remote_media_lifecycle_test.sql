begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_column(
  'public', 'media', 'deleted_at',
  'WP-2.8C adds the canonical recoverable media lifecycle marker'
);
select has_function(
  'public',
  'transition_venue_remote_media_lifecycle',
  array['uuid','uuid','text','bigint'],
  'WP-2.8C lifecycle command exists with the frozen signature'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)',
    'execute'
  ),
  'only authenticated clients receive the lifecycle capability'
);
select ok(
  (select p.prosecdef
   from pg_proc p
   where p.oid = 'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)'::regprocedure),
  'lifecycle command is SECURITY DEFINER'
);
select is(
  (select p.proconfig[1]
   from pg_proc p
   where p.oid = 'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)'::regprocedure),
  'search_path=pg_catalog',
  'lifecycle command fixes search_path to pg_catalog'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'f1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'remote-life-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'remote-life-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'remote-life-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'remote-life-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Remote Lifecycle Project A', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Remote Lifecycle Project B', 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'f4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  ('fa100000-0000-4000-8000-000000000001', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'RLA', 'Remote Lifecycle Venue A', 'research', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fb100000-0000-4000-8000-000000000001', 'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'RLB', 'Remote Lifecycle Venue B', 'research', 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

create function pg_temp.lifecycle_sqlstate(
  target_project uuid,
  target_media uuid,
  target_action text,
  target_revision bigint
)
returns text language plpgsql as $$
begin
  perform public.transition_venue_remote_media_lifecycle(
    target_project, target_media, target_action, target_revision
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

-- Create the remote row through the already-accepted WP-2.8A boundary.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  public.create_venue_remote_media(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'fa300000-0000-4000-8000-000000000001',
    'exterior',
    'https://example.com/lifecycle.jpg',
    'https://example.com/lifecycle-source',
    'Lifecycle exterior'
  ) #>> '{media,id}',
  'fa200000-0000-4000-8000-000000000001',
  'accepted A command creates the lifecycle target'
);
reset role;

select ok(
  (select deleted_at is null and revision = 1
   from public.media
   where id = 'fa200000-0000-4000-8000-000000000001'),
  'fresh A remote media starts active at revision 1'
);

-- Viewer and foreign-project identities must not gain a mutation oracle.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'soft_delete',
    1
  ),
  '42501',
  'viewer cannot soft-delete remote media'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'fa200000-0000-4000-8000-000000000001',
    'soft_delete',
    1
  ),
  '42501',
  'foreign-project known media UUID is denied generically'
);
reset role;

-- Editor performs the real delete. The receipt must retain the A payload/link.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select ok(
  (select receipt ->> 'action' = 'soft_delete'
      and receipt ->> 'replayed' = 'false'
      and (receipt #>> '{media,deleted_at}') is not null
      and receipt #>> '{media,revision}' = '2'
      and receipt #>> '{media,remote_url}' = 'https://example.com/lifecycle.jpg'
      and receipt #>> '{media,source_page_url}' = 'https://example.com/lifecycle-source'
      and receipt #>> '{media,caption}' = 'Lifecycle exterior'
      and receipt #>> '{link,id}' = 'fa300000-0000-4000-8000-000000000001'
   from (
     select public.transition_venue_remote_media_lifecycle(
       'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'fa200000-0000-4000-8000-000000000001',
       'soft_delete',
       1
     ) as receipt
   ) s),
  'soft-delete mutates lifecycle/audit state while preserving remote payload and link identity'
);
reset role;

select ok(
  (select deleted_at is not null
      and revision = 2
      and updated_by = 'f2222222-2222-4222-8222-222222222222'
      and remote_url = 'https://example.com/lifecycle.jpg'
      and source_page_url = 'https://example.com/lifecycle-source'
      and category = 'exterior'
      and caption = 'Lifecycle exterior'
   from public.media
   where id = 'fa200000-0000-4000-8000-000000000001'),
  'soft-deleted row remains recoverable with immutable semantic payload'
);
select is(
  (select count(*)::integer
   from public.media_links
   where id = 'fa300000-0000-4000-8000-000000000001'
     and media_id = 'fa200000-0000-4000-8000-000000000001'
     and target_id = 'fa100000-0000-4000-8000-000000000001'),
  1,
  'Venue gallery link is retained across soft-delete'
);

create temporary table remote_media_delete_snapshot as
select deleted_at, updated_at, updated_by, revision
from public.media
where id = 'fa200000-0000-4000-8000-000000000001';

-- Same-target replay accepts an older positive revision and performs no mutation.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  (select receipt ->> 'replayed' = 'true'
      and receipt #>> '{media,revision}' = '2'
      and (receipt #>> '{media,deleted_at}') is not null
   from (
     select public.transition_venue_remote_media_lifecycle(
       'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'fa200000-0000-4000-8000-000000000001',
       'soft_delete',
       1
     ) as receipt
   ) s),
  'same-state delete replay succeeds with the acknowledged old revision'
);
reset role;

select ok(
  (select m.deleted_at = s.deleted_at
      and m.updated_at = s.updated_at
      and m.updated_by = s.updated_by
      and m.revision = s.revision
   from public.media m
   cross join remote_media_delete_snapshot s
   where m.id = 'fa200000-0000-4000-8000-000000000001'),
  'same-state replay does not mutate lifecycle, audit fields or revision'
);

-- A stale revision cannot authorize a real opposite transition.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'restore',
    1
  ),
  '40001',
  'stale expected revision rejects a required restore'
);
select ok(
  (select receipt ->> 'action' = 'restore'
      and receipt ->> 'replayed' = 'false'
      and (receipt #> '{media,deleted_at}') = 'null'::jsonb
      and receipt #>> '{media,revision}' = '3'
      and receipt #>> '{link,id}' = 'fa300000-0000-4000-8000-000000000001'
   from (
     select public.transition_venue_remote_media_lifecycle(
       'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'fa200000-0000-4000-8000-000000000001',
       'restore',
       2
     ) as receipt
   ) s),
  'current revision restores the same media/link identity exactly once'
);
select ok(
  (select receipt ->> 'replayed' = 'true'
      and receipt #>> '{media,revision}' = '3'
      and (receipt #> '{media,deleted_at}') = 'null'::jsonb
   from (
     select public.transition_venue_remote_media_lifecycle(
       'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
       'fa200000-0000-4000-8000-000000000001',
       'restore',
       1
     ) as receipt
   ) s),
  'same-state restore replay succeeds without requiring the historical revision to remain current'
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'purge',
    3
  ),
  '22023',
  'action outside the exact soft_delete/restore allowlist is rejected'
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'soft_delete',
    0
  ),
  '22023',
  'non-positive expected revision is rejected'
);
reset role;

-- Same-project private B-style rows are typed conflicts, never lifecycle targets.
insert into public.media (
  id, project_id, media_type, category, storage_path, remote_url,
  source_page_url, original_filename, mime_type, size_bytes, sha256,
  width_px, height_px, derivative_of_id, is_original, upload_status,
  caption, created_by, updated_by, derivative_kind, derivative_version
)
values (
  'fa200000-0000-4000-8000-000000000099',
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'image',
  'own_visit',
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/fa200000-0000-4000-8000-000000000099/original',
  null,
  null,
  'visit.jpg',
  'image/jpeg',
  100,
  repeat('a', 64),
  10,
  10,
  null,
  true,
  'ready',
  'Private visit',
  'f1111111-1111-4111-8111-111111111111',
  'f1111111-1111-4111-8111-111111111111',
  null,
  null
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000099',
    'soft_delete',
    1
  ),
  '23505',
  'same-project private archived media is rejected as a typed lifecycle conflict'
);
reset role;
select ok(
  (select deleted_at is null and revision = 1 and upload_status = 'ready'
   from public.media
   where id = 'fa200000-0000-4000-8000-000000000099'),
  'rejected private media remains untouched'
);

-- Live permission revocation blocks a later transition using the same identity.
update public.project_members
set membership_status = 'revoked', revoked_at = now()
where project_id = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'f2222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'soft_delete',
    3
  ),
  '42501',
  'same-session identity cannot mutate after its project membership is revoked'
);
reset role;

select * from finish();
rollback;
