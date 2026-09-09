begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table(
  'public',
  'venue_access_routes',
  'venue access route history table exists'
);
select has_function(
  'public',
  'append_venue_access_route',
  array[
    'uuid', 'uuid', 'uuid', 'uuid', 'text', 'text', 'text', 'text',
    'integer', 'integer', 'integer', 'text', 'uuid', 'text'
  ],
  'atomic venue access route append command exists'
);
select ok(
  (select relrowsecurity
   from pg_class
   where oid = 'public.venue_access_routes'::regclass),
  'venue access routes have RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.venue_access_routes', 'select')
  and not has_table_privilege('authenticated', 'public.venue_access_routes', 'insert')
  and not has_table_privilege('authenticated', 'public.venue_access_routes', 'update')
  and not has_table_privilege('authenticated', 'public.venue_access_routes', 'delete'),
  'authenticated clients cannot bypass the route RPC mutation boundary'
);
select ok(
  not has_table_privilege('anon', 'public.venue_access_routes', 'select'),
  'anonymous role has no route read grant'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  ),
  'only authenticated clients receive route append capability'
);
select ok(
  (select p.prosecdef
   from pg_proc p
   where p.oid = 'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)'::regprocedure),
  'route append command is SECURITY DEFINER'
);
select ok(
  position(
    'FOR UPDATE' in upper(
      pg_get_functiondef('public.venue_access_route_assert_writer(uuid)'::regprocedure)
    )
  ) < position(
    'HAS_PROJECT_PERMISSION' in upper(
      pg_get_functiondef('public.venue_access_route_assert_writer(uuid)'::regprocedure)
    )
  ),
  'route writer locks the project before live permission evaluation'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'f1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'route-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'route-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'route-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'route-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'route-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'route-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Route Project A', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Route Project B', 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'f4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f6666666-6666-4666-8666-666666666666', 'editor', 'revoked', now(), now());

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  ('fa100000-0000-4000-8000-000000000001', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'RTA', 'Route Venue A', 'research', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fb100000-0000-4000-8000-000000000001', 'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'RTB', 'Route Venue B', 'research', 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

insert into public.project_reference_origins (
  id, project_id, label, address_text, latitude, longitude,
  is_default, sort_order, created_by, updated_by
)
values
  ('fa200000-0000-4000-8000-000000000001', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Paris reference', '1 Rue Test', 48.856600, 2.352200, true, 0, 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fa200000-0000-4000-8000-000000000002', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Home reference', null, null, null, false, 1, 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fb200000-0000-4000-8000-000000000001', 'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Project B reference', '9 Rue B', 43.700000, 7.250000, true, 0, 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

insert into public.sources (
  id, project_id, source_type, title, url, evidence_level, status, created_by, updated_by
)
values
  ('fa300000-0000-4000-8000-000000000001', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'official_website', 'Route source A', 'https://example.invalid/route-a', 'official_general', 'active', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fb300000-0000-4000-8000-000000000001', 'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'official_website', 'Route source B', 'https://example.invalid/route-b', 'official_general', 'active', 'f4444444-4444-4444-8444-444444444444', 'f4444444-4444-4444-8444-444444444444');

create function pg_temp.append_route_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_origin uuid,
  target_route_type text,
  target_origin_label text,
  target_destination_label text,
  target_mode text,
  target_duration integer,
  target_distance integer,
  target_transfers integer,
  target_observed text,
  target_source uuid,
  target_notes text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_access_route(
    target_project, target_venue, target_id, target_origin,
    target_route_type, target_origin_label, target_destination_label,
    target_mode, target_duration, target_distance, target_transfers,
    target_observed, target_source, target_notes
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.delete_origin_sqlstate(target_project uuid, target_origin uuid)
returns text language plpgsql as $$
begin
  perform public.delete_project_reference_origin(target_project, target_origin);
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.try_update_route(target_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  update public.venue_access_routes
  set notes = 'mutated'
  where id = target_id;
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_delete_route(target_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  delete from public.venue_access_routes where id = target_id;
  return true;
exception when others then
  return false;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (public.append_venue_access_route(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue',
    null,
    '  Route Venue A  ',
    'car',
    95,
    123000,
    0,
    '2026-09-09T12:00:00+02:00',
    'fa300000-0000-4000-8000-000000000001',
    '  Initial route observation  '
  )->>'id')::uuid,
  'fa400000-0000-4000-8000-000000000001'::uuid,
  'owner appends a referenced access-route observation'
);

select ok(
  (select
     origin_label = 'Paris reference'
     and destination_label = 'Route Venue A'
     and observed_at = '2026-09-09T10:00:00Z'::timestamptz
     and notes = 'Initial route observation'
     and reference_origin_address_snapshot = '1 Rue Test'
     and reference_origin_latitude_snapshot = 48.856600
     and reference_origin_longitude_snapshot = 2.352200
     and created_by = 'f1111111-1111-4111-8111-111111111111'
     and revision = 1
   from public.venue_access_routes
   where id = 'fa400000-0000-4000-8000-000000000001'),
  'referenced append captures canonical server-owned origin snapshots and canonical caller text'
);

select is(
  (public.append_venue_access_route(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000002',
    null,
    'custom',
    '  Airport terminal  ',
    '  Route Venue A  ',
    'taxi_vtc',
    40,
    35000,
    null,
    '2026-09-09T11:00:00Z',
    null,
    '  Custom route  '
  )->>'id')::uuid,
  'fa400000-0000-4000-8000-000000000002'::uuid,
  'owner appends a custom route without a reference origin'
);
select ok(
  (select
     origin_label = 'Airport terminal'
     and destination_label = 'Route Venue A'
     and reference_origin_address_snapshot is null
     and reference_origin_latitude_snapshot is null
     and reference_origin_longitude_snapshot is null
   from public.venue_access_routes
   where id = 'fa400000-0000-4000-8000-000000000002'),
  'custom routes retain caller-owned origin context and never invent reference-origin snapshots'
);

select is(
  (public.append_venue_access_route(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue',
    null,
    '  Route Venue A  ',
    'car',
    95,
    123000,
    0,
    '2026-09-09T12:00:00+02:00',
    'fa300000-0000-4000-8000-000000000001',
    '  Initial route observation  '
  )->>'id')::uuid,
  'fa400000-0000-4000-8000-000000000001'::uuid,
  'same route UUID and same caller-owned payload replay idempotently'
);
select is(
  (select count(*)::integer
   from public.venue_access_routes
   where id = 'fa400000-0000-4000-8000-000000000001'),
  1,
  'idempotent replay does not append a duplicate row'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Route Venue A', 'car',
    96, 123000, 0, '2026-09-09T10:00:00Z',
    'fa300000-0000-4000-8000-000000000001', 'Initial route observation'
  ),
  '23505',
  'same-project same-ID replay with a different caller payload is a typed conflict'
);

select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000010',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue', 'client override', 'Route Venue A', 'car',
    95, 123000, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '22023',
  'clients cannot supply the historical origin label when a reference origin is used'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000011',
    null,
    'custom', 'Origin', 'Destination', 'car',
    -1, null, null, '2026-09-09T10:00:00Z', null, null
  ),
  '22023',
  'negative route metrics are rejected by the command boundary'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000012',
    null,
    'custom', 'Origin', 'Destination', 'teleport',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '22023',
  'unknown route modes are rejected by the command boundary'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000013',
    null,
    'custom', 'Origin', 'Destination', 'car',
    1, 1, 0, '2026-09-09 10:00:00Z', null, null
  ),
  '22023',
  'non-canonical application instant grammar is rejected'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fb100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000014',
    null,
    'custom', 'Origin', 'Destination', 'car',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '42501',
  'cross-project venue references fail closed'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000015',
    'fb200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Destination', 'car',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '42501',
  'cross-project reference origins fail closed'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000016',
    null,
    'custom', 'Origin', 'Destination', 'car',
    1, 1, 0, '2026-09-09T10:00:00Z',
    'fb300000-0000-4000-8000-000000000001', null
  ),
  '42501',
  'cross-project sources fail closed'
);

