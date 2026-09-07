begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'c8111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','primary-parity-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  'c8000000-0000-4000-8000-000000000001','Primary parity project',
  'c8111111-1111-4111-8111-111111111111','c8111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  'c8000000-0000-4000-8000-000000000001','c8111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(id,project_id,code,name,status,created_by,updated_by) values (
  'c8000000-0000-4000-8000-000000000011','c8000000-0000-4000-8000-000000000001',
  'PP1','Primary parity venue','research','c8111111-1111-4111-8111-111111111111',
  'c8111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,created_by,updated_by
) values (
  'c8000000-0000-4000-8000-000000000021','c8000000-0000-4000-8000-000000000001',
  'primary_parity_boolean','Primary parity boolean','venue','boolean','important',false,
  'c8111111-1111-4111-8111-111111111111','c8111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,created_by,updated_by
) values (
  'c8000000-0000-4000-8000-000000000031','c8000000-0000-4000-8000-000000000001',
  'venue','c8000000-0000-4000-8000-000000000011','c8000000-0000-4000-8000-000000000021',
  'unknown',null,'c8111111-1111-4111-8111-111111111111','c8111111-1111-4111-8111-111111111111'
);

insert into public.fact_observations(
  id,project_id,fact_id,value,raw_value_text,evidence_level,confidence,
  observation_status,observed_at,note,created_by
) values (
  'c8000000-0000-4000-8000-000000000041','c8000000-0000-4000-8000-000000000001',
  'c8000000-0000-4000-8000-000000000031','true'::jsonb,null,
  'confirmed_for_event','high','active','2026-09-07T12:00:00Z'::timestamptz,null,
  'c8111111-1111-4111-8111-111111111111'
);

insert into public.sources(
  id,project_id,source_type,title,url,evidence_level,observed_at,notes,status,
  created_by,updated_by
) values (
  'c8000000-0000-4000-8000-000000000051','c8000000-0000-4000-8000-000000000001',
  'written_confirmation','Primary parity source',null,'confirmed_for_event',
  '2026-09-07T12:00:00Z'::timestamptz,null,'active',
  'c8111111-1111-4111-8111-111111111111','c8111111-1111-4111-8111-111111111111'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.link_venue_fact_observation_source_primary_core(uuid,uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'authenticated cannot bypass primary-flag validation through the old core'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.link_venue_fact_observation_source(uuid,uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'authenticated may execute the canonical primary-link RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c8111111-1111-4111-8111-111111111111","role":"authenticated"}',true
);

select throws_ok(
  $$select public.link_venue_fact_observation_source(
    'c8000000-0000-4000-8000-000000000001',
    'c8000000-0000-4000-8000-000000000041',
    'c8000000-0000-4000-8000-000000000051',
    null
  )$$,
  '22023',
  'venue fact evidence link unavailable',
  'NULL primary flag rejected instead of silently becoming false'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id='c8000000-0000-4000-8000-000000000001'
  ),
  0::bigint,
  'rejected NULL primary flag leaves no partial link'
);

select is(
  public.link_venue_fact_observation_source(
    'c8000000-0000-4000-8000-000000000001',
    'c8000000-0000-4000-8000-000000000041',
    'c8000000-0000-4000-8000-000000000051',
    false
  ) ->> 'is_primary',
  'false',
  'canonical false primary flag remains accepted'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id='c8000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'canonical false creates exactly one link'
);

select is(
  public.link_venue_fact_observation_source(
    'c8000000-0000-4000-8000-000000000001',
    'c8000000-0000-4000-8000-000000000041',
    'c8000000-0000-4000-8000-000000000051',
    true
  ) ->> 'is_primary',
  'true',
  'canonical true primary flag remains accepted'
);
select is(
  (
    select is_primary from public.observation_sources
    where project_id='c8000000-0000-4000-8000-000000000001'
      and observation_id='c8000000-0000-4000-8000-000000000041'
      and source_id='c8000000-0000-4000-8000-000000000051'
  ),
  true,
  'canonical true updates the existing link without duplication'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id='c8000000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'primary-flag update preserves one observation/source relationship'
);

reset role;
select * from finish();
rollback;