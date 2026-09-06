begin;

create extension if not exists pgtap with schema extensions;
select plan(44);

select has_table('public', 'venues', 'venues table exists');
select has_table('public', 'activity_log', 'activity_log table exists');
select has_function('public', 'transition_venue_status', array['uuid', 'uuid', 'text', 'text', 'uuid'], 'protected venue lifecycle command exists');
select ok((select relrowsecurity from pg_class where oid = 'public.venues'::regclass), 'venues has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.activity_log'::regclass), 'activity_log has RLS enabled');
select ok(
  not has_table_privilege('anon', 'public.venues', 'select')
  and not has_table_privilege('anon', 'public.activity_log', 'select'),
  'anonymous role has no venue/history read grants'
);
select ok(
  not has_function_privilege('anon', 'public.transition_venue_status(uuid,uuid,text,text,uuid)', 'execute')
  and has_function_privilege('authenticated', 'public.transition_venue_status(uuid,uuid,text,text,uuid)', 'execute'),
  'lifecycle command is executable only by authenticated client role'
);
select ok(
  has_table_privilege('authenticated', 'public.venues', 'select')
  and not has_table_privilege('authenticated', 'public.venues', 'delete'),
  'authenticated clients may read but cannot hard-delete venue rows'
);
select ok(
  has_column_privilege('authenticated', 'public.venues', 'project_id', 'insert')
  and has_column_privilege('authenticated', 'public.venues', 'name', 'insert')
  and not has_column_privilege('authenticated', 'public.venues', 'id', 'insert')
  and not has_column_privilege('authenticated', 'public.venues', 'status', 'insert')
  and not has_column_privilege('authenticated', 'public.venues', 'created_by', 'insert'),
  'venue insert grant exposes only safe creation fields'
);
select ok(
  has_column_privilege('authenticated', 'public.venues', 'name', 'update')
  and not has_column_privilege('authenticated', 'public.venues', 'project_id', 'update')
  and not has_column_privilege('authenticated', 'public.venues', 'status', 'update')
  and not has_column_privilege('authenticated', 'public.venues', 'rejection_reason', 'update')
  and not has_column_privilege('authenticated', 'public.venues', 'revision', 'update'),
  'ordinary venue update cannot alter ownership, lifecycle or audit columns'
);
select ok(
  has_table_privilege('authenticated', 'public.activity_log', 'select')
  and not has_table_privilege('authenticated', 'public.activity_log', 'insert')
  and not has_table_privilege('authenticated', 'public.activity_log', 'update')
  and not has_table_privilege('authenticated', 'public.activity_log', 'delete'),
  'activity history is not generic client-writable'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Synthetic Project A', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Synthetic Project B', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444');

insert into public.project_members (project_id, user_id, role_key, membership_status, accepted_at, revoked_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '22222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '33333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '44444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '66666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('a1000000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'P2', 'Venue Alpha', 'research', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111'),
  ('b1000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'S10', 'Venue Beta', 'research', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444');

create function pg_temp.try_venue_insert(target_project uuid, target_name text)
returns boolean language plpgsql as $$
begin
  insert into public.venues (project_id, name) values (target_project, target_name);
  return true;
exception when insufficient_privilege or check_violation then return false;
end;
$$;

create function pg_temp.try_venue_name_update(target_id uuid, target_name text)
returns boolean language plpgsql as $$
declare changed_rows integer;
begin
  update public.venues set name = target_name where id = target_id;
  get diagnostics changed_rows = row_count;
  return changed_rows = 1;
exception when insufficient_privilege then return false;
end;
$$;

create function pg_temp.try_direct_status_update(target_id uuid, target_status text)
returns boolean language plpgsql as $$
begin
  update public.venues set status = target_status where id = target_id;
  return true;
exception when insufficient_privilege then return false;
end;
$$;

create function pg_temp.try_venue_delete(target_id uuid)
returns boolean language plpgsql as $$
begin
  delete from public.venues where id = target_id;
  return true;
exception when insufficient_privilege then return false;
end;
$$;

create function pg_temp.try_transition(target_project uuid, target_id uuid, target_status text, target_reason text default null)
returns boolean language plpgsql as $$
begin
  perform public.transition_venue_status(target_project, target_id, target_status, target_reason, gen_random_uuid());
  return true;
exception when insufficient_privilege or invalid_parameter_value then return false;
end;
$$;

set local role anon;
select throws_ok($$select * from public.venues$$, '42501', 'permission denied for table venues', 'anonymous direct venue read is denied at grant layer');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is((select array_agg(id order by id) from public.venues), array['a1000000-0000-4000-8000-000000000001'::uuid], 'project A owner sees only project A venue rows');
select ok(pg_temp.try_venue_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Quick Add Venue'), 'owner may quick-add a venue in own project');
select ok(
  (select status = 'research' and rejection_reason is null from public.venues where name = 'Quick Add Venue'),
  'quick-add venue starts research with unknown detail rather than invented rejection data'
);
select ok(pg_temp.try_venue_name_update('a1000000-0000-4000-8000-000000000001', 'Venue Alpha Renamed'), 'owner may update an ordinary venue field');
select is((select revision from public.venues where id = 'a1000000-0000-4000-8000-000000000001'), 2::bigint, 'ordinary update increments venue revision');
select ok(not pg_temp.try_direct_status_update('a1000000-0000-4000-8000-000000000001', 'shortlist'), 'owner cannot bypass lifecycle command with direct status update');
select ok(not pg_temp.try_venue_delete('a1000000-0000-4000-8000-000000000001'), 'owner cannot hard-delete venue through ordinary API');
select ok(pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'shortlist'), 'owner may explicitly move venue to shortlist');
select is((select status from public.venues where id = 'a1000000-0000-4000-8000-000000000001'), 'shortlist', 'lifecycle command stores requested valid status');
select is((select count(*)::integer from public.activity_log where entity_id = 'a1000000-0000-4000-8000-000000000001'), 1, 'first lifecycle transition creates one retained activity row');
select is((select metadata_json ->> 'previousStatus' from public.activity_log where entity_id = 'a1000000-0000-4000-8000-000000000001'), 'research', 'history records previous lifecycle status');
select ok(pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'shortlist'), 'repeating same explicit transition is idempotent');
select is((select count(*)::integer from public.activity_log where entity_id = 'a1000000-0000-4000-8000-000000000001'), 1, 'same-state retry does not duplicate lifecycle history');
select ok(not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'rejected'), 'rejection without reason is rejected');
select ok(pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'rejected', '  insufficient room  '), 'explicit rejection with reason succeeds');
select is((select rejection_reason from public.venues where id = 'a1000000-0000-4000-8000-000000000001'), 'insufficient room', 'rejection reason is normalized on canonical row');
select is(
  (select metadata_json ->> 'rejectionReason' from public.activity_log where entity_id = 'a1000000-0000-4000-8000-000000000001' order by occurred_at desc, id desc limit 1),
  'insufficient room',
  'rejection history retains the reason'
);
select ok(pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'shortlist'), 'rejected venue can be restored explicitly');
select ok(
  (select rejection_reason is null from public.venues where id = 'a1000000-0000-4000-8000-000000000001')
  and (select metadata_json ->> 'previousRejectionReason' = 'insufficient room' from public.activity_log where entity_id = 'a1000000-0000-4000-8000-000000000001' order by occurred_at desc, id desc limit 1),
  'restore clears current reason while retaining rejection history'
);
select ok(not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'mystery'), 'unknown lifecycle status fails closed');
select ok(not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'shortlist', 'stale reason'), 'non-rejected status cannot carry rejection reason');
select ok(not pg_temp.try_venue_insert('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Cross Project Insert'), 'project A owner cannot insert into project B');
select ok(not pg_temp.try_transition('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b1000000-0000-4000-8000-000000000001', 'shortlist'), 'project A owner cannot transition project B venue');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(pg_temp.try_venue_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Editor Venue'), 'editor may create venue because venues.write is granted');
select ok(pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'contacted'), 'editor may use lifecycle command because venues.write is granted');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok((select count(*) from public.venues) >= 1 and (select count(*) from public.activity_log where entity_type = 'venue') >= 1, 'viewer may read venues and their lifecycle history');
select ok(
  not pg_temp.try_venue_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Viewer Venue')
  and not pg_temp.try_venue_name_update('a1000000-0000-4000-8000-000000000001', 'Viewer Rename')
  and not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'finalist'),
  'viewer cannot create, edit or transition venues'
);

select set_config('request.jwt.claims', '{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select ok(
  (select count(*) from public.venues) = 0
  and (select count(*) from public.activity_log) = 0
  and not pg_temp.try_venue_insert('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Outsider Venue')
  and not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'finalist'),
  'outsider cannot read or mutate known project venue resources'
);

select set_config('request.jwt.claims', '{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select ok(
  (select count(*) from public.venues) = 0
  and not pg_temp.try_transition('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1000000-0000-4000-8000-000000000001', 'finalist'),
  'revoked member loses venue read/write immediately'
);

select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is((select array_agg(id order by id) from public.venues), array['b1000000-0000-4000-8000-000000000001'::uuid], 'project B owner sees only project B venue rows');
select ok(pg_temp.try_transition('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b1000000-0000-4000-8000-000000000001', 'reserve'), 'venue-specific reserve lifecycle state is supported explicitly');
select is((select status from public.venues where id = 'b1000000-0000-4000-8000-000000000001'), 'reserve', 'reserve transition persists for project B venue');

reset role;
select * from finish();
rollback;
