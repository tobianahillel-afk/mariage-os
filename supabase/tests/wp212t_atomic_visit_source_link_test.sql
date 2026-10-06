begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
(
  '00000000-0000-0000-0000-000000000000',
  'b7111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','wp212t-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'b7222222-2222-4222-8222-222222222222',
  'authenticated','authenticated','wp212t-outsider@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'b7333333-3333-4333-8333-333333333333',
  'authenticated','authenticated','wp212t-revoked@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'b7444444-4444-4444-8444-444444444444',
  'authenticated','authenticated','wp212t-viewer@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values
(
  'b7000000-0000-4000-8000-000000000001','WP212T checked link',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000002','WP212T foreign project',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values
(
  'b7000000-0000-4000-8000-000000000001',
  'b7111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
),
(
  'b7000000-0000-4000-8000-000000000001',
  'b7333333-3333-4333-8333-333333333333',
  'editor','revoked',now(),now()
),
(
  'b7000000-0000-4000-8000-000000000001',
  'b7444444-4444-4444-8444-444444444444',
  'viewer','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values
(
  'b7000000-0000-4000-8000-000000000011',
  'b7000000-0000-4000-8000-000000000001',
  'T1','Atomic checked venue','research',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000012',
  'b7000000-0000-4000-8000-000000000002',
  'T2','Foreign checked venue','research',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values
(
  'b7000000-0000-4000-8000-000000000021',
  'b7000000-0000-4000-8000-000000000001',
  'visit_width','Visit width','venue','number','important',false,
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000022',
  'b7000000-0000-4000-8000-000000000002',
  'visit_width','Visit width','venue','number','important',false,
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values
(
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000001',
  'venue','b7000000-0000-4000-8000-000000000011',
  'b7000000-0000-4000-8000-000000000021',
  'unknown',null,
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000032',
  'b7000000-0000-4000-8000-000000000002',
  'venue','b7000000-0000-4000-8000-000000000012',
  'b7000000-0000-4000-8000-000000000022',
  'unknown',null,
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

insert into public.fact_observations(
  id,project_id,fact_id,value,raw_value_text,evidence_level,confidence,
  observation_status,observed_at,note,created_by
)
select
  observation_id,
  'b7000000-0000-4000-8000-000000000001'::uuid,
  'b7000000-0000-4000-8000-000000000031'::uuid,
  '12.5'::jsonb,'12.5 m','observed','high','active',
  '2026-10-06T12:00:00Z'::timestamptz,'Visit measurement',
  'b7111111-1111-4111-8111-111111111111'::uuid
from unnest(array[
  'b7000000-0000-4000-8000-000000000041'::uuid,
  'b7000000-0000-4000-8000-000000000042'::uuid,
  'b7000000-0000-4000-8000-000000000043'::uuid,
  'b7000000-0000-4000-8000-000000000044'::uuid,
  'b7000000-0000-4000-8000-000000000045'::uuid,
  'b7000000-0000-4000-8000-000000000046'::uuid,
  'b7000000-0000-4000-8000-000000000047'::uuid,
  'b7000000-0000-4000-8000-000000000048'::uuid
]) as ids(observation_id);

insert into public.fact_observations(
  id,project_id,fact_id,value,raw_value_text,evidence_level,confidence,
  observation_status,observed_at,note,created_by
) values (
  'b7000000-0000-4000-8000-000000000049',
  'b7000000-0000-4000-8000-000000000002',
  'b7000000-0000-4000-8000-000000000032',
  '12.5'::jsonb,'12.5 m','observed','high','active',
  '2026-10-06T12:00:00Z'::timestamptz,'Foreign visit measurement',
  'b7111111-1111-4111-8111-111111111111'
);

insert into public.sources(
  id,project_id,source_type,title,url,evidence_level,observed_at,notes,status,
  created_by,updated_by
) values
(
  'b7000000-0000-4000-8000-000000000051',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Correct visit source',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000052',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Type changes after read',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000053',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Revision changes after read',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000054',
  'b7000000-0000-4000-8000-000000000001',
  'official_website','Wrong current type',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000055',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Outsider target',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000056',
  'b7000000-0000-4000-8000-000000000002',
  'in_person_visit','Foreign-project source',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000057',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Revoked member target',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
),
(
  'b7000000-0000-4000-8000-000000000058',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Read-only member target',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.link_venue_fact_observation_source_checked(uuid,uuid,uuid,boolean,text,bigint)',
    'EXECUTE'
  ),
  'authenticated may execute the checked visit-source link RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.link_venue_fact_observation_source_checked(uuid,uuid,uuid,boolean,text,bigint)',
    'EXECUTE'
  ),
  'anon cannot execute the checked visit-source link RPC'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.link_venue_fact_observation_source(uuid,uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'accepted general link RPC remains executable'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b7111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000041',
    'b7000000-0000-4000-8000-000000000051',
    true,
    'in_person_visit',
    1
  ) ->> 'source_id',
  'b7000000-0000-4000-8000-000000000051',
  'exact in-person source type and revision link successfully'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id='b7000000-0000-4000-8000-000000000001'
      and observation_id='b7000000-0000-4000-8000-000000000041'
      and source_id='b7000000-0000-4000-8000-000000000051'
      and is_primary
  ),
  1::bigint,
  'successful checked link creates exactly one primary relationship'
);

select lives_ok(
  $$select public.update_venue_fact_source(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000052',
    1,
    'official_website',
    'Type changed after read',
    null,
    'observed',
    '2026-10-06T12:00:00.000Z',
    null,
    'active'
  )$$,
  'authorized source type may change after an earlier replay read'
);
select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000042',
    'b7000000-0000-4000-8000-000000000052',
    true,
    'in_person_visit',
    1
  )$$,
  '40001',
  'stale venue fact evidence source provenance',
  'changed source type/revision is rejected atomically'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000042'
  ),
  0::bigint,
  'stale type/revision failure creates no link'
);