select is(
  public.save_project_reference_origin(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001',
    'Paris moved label',
    '2 Rue Test',
    48.857000,
    2.353000,
    true,
    0
  ),
  'fa200000-0000-4000-8000-000000000001'::uuid,
  'reference origin can evolve without rewriting route history'
);
select is(
  (public.append_venue_access_route(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Route Venue A', 'car',
    95, 123000, 0, '2026-09-09T10:00:00Z',
    'fa300000-0000-4000-8000-000000000001', 'Initial route observation'
  )->>'id')::uuid,
  'fa400000-0000-4000-8000-000000000001'::uuid,
  'retry after an origin edit still returns the originally accepted route'
);
select ok(
  (select
     origin_label = 'Paris reference'
     and reference_origin_address_snapshot = '1 Rue Test'
     and reference_origin_latitude_snapshot = 48.856600
     and reference_origin_longitude_snapshot = 2.352200
   from public.venue_access_routes
   where id = 'fa400000-0000-4000-8000-000000000001'),
  'origin edits never mutate accepted historical snapshots'
);
select is(
  (public.append_venue_access_route(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000003',
    'fa200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Route Venue A', 'car',
    92, 122000, 0, '2026-09-09T12:30:00Z',
    'fa300000-0000-4000-8000-000000000001', 'Fresh route observation'
  )->>'id')::uuid,
  'fa400000-0000-4000-8000-000000000003'::uuid,
  'a new observation can be appended after the origin location changes'
);
select ok(
  (select
     origin_label = 'Paris moved label'
     and reference_origin_address_snapshot = '2 Rue Test'
     and reference_origin_latitude_snapshot = 48.857000
     and reference_origin_longitude_snapshot = 2.353000
   from public.venue_access_routes
   where id = 'fa400000-0000-4000-8000-000000000003'),
  'new observations capture the current origin location context'
);
select is(
  pg_temp.delete_origin_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000001'
  ),
  '23503',
  'reference origins cited by route history cannot be physically deleted'
);
select ok(
  exists(
    select 1 from public.project_reference_origins
    where id = 'fa200000-0000-4000-8000-000000000001'
  ),
  'blocked origin deletion preserves the referenced origin row'
);
select ok(
  public.delete_project_reference_origin(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa200000-0000-4000-8000-000000000002'
  ),
  'an unreferenced origin remains deletable'
);
select ok(
  not exists(
    select 1 from public.project_reference_origins
    where id = 'fa200000-0000-4000-8000-000000000002'
  ),
  'unreferenced origin deletion removes only that origin'
);
select ok(
  not pg_temp.try_update_route('fa400000-0000-4000-8000-000000000001'),
  'route observations are immutable against updates'
);
select ok(
  not pg_temp.try_delete_route('fa400000-0000-4000-8000-000000000001'),
  'route observations are immutable against deletes'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000004',
    null,
    'custom', 'Station', 'Route Venue A', 'train',
    70, 100000, 1, '2026-09-09T13:00:00Z', null, 'Editor route'
  ),
  '00000',
  'editor with access.write appends route observations'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.venue_access_routes),
  4,
  'viewer with access.read sees own-project route history'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000020',
    null,
    'custom', 'Origin', 'Destination', 'walk',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '42501',
  'viewer cannot append route observations'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f5555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.venue_access_routes),
  0,
  'outsider cannot read route history through RLS'
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000021',
    null,
    'custom', 'Origin', 'Destination', 'walk',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '42501',
  'outsider cannot append route observations'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f6666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000022',
    null,
    'custom', 'Origin', 'Destination', 'walk',
    1, 1, 0, '2026-09-09T10:00:00Z', null, null
  ),
  '42501',
  'revoked member cannot append route observations'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'fb100000-0000-4000-8000-000000000001',
    'fb400000-0000-4000-8000-000000000001',
    'fb200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Route Venue B', 'car',
    30, 20000, 0, '2026-09-09T14:00:00Z',
    'fb300000-0000-4000-8000-000000000001', null
  ),
  '00000',
  'second project owner appends only within the second project'
);
select is(
  (select count(*)::integer from public.venue_access_routes),
  1,
  'RLS exposes only second-project route history to second-project owner'
);
select is(
  pg_temp.append_route_sqlstate(
    'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'fb100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    'fb200000-0000-4000-8000-000000000001',
    'reference_to_venue', null, 'Route Venue B', 'car',
    30, 20000, 0, '2026-09-09T14:00:00Z',
    'fb300000-0000-4000-8000-000000000001', null
  ),
  '42501',
  'foreign-project route UUID collision is non-disclosing'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  (select id
   from public.venue_access_routes
   order by observed_at desc, created_at desc, id asc
   limit 1),
  'fa400000-0000-4000-8000-000000000004'::uuid,
  'canonical database history order selects newest observed route first'
);
reset role;

select * from finish();
rollback;
