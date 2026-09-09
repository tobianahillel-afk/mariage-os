begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'interactions', 'interactions table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.interactions'::regclass),
  'interactions has RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.interactions', 'select')
  and not has_table_privilege('authenticated', 'public.interactions', 'insert')
  and not has_table_privilege('authenticated', 'public.interactions', 'update')
  and not has_table_privilege('authenticated', 'public.interactions', 'delete'),
  'authenticated clients cannot bypass interaction RPC boundary'
);
select ok(
  not has_table_privilege('anon', 'public.interactions', 'select'),
  'anonymous role has no interaction read grant'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.append_venue_interaction(uuid,uuid,uuid,uuid,text,text,text,text,uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.append_venue_interaction(uuid,uuid,uuid,uuid,text,text,text,text,uuid)',
    'execute'
  ),
  'only authenticated clients receive interaction append capability'
);
select ok(
  position(
    'FOR UPDATE' in upper(
      pg_get_functiondef(
        'public.venue_interaction_assert_writer(uuid)'::regprocedure
      )
    )
  ) > 0,
  'writer authorization serializes against project membership changes'
);
select ok(
  (select p.prosecdef
     from pg_proc p
     where p.oid = 'public.append_venue_interaction(uuid,uuid,uuid,uuid,text,text,text,text,uuid)'::regprocedure),
  'interaction append command is SECURITY DEFINER'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'interaction-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'interaction-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'interaction-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'interaction-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'interaction-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'interaction-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Interaction Project A', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Interaction Project B', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e6666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ea100000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'INA', 'Interaction Venue A', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ea100000-0000-4000-8000-000000000002', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'INA2', 'Interaction Venue A2', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('eb100000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'INB', 'Interaction Venue B', 'research', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

insert into public.contacts (
  id, project_id, parent_type, parent_id, name, created_by, updated_by
)
values
  ('ea200000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'venue', 'ea100000-0000-4000-8000-000000000001', 'Contact A', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ea200000-0000-4000-8000-000000000002', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'venue', 'ea100000-0000-4000-8000-000000000002', 'Contact A2', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('eb200000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'venue', 'eb100000-0000-4000-8000-000000000001', 'Contact B', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

insert into public.sources (
  id, project_id, source_type, title, url, evidence_level, status, created_by, updated_by
)
values
  ('ea300000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'phone_call_note', 'Interaction source A', 'https://example.invalid/a', 'confirmed_for_event', 'active', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('eb300000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'phone_call_note', 'Interaction source B', 'https://example.invalid/b', 'confirmed_for_event', 'active', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

create function pg_temp.try_append_interaction(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_contact uuid,
  target_type text,
  target_occurred text,
  target_summary text,
  target_follow_up text,
  target_source uuid
)
returns boolean language plpgsql as $$
begin
  perform public.append_venue_interaction(
    target_project, target_venue, target_id, target_contact, target_type,
    target_occurred, target_summary, target_follow_up, target_source
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.append_interaction_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_contact uuid,
  target_type text,
  target_occurred text,
  target_summary text,
  target_follow_up text,
  target_source uuid
)
returns text language plpgsql as $$
begin
  perform public.append_venue_interaction(
    target_project, target_venue, target_id, target_contact, target_type,
    target_occurred, target_summary, target_follow_up, target_source
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.try_update_interaction(target_id uuid)
returns boolean language plpgsql as $$
begin
  update public.interactions set summary = 'mutated' where id = target_id;
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_delete_interaction(target_id uuid)
returns boolean language plpgsql as $$
begin
  delete from public.interactions where id = target_id;
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_delete_source(target_id uuid)
returns boolean language plpgsql as $$
begin
  delete from public.sources where id = target_id;
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_direct_wrong_parent_contact()
returns boolean
language plpgsql
security definer
as $$
begin
  insert into public.interactions (
    id, project_id, parent_type, parent_id, contact_id,
    interaction_type, occurred_at, summary, created_by, updated_by
  ) values (
    'ea400000-0000-4000-8000-000000000099',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'venue',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000002',
    'direct_test',
    '2026-09-08T10:00:00Z',
    'wrong parent must fail',
    'e1111111-1111-4111-8111-111111111111',
    'e1111111-1111-4111-8111-111111111111'
  );
  return true;
exception when others then
  return false;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.interactions$$,
  '42501',
  'permission denied for table interactions',
  'anonymous direct interaction read is denied at grant layer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select ok(
  pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    '  phone_call  ',
    '2026-09-08T12:00:00+02:00',
    '  Quote confirmed.  ',
    '2026-09-07T10:00:00Z',
    'ea300000-0000-4000-8000-000000000001'
  ),
  'owner appends interaction history in own project'
);
select ok(
  (select parent_type = 'venue'
     and parent_id = 'ea100000-0000-4000-8000-000000000001'
     and contact_id = 'ea200000-0000-4000-8000-000000000001'
     and interaction_type = 'phone_call'
     and occurred_at = '2026-09-08T10:00:00Z'::timestamptz
     and summary = 'Quote confirmed.'
     and next_follow_up_at = '2026-09-07T10:00:00Z'::timestamptz
     and source_id = 'ea300000-0000-4000-8000-000000000001'
     and revision = 1
   from public.interactions
   where id = 'ea400000-0000-4000-8000-000000000001'),
  'append canonicalizes text/instants and does not invent follow-up ordering rules'
);
select ok(
  pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'phone_call',
    '2026-09-08T10:00:00Z',
    'Quote confirmed.',
    '2026-09-07T10:00:00Z',
    'ea300000-0000-4000-8000-000000000001'
  ),
  'same UUID and same canonical payload is idempotent'
);
select is(
  (select count(*) from public.interactions where id = 'ea400000-0000-4000-8000-000000000001'),
  1::bigint,
  'idempotent replay does not append a duplicate row'
);
select is(
  pg_temp.append_interaction_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'phone_call',
    '2026-09-08T10:00:00Z',
    'Different summary.',
    '2026-09-07T10:00:00Z',
    'ea300000-0000-4000-8000-000000000001'
  ),
  '23505',
  'same UUID with different canonical payload is a typed replay conflict'
);
select ok(
  pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000002',
    null,
    'email',
    '2026-09-08T11:00:00Z',
    'Second historical interaction.',
    null,
    null
  ),
  'multiple historical interactions coexist without rewriting prior rows'
);
select is(
  (select count(*) from public.interactions where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and parent_id = 'ea100000-0000-4000-8000-000000000001'),
  2::bigint,
  'append history retains multiple Venue interactions'
);