select lives_ok(
  $$select public.update_venue_fact_source(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000053',
    1,
    'in_person_visit',
    'Revision changed only',
    null,
    'observed',
    '2026-10-06T12:00:00.000Z',
    null,
    'active'
  )$$,
  'source revision can advance without changing visit source type'
);
select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000043',
    'b7000000-0000-4000-8000-000000000053',
    false,
    'in_person_visit',
    1
  )$$,
  '40001',
  'stale venue fact evidence source provenance',
  'stale source revision alone is rejected'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000043'
  ),
  0::bigint,
  'stale revision failure creates no link'
);

select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000044',
    'b7000000-0000-4000-8000-000000000054',
    true,
    'in_person_visit',
    1
  )$$,
  '40001',
  'stale venue fact evidence source provenance',
  'wrong current source type is rejected'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000044'
  ),
  0::bigint,
  'wrong current source type creates no link'
);

select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000044',
    'b7000000-0000-4000-8000-000000000054',
    true,
    'official_website',
    1
  )$$,
  '22023',
  'venue fact evidence link unavailable',
  'checked visit boundary refuses a non-visit expected source type'
);

select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000046',
    'b7000000-0000-4000-8000-000000000056',
    true,
    'in_person_visit',
    1
  )$$,
  '42501',
  'venue fact evidence link unavailable',
  'cross-project source identity fails non-disclosing'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000046'
  ),
  0::bigint,
  'cross-project failure creates no link'
);

select throws_ok(
  $select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000049',
    'b7000000-0000-4000-8000-000000000051',
    true,
    'in_person_visit',
    1
  )$,
  '42501',
  'venue fact evidence link unavailable',
  'cross-project observation identity fails non-disclosing'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000049'
  ),
  0::bigint,
  'cross-project observation failure creates no link'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"b7222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000045',
    'b7000000-0000-4000-8000-000000000055',
    true,
    'in_person_visit',
    1
  )$$,
  '42501',
  'venue fact evidence link unavailable',
  'non-member cannot call the checked link boundary'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000045'
  ),
  0::bigint,
  'authorization failure creates no link'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"b7333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select throws_ok(
  $select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000047',
    'b7000000-0000-4000-8000-000000000057',
    true,
    'in_person_visit',
    1
  )$,
  '42501',
  'venue fact evidence link unavailable',
  'revoked project member cannot call the checked link boundary'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000047'
  ),
  0::bigint,
  'revoked-member denial creates no link'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"b7444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select throws_ok(
  $select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000048',
    'b7000000-0000-4000-8000-000000000058',
    true,
    'in_person_visit',
    1
  )$,
  '42501',
  'venue fact evidence link unavailable',
  'active viewer without venues.write cannot call the checked link boundary'
);
select is(
  (
    select count(*) from public.observation_sources
    where observation_id='b7000000-0000-4000-8000-000000000048'
  ),
  0::bigint,
  'read-only member denial creates no link'
);

reset role;
select * from finish();
rollback;
