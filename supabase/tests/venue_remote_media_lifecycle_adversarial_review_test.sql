begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'remote-life-review-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'remote-life-review-editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'remote-life-review-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Remote lifecycle adversarial review',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'ea100000-0000-4000-8000-000000000001',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'RLCAR',
  'Remote lifecycle adversarial venue',
  'research',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

create function pg_temp.lifecycle_sqlstate(
  target_media uuid,
  target_action text,
  target_revision bigint
)
returns text language plpgsql as $$
begin
  perform public.transition_venue_remote_media_lifecycle(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    target_media,
    target_action,
    target_revision
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.direct_deleted_at_update_sqlstate(target_media uuid)
returns text language plpgsql as $$
begin
  update public.media
  set deleted_at = now()
  where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and id = target_media;
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

select ok(
  not has_table_privilege('authenticated', 'public.media', 'UPDATE')
  and not has_column_privilege(
    'authenticated',
    'public.media',
    'deleted_at',
    'UPDATE'
  ),
  'authenticated clients have no direct media/deleted_at UPDATE grant'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  public.create_venue_remote_media(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000001',
    'exterior',
    'https://example.com/review-lifecycle.jpg',
    'https://example.com/review-lifecycle',
    'Review lifecycle'
  ) #>> '{media,id}',
  'ea200000-0000-4000-8000-000000000001',
  'review fixture is created through the accepted A command'
);
select is(
  (select count(*)::integer
   from public.media_links ml
   join public.media m
     on m.project_id = ml.project_id
    and m.id = ml.media_id
   where ml.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and ml.target_type = 'venue'
     and ml.target_id = 'ea100000-0000-4000-8000-000000000001'
     and ml.relationship_type = 'gallery'
     and m.upload_status = 'ready'
     and m.remote_url is not null
     and m.storage_path is null
     and m.deleted_at is null),
  1,
  'fresh remote media is visible through the active-list predicate under RLS'
);
select is(
  pg_temp.direct_deleted_at_update_sqlstate(
    'ea200000-0000-4000-8000-000000000001'
  ),
  '42501',
  'authenticated client cannot bypass the lifecycle RPC with direct deleted_at UPDATE'
);
select ok(
  (select deleted_at is null and revision = 1
   from public.media
   where id = 'ea200000-0000-4000-8000-000000000001'),
  'denied direct mutation leaves lifecycle state and revision unchanged'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'ea200000-0000-4000-8000-000000000001',
    'soft_delete',
    1
  ),
  '42501',
  'authenticated outsider without project membership cannot mutate lifecycle'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'ea200000-0000-4000-8000-000000000099',
    'soft_delete',
    1
  ),
  '42501',
  'authorized writer receives generic denial for a missing media UUID'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'ea200000-0000-4000-8000-000000000001',
    'soft_delete',
    1
  ),
  '00000',
  'active editor can perform the lifecycle delete'
);
select is(
  (select count(*)::integer
   from public.media_links ml
   join public.media m
     on m.project_id = ml.project_id
    and m.id = ml.media_id
   where ml.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and ml.target_type = 'venue'
     and ml.target_id = 'ea100000-0000-4000-8000-000000000001'
     and ml.relationship_type = 'gallery'
     and m.upload_status = 'ready'
     and m.remote_url is not null
     and m.storage_path is null
     and m.deleted_at is null),
  0,
  'soft-deleted remote media disappears from the active-list predicate under RLS'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'ea200000-0000-4000-8000-000000000001',
    'restore',
    2
  ),
  '00000',
  'owner restores the same media row at the current revision'
);
select is(
  (select count(*)::integer
   from public.media_links ml
   join public.media m
     on m.project_id = ml.project_id
    and m.id = ml.media_id
   where ml.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and ml.media_id = 'ea200000-0000-4000-8000-000000000001'
     and ml.id = 'ea300000-0000-4000-8000-000000000001'
     and ml.target_type = 'venue'
     and ml.target_id = 'ea100000-0000-4000-8000-000000000001'
     and ml.relationship_type = 'gallery'
     and m.id = 'ea200000-0000-4000-8000-000000000001'
     and m.upload_status = 'ready'
     and m.remote_url = 'https://example.com/review-lifecycle.jpg'
     and m.source_page_url = 'https://example.com/review-lifecycle'
     and m.storage_path is null
     and m.deleted_at is null),
  1,
  'restore returns the identical retained media/link identity to the active-list predicate'
);
select ok(
  public.change_project_member_role(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e2222222-2222-4222-8222-222222222222',
    'viewer'
  ),
  'owner downgrades lifecycle editor to viewer through the protected command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.lifecycle_sqlstate(
    'ea200000-0000-4000-8000-000000000001',
    'soft_delete',
    3
  ),
  '42501',
  'same authenticated editor identity loses lifecycle mutation immediately after downgrade'
);
reset role;

select ok(
  position(
    'storage.'
    in lower(
      pg_get_functiondef(
        'public.transition_venue_remote_media_lifecycle(uuid,uuid,text,bigint)'::regprocedure
      )
    )
  ) = 0,
  'remote metadata lifecycle command has no Storage object access path'
);

select * from finish();
rollback;