select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000003',
    'ea200000-0000-4000-8000-000000000002',
    'phone_call', '2026-09-08T10:00:00Z', 'Wrong Venue contact.', null, null
  ),
  'same-project contact from another Venue parent is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000004',
    'eb200000-0000-4000-8000-000000000001',
    'phone_call', '2026-09-08T10:00:00Z', 'Cross project contact.', null, null
  ),
  'cross-project contact is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000005',
    null,
    'phone_call', '2026-09-08T10:00:00Z', 'Cross project source.', null,
    'eb300000-0000-4000-8000-000000000001'
  ),
  'cross-project source is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000006',
    null,
    'phone_call', '2026-09-08T10:00:00Z', 'Cross project Venue.', null, null
  ),
  'cross-project Venue is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000007',
    null,
    '   ', '2026-09-08T10:00:00Z', 'Summary.', null, null
  ),
  'empty interaction type is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000008',
    null,
    repeat('x', 81), '2026-09-08T10:00:00Z', 'Summary.', null, null
  ),
  'overlong interaction type is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000009',
    null,
    'phone_call', 'bad', 'Summary.', null, null
  ),
  'non-application occurred_at is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000010',
    null,
    'phone_call', '2026-09-08T10:00:00Z', '   ', null, null
  ),
  'empty summary is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000011',
    null,
    'phone_call', '2026-09-08T10:00:00Z', repeat('x', 5001), null, null
  ),
  'overlong summary is rejected'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000012',
    null,
    'phone_call', '2026-09-08T10:00:00Z', 'Summary.', 'later', null
  ),
  'invalid optional next_follow_up_at is rejected'
);
select ok(
  not pg_temp.try_direct_wrong_parent_contact(),
  'database FK itself rejects contact from another Venue parent'
);

select set_config('request.jwt.claims', '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000020',
    null,
    'in_person', '2026-09-08T12:00:00Z', 'Editor note.', null, null
  ),
  'editor with venues.write may append interaction history'
);

select set_config('request.jwt.claims', '{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000021',
    null,
    'viewer_attempt', '2026-09-08T12:00:00Z', 'Must fail.', null, null
  ),
  'viewer cannot append interaction history'
);
select ok(
  (select count(*) from public.interactions) >= 3,
  'viewer with venues.read may read own-project interaction history'
);

select set_config('request.jwt.claims', '{"sub":"e5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is(
  (select count(*) from public.interactions),
  0::bigint,
  'outsider cannot read private interaction history'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000022',
    null,
    'outsider_attempt', '2026-09-08T12:00:00Z', 'Must fail.', null, null
  ),
  'outsider cannot append interaction history'
);

select set_config('request.jwt.claims', '{"sub":"e6666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is(
  (select count(*) from public.interactions),
  0::bigint,
  'revoked member cannot read interaction history'
);
select ok(
  not pg_temp.try_append_interaction(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000023',
    null,
    'revoked_attempt', '2026-09-08T12:00:00Z', 'Must fail.', null, null
  ),
  'revoked member cannot append interaction history without fresh login'
);

select set_config('request.jwt.claims', '{"sub":"e4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(
  pg_temp.try_append_interaction(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb100000-0000-4000-8000-000000000001',
    'eb400000-0000-4000-8000-000000000001',
    'eb200000-0000-4000-8000-000000000001',
    'phone_call', '2026-09-08T12:00:00Z', 'Project B history.', null,
    'eb300000-0000-4000-8000-000000000001'
  ),
  'project-B owner appends only in project B'
);
select is(
  (select count(*) from public.interactions),
  1::bigint,
  'project-B owner cannot read project-A interaction history'
);

select set_config('request.jwt.claims', '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.append_interaction_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'eb400000-0000-4000-8000-000000000001',
    null,
    'phone_call', '2026-09-08T12:00:00Z', 'Collision probe.', null, null
  ),
  '42501',
  'foreign-project UUID collision does not disclose replay payload or existence'
);

reset role;
select ok(
  not pg_temp.try_update_interaction('ea400000-0000-4000-8000-000000000001'),
  'recorded interaction cannot be updated even by a direct privileged path'
);
select ok(
  not pg_temp.try_delete_interaction('ea400000-0000-4000-8000-000000000001'),
  'recorded interaction cannot be deleted even by a direct privileged path'
);
select ok(
  not pg_temp.try_delete_source('ea300000-0000-4000-8000-000000000001'),
  'cited source cannot be physically deleted out from under interaction history'
);
select is(
  (select count(*) from public.interactions where id = 'ea400000-0000-4000-8000-000000000001'),
  1::bigint,
  'source deletion attempt preserves immutable interaction history'
);

select * from finish();
rollback;
