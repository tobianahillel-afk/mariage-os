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
  'same observation id with semantic drift conflicts'
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
    null
  )$$,
  '23505',
  'venue fact observation conflict',
  'changing supersede intent on replay conflicts'
);

reset role;
select * from finish();
rollback;
