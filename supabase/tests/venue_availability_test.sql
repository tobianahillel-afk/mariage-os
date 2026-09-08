begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'venue_availabilities', 'venue_availabilities table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.venue_availabilities'::regclass),
  'venue_availabilities has RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.venue_availabilities', 'select')
  and not has_table_privilege('authenticated', 'public.venue_availabilities', 'insert')
  and not has_table_privilege('authenticated', 'public.venue_availabilities', 'update')
  and not has_table_privilege('authenticated', 'public.venue_availabilities', 'delete'),
  'authenticated clients cannot bypass availability RPC boundary'
);
select ok(
  not has_table_privilege('anon', 'public.venue_availabilities', 'select'),
  'anonymous role has no availability read grant'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'd1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'availability-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'availability-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'availability-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'availability-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'availability-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'availability-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Availability Project A', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Availability Project B', 'd4444444-4444-4444-8444-444444444444', 'd4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'd4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd6666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('da100000-0000-4000-8000-000000000001', 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'AVA', 'Availability Venue A', 'research', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('db100000-0000-4000-8000-000000000001', 'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'AVB', 'Availability Venue B', 'research', 'd4444444-4444-4444-8444-444444444444', 'd4444444-4444-4444-8444-444444444444');

insert into public.wedding_date_options (
  id, project_id, event_date, label, status, created_by, updated_by
)
values
  ('da200000-0000-4000-8000-000000000001', 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2027-06-12', 'Date A', 'candidate', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('da200000-0000-4000-8000-000000000002', 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2027-06-13', 'Date A2', 'candidate', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('db200000-0000-4000-8000-000000000001', 'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '2027-06-12', 'Date B', 'candidate', 'd4444444-4444-4444-8444-444444444444', 'd4444444-4444-4444-8444-444444444444');

insert into public.sources (
  id, project_id, source_type, title, evidence_level, status, created_by, updated_by
)
values
  ('da300000-0000-4000-8000-000000000001', 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'quote', 'Synthetic availability source A', 'confirmed_for_event', 'active', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('db300000-0000-4000-8000-000000000001', 'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'quote', 'Synthetic availability source B', 'confirmed_for_event', 'active', 'd4444444-4444-4444-8444-444444444444', 'd4444444-4444-4444-8444-444444444444');

create function pg_temp.try_append_availability(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_date_option uuid,
  target_event_date text,
  target_status text,
  target_expiry text,
  target_observed text,
  target_source uuid,
  target_notes text
)
returns boolean language plpgsql as $$
begin
  perform public.append_venue_availability(
    target_project, target_venue, target_id, target_date_option,
    target_event_date, target_status, target_expiry, target_observed,
    target_source, target_notes
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.append_availability_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_event_date text,
  target_status text,
  target_observed text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_availability(
    target_project, target_venue, target_id, null,
    target_event_date, target_status, null, target_observed, null, null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.venue_availabilities$$,
  '42501',
  'permission denied for table venue_availabilities',
  'anonymous direct availability read is denied at grant layer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select ok(
  pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000001',
    'da200000-0000-4000-8000-000000000001',
    '2027-06-12', 'option_held', '2026-09-10T18:00:00+02:00',
    '2026-09-08T12:00:00+02:00',
    'da300000-0000-4000-8000-000000000001',
    '  synthetic hold  '
  ),
  'owner appends availability evidence in own project'
);
select ok(
  (select event_date = '2027-06-12'::date
     and status = 'option_held'
     and option_expires_at = '2026-09-10T16:00:00Z'::timestamptz
     and observed_at = '2026-09-08T10:00:00Z'::timestamptz
     and notes = 'synthetic hold'
     and revision = 1
   from public.venue_availabilities
   where id = 'da400000-0000-4000-8000-000000000001'),
  'append canonicalizes strict instants and notes without rewriting evidence'
);
select is(
  pg_temp.append_availability_sqlstate(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000001',
    '2027-06-12', 'option_held', '2026-09-08T12:00:00+02:00'
  ),
  '23505',
  'same UUID with different canonical payload is a typed conflict'
);
select ok(
  pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000001',
    'da200000-0000-4000-8000-000000000001',
    '2027-06-12', 'option_held', '2026-09-10T18:00:00+02:00',
    '2026-09-08T12:00:00+02:00',
    'da300000-0000-4000-8000-000000000001',
    'synthetic hold'
  ),
  'same UUID and same canonical payload is idempotent'
);
select is(
  (select count(*) from public.venue_availabilities where id = 'da400000-0000-4000-8000-000000000001'),
  1::bigint,
  'idempotent replay does not append a duplicate row'
);
select ok(
  pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000002',
    null,
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'multiple observations for the same Venue and event date coexist'
);
select is(
  (select count(*) from public.venue_availabilities where project_id = 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and venue_id = 'da100000-0000-4000-8000-000000000001' and event_date = '2027-06-12'),
  2::bigint,
  'availability history preserves repeated observations'
);

select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000003',
    'da200000-0000-4000-8000-000000000002',
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'date option event date must match observation event date'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000004',
    'db200000-0000-4000-8000-000000000001',
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'cross-project date option is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000005',
    null,
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', 'db300000-0000-4000-8000-000000000001', null
  ),
  'cross-project source is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'db100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000006',
    null,
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'cross-project Venue is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000007',
    null,
    '2027-06-12', 'available', '2026-09-10T10:00:00Z',
    '2026-09-09T10:00:00Z', null, null
  ),
  'expiry is rejected for non-option-held status'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000008',
    null,
    '2027-06-12', 'pending', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'unknown availability status is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000009',
    null,
    '2027-02-29', 'available', null,
    '2026-09-09T10:00:00Z', null, null
  ),
  'invalid civil event date is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000010',
    null,
    '2027-06-12', 'available', null,
    '2026-09-09 10:00:00', null, null
  ),
  'permissive PostgreSQL timestamp text is rejected'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000011',
    null,
    '2027-06-12', 'available', null,
    '2026-09-09T10:00:00Z', null, repeat('x', 5001)
  ),
  'overlong notes are rejected without truncation'
);

