begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure(
    'public.append_venue_fact_observation(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid)'
  ) is not null,
  'replay-safe append observation RPC accepts a stable client observation id'
);

select ok(
  to_regprocedure(
    'public.append_venue_fact_observation(uuid,uuid,jsonb,text,text,text,text,text,uuid)'
  ) is null,
  'legacy client append signature is removed'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.append_venue_fact_observation_replay_core(uuid,uuid,uuid,jsonb,text,text,text,timestamptz,text,uuid)',
    'EXECUTE'
  ),
  'replay core remains unavailable to authenticated clients'
);

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
(
  '00000000-0000-0000-0000-000000000000',
  'e1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'wp212r-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'e2222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'wp212r-foreign@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'e3333333-3333-4333-8333-333333333333',
  'authenticated',
  'authenticated',
  'wp212r-viewer@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'e4444444-4444-4444-8444-444444444444',
  'authenticated',
  'authenticated',
  'wp212r-outsider@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'e5555555-5555-4555-8555-555555555555',
  'authenticated',
  'authenticated',
  'wp212r-revoked@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects(id, name, created_by, updated_by)
values
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'WP-2.12R replay',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'WP-2.12R foreign',
  'e2222222-2222-4222-8222-222222222222',
  'e2222222-2222-4222-8222-222222222222'
);

insert into public.project_members(
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
),
(
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'e2222222-2222-4222-8222-222222222222',
  'owner',
  'active',
  now(),
  null
),
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e3333333-3333-4333-8333-333333333333',
  'viewer',
  'active',
  now(),
  null
),
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e5555555-5555-4555-8555-555555555555',
  'owner',
  'revoked',
  now(),
  now()
);

insert into public.venues(
  id, project_id, code, name, status, created_by, updated_by
)
values
(
  'ee100000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'R1',
  'Replay Venue',
  'research',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ff100000-0000-4000-8000-000000000001',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'F1',
  'Foreign Venue',
  'research',
  'e2222222-2222-4222-8222-222222222222',
  'e2222222-2222-4222-8222-222222222222'
);

insert into public.fact_definitions(
  id, project_id, key, label, entity_type, value_type, priority,
  system_defined, created_by, updated_by
)
values
(
  'ee200000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'visit_measurement_confirmed',
  'Visit measurement confirmed',
  'venue',
  'boolean',
  'important',
  false,
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ee200000-0000-4000-8000-000000000002',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'visit_secondary_measurement_confirmed',
  'Visit secondary measurement confirmed',
  'venue',
  'boolean',
  'important',
  false,
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ff200000-0000-4000-8000-000000000001',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'visit_measurement_confirmed',
  'Visit measurement confirmed',
  'venue',
  'boolean',
  'important',
  false,
  'e2222222-2222-4222-8222-222222222222',
  'e2222222-2222-4222-8222-222222222222'
);

insert into public.facts(
  id, project_id, target_type, target_id, definition_id, state,
  retained_value, created_by, updated_by
)
values
(
  'ee300000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'venue',
  'ee100000-0000-4000-8000-000000000001',
  'ee200000-0000-4000-8000-000000000001',
  'unknown',
  null,
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ee300000-0000-4000-8000-000000000002',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'venue',
  'ee100000-0000-4000-8000-000000000001',
  'ee200000-0000-4000-8000-000000000002',
  'unknown',
  null,
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
),
(
  'ff300000-0000-4000-8000-000000000001',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'venue',
  'ff100000-0000-4000-8000-000000000001',
  'ff200000-0000-4000-8000-000000000001',
  'unknown',
  null,
  'e2222222-2222-4222-8222-222222222222',
  'e2222222-2222-4222-8222-222222222222'
);

insert into public.fact_observations(
  id, project_id, fact_id, value, raw_value_text, evidence_level, confidence,
  observation_status, observed_at, note, created_by
)
values (
  'ff400000-0000-4000-8000-000000000001',
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'ff300000-0000-4000-8000-000000000001',
  'true'::jsonb,
  'foreign',
  'observed',
  'high',
  'active',
  '2026-10-05T08:50:00Z',
  'foreign',
  'e2222222-2222-4222-8222-222222222222'
);

