begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '81111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','evidence-review-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  '80000000-0000-4000-8000-000000000001',
  'Evidence Review',
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  '80000000-0000-4000-8000-000000000001',
  '81111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  '80000000-0000-4000-8000-000000000011',
  '80000000-0000-4000-8000-000000000001',
  'ER1','Evidence Review Venue','research',
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  options_json,created_by,updated_by
) values
(
  '80000000-0000-4000-8000-000000000021',
  '80000000-0000-4000-8000-000000000001',
  'review_boolean','Review boolean','venue','boolean','important',false,null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
),
(
  '80000000-0000-4000-8000-000000000022',
  '80000000-0000-4000-8000-000000000001',
  'review_boolean_no_evidence','Review boolean no evidence','venue','boolean','important',false,null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
),
(
  '80000000-0000-4000-8000-000000000023',
  '80000000-0000-4000-8000-000000000001',
  'review_select','Review select','venue','select','important',false,
  '{"options":[{"key":"legacy","labelKey":"Legacy"},{"key":"current","labelKey":"Current"}]}'::jsonb,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values
(
  '80000000-0000-4000-8000-000000000031',
  '80000000-0000-4000-8000-000000000001','venue',
  '80000000-0000-4000-8000-000000000011',
  '80000000-0000-4000-8000-000000000021','unknown',null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
),
(
  '80000000-0000-4000-8000-000000000032',
  '80000000-0000-4000-8000-000000000001','venue',
  '80000000-0000-4000-8000-000000000011',
  '80000000-0000-4000-8000-000000000022','unknown',null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
),
(
  '80000000-0000-4000-8000-000000000033',
  '80000000-0000-4000-8000-000000000001','venue',
  '80000000-0000-4000-8000-000000000011',
  '80000000-0000-4000-8000-000000000023','unknown',null,
  '81111111-1111-4111-8111-111111111111',
  '81111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_set(
  definition_id uuid, expected_revision bigint, state_value text, retained jsonb
) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000011',
    definition_id,expected_revision,state_value,retained
  );
  return true;
exception when others then return false;
end$$;

create function pg_temp.try_update_select(
  expected_revision bigint, options_value jsonb
) returns boolean language plpgsql as $$
begin
  perform public.update_venue_fact_definition(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000023',
    expected_revision,
    'Review select updated','important',null,null,options_value,null
  );
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select ok(
  pg_temp.try_set(
    '80000000-0000-4000-8000-000000000022',1,'known','true'::jsonb
  ),
  'direct retained setter remains available before a fact has observations'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000031',
    'true'::jsonb,
    'Confirmed',
    'confirmed_for_event',
    'high',
    '2026-09-07T09:00:00Z',
    'review evidence',
    null
  )$$,
  'observation is appended before retained resolution'
);

select lives_ok(
  $$select public.resolve_venue_fact_from_observation(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000031',
    (
      select id from public.fact_observations
      where fact_id='80000000-0000-4000-8000-000000000031'
    ),
    1,
    'conflict',
    'Explicit reviewed conflict resolution'
  )$$,
  'active observation can be explicitly retained through protected resolution'
);

select ok(
  not pg_temp.try_set(
    '80000000-0000-4000-8000-000000000021',2,'known','false'::jsonb
  ),
  'legacy direct retained setter cannot bypass observation-backed resolution'
);
select is(
  (select state from public.facts where id='80000000-0000-4000-8000-000000000031'),
  'conflict',
  'failed write-around preserves conflict state'
);
select is(
  (select retained_value from public.facts where id='80000000-0000-4000-8000-000000000031'),
  'true'::jsonb,
  'failed write-around preserves retained value'
);
select isnt(
  (select retained_observation_id from public.facts where id='80000000-0000-4000-8000-000000000031'),
  null::uuid,
  'failed write-around preserves retained observation provenance'
);
select is(
  (select resolution_note from public.facts where id='80000000-0000-4000-8000-000000000031'),
  'Explicit reviewed conflict resolution',
  'failed write-around preserves resolution rationale'
);

select lives_ok(
  $$select public.append_venue_fact_observation(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000033',
    '"legacy"'::jsonb,
    'Legacy option',
    'official_general',
    'high',
    '2026-09-07T09:05:00Z',
    null,
    null
  )$$,
  'select observation stores value valid under current definition'
);

select ok(
  not pg_temp.try_update_select(
    1,
    '{"options":[{"key":"current","labelKey":"Current"}]}'::jsonb
  ),
  'definition edit cannot invalidate persisted observation history'
);
select is(
  (select revision from public.fact_definitions where id='80000000-0000-4000-8000-000000000023'),
  1::bigint,
  'rejected invalidating definition edit does not advance revision'
);
select ok(
  pg_temp.try_update_select(
    1,
    '{"options":[{"key":"legacy","labelKey":"Legacy renamed"},{"key":"current","labelKey":"Current"},{"key":"future","labelKey":"Future"}]}'::jsonb
  ),
  'compatible definition edit preserves observation validity'
);
select is(
  (select revision from public.fact_definitions where id='80000000-0000-4000-8000-000000000023'),
  2::bigint,
  'compatible definition edit advances revision'
);

select lives_ok(
  $$select public.resolve_venue_fact_from_observation(
    '80000000-0000-4000-8000-000000000001',
    '80000000-0000-4000-8000-000000000033',
    (
      select id from public.fact_observations
      where fact_id='80000000-0000-4000-8000-000000000033'
    ),
    1,
    'conflict',
    'Retain legacy evidence while conflicting'
  )$$,
  'conflict may retain an explicitly selected typed observation'
);
select ok(
  not pg_temp.try_update_select(
    2,
    '{"options":[{"key":"current","labelKey":"Current"},{"key":"future","labelKey":"Future"}]}'::jsonb
  ),
  'definition edit cannot invalidate conflict-retained typed truth'
);
select is(
  (select retained_value from public.facts where id='80000000-0000-4000-8000-000000000033'),
  '"legacy"'::jsonb,
  'rejected edit preserves conflict-retained value'
);

reset role;
select * from finish();
rollback;
