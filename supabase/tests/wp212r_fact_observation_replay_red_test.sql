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
  ) is not null,
  'RED baseline still exposes the legacy server-generated observation-id RPC'
);

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
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
);

insert into public.projects(id, name, created_by, updated_by)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'WP-2.12R RED',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues(
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'ee100000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'R1',
  'Replay Venue',
  'research',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id, project_id, key, label, entity_type, value_type, priority,
  system_defined, created_by, updated_by
)
values (
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
);

insert into public.facts(
  id, project_id, target_type, target_id, definition_id, state,
  retained_value, created_by, updated_by
)
values (
  'ee300000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'venue',
  'ee100000-0000-4000-8000-000000000001',
  'ee200000-0000-4000-8000-000000000001',
  'unknown',
  null,
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
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
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  'first legacy append succeeds'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    'true'::jsonb,
    'measured during visit',
    'observed',
    'high',
    '2026-10-05T09:00:00Z',
    'visit measurement',
    null
  )$$,
  'ambiguous retry of the same legacy intent also succeeds'
);

select is(
  (
    select count(*)
    from public.fact_observations
    where project_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      and fact_id = 'ee300000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'ambiguous retry must not duplicate one logical observation'
);

reset role;
select * from finish();
rollback;