set local role anon;
select throws_ok(
  $authz$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000010',
    'true'::jsonb,
    'denied anon',
    'observed',
    'high',
    '2026-10-05T08:40:00Z',
    'anon',
    null
  )$authz$,
  '42501',
  'permission denied for function append_venue_fact_observation',
  'anon cannot execute replay-safe observation RPC'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000011',
    'true'::jsonb,
    'denied viewer',
    'observed',
    'high',
    '2026-10-05T08:41:00Z',
    'viewer',
    null
  )$authz$,
  '42501',
  'venue fact observation unavailable',
  'viewer cannot execute venues.write replay-safe observation'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000012',
    'true'::jsonb,
    'denied outsider',
    'observed',
    'high',
    '2026-10-05T08:42:00Z',
    'outsider',
    null
  )$authz$,
  '42501',
  'venue fact observation unavailable',
  'outsider cannot execute replay-safe observation for the project'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000013',
    'true'::jsonb,
    'denied foreign owner',
    'observed',
    'high',
    '2026-10-05T08:43:00Z',
    'foreign owner',
    null
  )$authz$,
  '42501',
  'venue fact observation unavailable',
  'project-B owner cannot execute project-A replay-safe observation'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e5555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000014',
    'true'::jsonb,
    'denied revoked',
    'observed',
    'high',
    '2026-10-05T08:44:00Z',
    'revoked',
    null
  )$authz$,
  '42501',
  'venue fact observation unavailable',
  'revoked project member cannot execute replay-safe observation'
);

reset role;
select is(
  (
    select count(*)
    from public.fact_observations
    where id in (
      'ee400000-0000-4000-8000-000000000010',
      'ee400000-0000-4000-8000-000000000011',
      'ee400000-0000-4000-8000-000000000012',
      'ee400000-0000-4000-8000-000000000013',
      'ee400000-0000-4000-8000-000000000014'
    )
  ),
  0::bigint,
  'directly denied replay-safe RPC attempts create no observations'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  'first replay-safe append succeeds'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  'exact replay returns the existing observation'
);

select is(
  (
    select count(*)
    from public.fact_observations
    where id = 'ee400000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'exact replay keeps one observation row'
);

select throws_ok(
  $cmd$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    null,
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$cmd$,
  '22023',
  'venue fact observation unavailable',
  'replay rejects null evidence metadata'
);

select throws_ok(
  $cmd$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    null,
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$cmd$,
  '22023',
  'venue fact observation unavailable',
  'replay rejects null confidence metadata'
);

select throws_ok(
  $fact$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000002',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$fact$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed Fact conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'false'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed value conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'different raw evidence',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed raw evidence conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'official_general',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed evidence level conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'medium',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed confidence conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:01Z',
    'visit measurement',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed timestamp conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'different note',
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'same observation id with changed note conflicts'
);

select throws_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ff400000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'foreign',
    'observed',
    'high',
    '2026-10-05T08:50:00Z',
    'foreign',
    null
  )$$,
  '42501',
  'venue fact observation unavailable',
  'foreign-project observation-id collision is non-disclosing'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000002',
    'false'::jsonb,
    'old measurement',
    'observed',
    'medium',
    '2026-10-05T09:05:00Z',
    'old',
    null
  )$$,
  'supersede source observation is created'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000003',
    'true'::jsonb,
    'new measurement',
    'observed',
    'high',
    '2026-10-05T09:10:00Z',
    'new',
    'ee400000-0000-4000-8000-000000000002'
  )$$,
  'superseding observation is created'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000003',
    'true'::jsonb,
    'new measurement',
    'observed',
    'high',
    '2026-10-05T09:10:00Z',
    'new',
    'ee400000-0000-4000-8000-000000000002'
  )$$,
  'exact supersede replay is idempotent'
);

select is(
  (
    select superseded_by_observation_id
    from public.fact_observations
    where id = 'ee400000-0000-4000-8000-000000000002'
  ),
  'ee400000-0000-4000-8000-000000000003'::uuid,
  'supersede replay preserves the original replacement identity'
);

select throws_ok(
  $wp212u$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000004',
    'true'::jsonb,
    'late competing measurement',
    'observed',
    'high',
    '2026-10-05T09:11:00Z',
    'late competing visit measurement',
    'ee400000-0000-4000-8000-000000000002'
  )$wp212u$,
  'PT412',
  'venue fact observation unavailable',
  'already-superseded observation uses non-retryable precondition conflict'
);
select is(
  (
    select count(*)
    from public.fact_observations
    where id = 'ee400000-0000-4000-8000-000000000004'
  ),
  0::bigint,
  'stale supersession conflict creates no new observation'
);

select throws_ok(
  $replay$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'ee400000-0000-4000-8000-000000000003',
    'true'::jsonb,
    'new measurement',
    'observed',
    'high',
    '2026-10-05T09:10:00Z',
    'new',
    null
  )$replay$,
  '23505',
  'venue fact observation conflict',
  'changing supersede intent on replay conflicts'
);

reset role;
select * from finish();
rollback;