select set_config('request.jwt.claims', '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000012', null,
    '2027-06-12', 'unknown', null, '2026-09-10T10:00:00Z', null, null
  ),
  'editor with venues.write may append availability evidence'
);

select set_config('request.jwt.claims', '{"sub":"d3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000013', null,
    '2027-06-12', 'available', null, '2026-09-10T10:00:00Z', null, null
  ),
  'viewer without venues.write cannot append'
);
select is(
  (select count(*) from public.venue_availabilities where project_id = 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  3::bigint,
  'viewer with venues.read sees project availability history'
);

select set_config('request.jwt.claims', '{"sub":"d5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000014', null,
    '2027-06-12', 'available', null, '2026-09-10T10:00:00Z', null, null
  ),
  'outsider cannot append into project A'
);
select is((select count(*) from public.venue_availabilities), 0::bigint, 'outsider RLS sees no availability rows');

select set_config('request.jwt.claims', '{"sub":"d6666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000015', null,
    '2027-06-12', 'available', null, '2026-09-10T10:00:00Z', null, null
  ),
  'revoked member cannot append'
);
select is((select count(*) from public.venue_availabilities), 0::bigint, 'revoked member RLS sees no availability rows');

select set_config('request.jwt.claims', '{"sub":"d4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(
  pg_temp.try_append_availability(
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'db100000-0000-4000-8000-000000000001',
    'db400000-0000-4000-8000-000000000001', null,
    '2027-06-12', 'available', null, '2026-09-10T10:00:00Z', null, null
  ),
  'project B owner appends in project B'
);
select ok(
  not pg_temp.try_append_availability(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da400000-0000-4000-8000-000000000016', null,
    '2027-06-12', 'available', null, '2026-09-10T10:00:00Z', null, null
  ),
  'project B owner cannot append into project A'
);
select is((select count(*) from public.venue_availabilities), 1::bigint, 'project B owner sees only project B availability rows');

select set_config('request.jwt.claims', '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.append_availability_sqlstate(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'db400000-0000-4000-8000-000000000001',
    '2027-06-12', 'available', '2026-09-10T10:00:00Z'
  ),
  '23505',
  'cross-project UUID collision is the same generic replay conflict'
);

reset role;
select throws_ok(
  $$update public.venue_availabilities set notes = 'mutated' where id = 'da400000-0000-4000-8000-000000000001'$$,
  '23514',
  'venue availability is immutable',
  'privileged direct update cannot rewrite availability history'
);
select throws_ok(
  $$delete from public.venue_availabilities where id = 'da400000-0000-4000-8000-000000000001'$$,
  '23514',
  'venue availability is immutable',
  'privileged direct delete cannot erase availability history'
);

select * from finish();
rollback;
