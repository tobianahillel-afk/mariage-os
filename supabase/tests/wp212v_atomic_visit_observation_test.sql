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
  'b7000000-0000-4000-8000-000000000048'::uuid,
  'b7000000-0000-4000-8000-00000000004a'::uuid,
  'b7000000-0000-4000-8000-00000000004b'::uuid,
  'b7000000-0000-4000-8000-00000000004c'::uuid,
  'b7000000-0000-4000-8000-00000000004d'::uuid,
  'b7000000-0000-4000-8000-00000000004e'::uuid,
  'b7000000-0000-4000-8000-00000000004f'::uuid,
  'b7000000-0000-4000-8000-000000000040'::uuid
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
),
(
  'b7000000-0000-4000-8000-000000000059',
  'b7000000-0000-4000-8000-000000000001',
  'in_person_visit','Validation evidence target',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'b7111111-1111-4111-8111-111111111111',
  'b7111111-1111-4111-8111-111111111111'
);

-- Security and shape contracts, retained from isolated RED PR #127.
select ok(to_regprocedure('public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)') is not null, 'atomic visit command exists');
select is((
  select pg_catalog.pg_get_function_result(p.oid)
  from pg_catalog.pg_proc p
  where p.oid=to_regprocedure('public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)')
),'jsonb','atomic command returns JSON receipt');
select ok(coalesce((
  select p.prosecdef
  from pg_catalog.pg_proc p
  where p.oid=to_regprocedure('public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)')
),false),'atomic command has privileged boundary');
select ok(coalesce((
  select 'search_path=pg_catalog'=any(p.proconfig)
  from pg_catalog.pg_proc p
  where p.oid=to_regprocedure('public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)')
),false),'atomic command uses fixed search_path');
select ok(has_function_privilege('authenticated','public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)','EXECUTE'),'authenticated may call atomic visit command');
select ok(not has_function_privilege('anon','public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)','EXECUTE'),'anon cannot execute privileged atomic RPC');

set local role anon;
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
)$call$,
'42501','permission denied for function append_venue_fact_observation_visit_atomic',
'anonymous role is denied at RPC grant boundary');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b7111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'checkedSource' ->> 'checkedRevision'),'1','locked source revision is present in atomic receipt');
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'checkedSource' ->> 'sourceType'),'in_person_visit','locked source type is present in receipt');
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'checkedSource' ->> 'checkedBy'),'b7111111-1111-4111-8111-111111111111','receipt binds to actual authenticated actor');
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'observation' ->> 'id'),'b7000000-0000-4000-8000-000000000061','canonical observation identity is returned');
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'link' ->> 'source_id'),'b7000000-0000-4000-8000-000000000051','canonical checked link identity is returned');
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000061'),1::bigint,'lost ACK replay never duplicates observation');
select is((select count(*) from public.observation_sources where observation_id='b7000000-0000-4000-8000-000000000061' and is_primary),1::bigint,'lost ACK replay never duplicates primary link');

select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'observation' ->> 'supersedes_observation_id'),null::text,
'atomic receipt confirms that an ordinary observation has no predecessor');

-- All still-granted primary-link RPCs must share the database invariant,
-- not merely the new atomic RPC's advisory lock.
select throws_ok($legacy_primary$select public.link_venue_fact_observation_source(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000061',
  'b7000000-0000-4000-8000-000000000052',
  true
)$legacy_primary$,
'23505',
'duplicate key value violates unique constraint "observation_sources_one_primary_per_observation_idx"',
'legacy public link cannot introduce a second primary on an atomically linked observation');

select throws_ok($checked_primary$select public.link_venue_fact_observation_source_checked(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000061',
  'b7000000-0000-4000-8000-000000000052',
  true, 'in_person_visit', 1
)$checked_primary$,
'23505',
'duplicate key value violates unique constraint "observation_sources_one_primary_per_observation_idx"',
'checked public link cannot introduce a second primary on an atomically linked observation');

select is((select count(*) from public.observation_sources
  where project_id='b7000000-0000-4000-8000-000000000001'
    and observation_id='b7000000-0000-4000-8000-000000000061'
    and is_primary),1::bigint,
'legacy and checked rejected writes leave the canonical primary unchanged');

-- A different source cannot become primary for the same observation even
-- when its source row is separate from the already locked primary source.
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000052',1
)$call$,'23505','venue visit observation provenance conflict',
'a different source cannot create a second primary on the same observation');
select is((select count(*) from public.observation_sources
  where observation_id='b7000000-0000-4000-8000-000000000061'
    and is_primary),1::bigint,'primary source remains unique after conflict');
select ok(pg_catalog.strpos(
  pg_catalog.pg_get_functiondef(to_regprocedure(
    'public.append_venue_fact_observation_visit_atomic(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid,uuid,bigint)'
  )), 'pg_advisory_xact_lock'
) > 0, 'atomic command serializes concurrent calls on observation identity');

-- The new observation must prove exactly which predecessor it superseded.
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000068',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',
  'b7000000-0000-4000-8000-000000000040',
  'b7000000-0000-4000-8000-000000000051',1
) -> 'observation' ->> 'supersedes_observation_id'),
'b7000000-0000-4000-8000-000000000040',
'atomic receipt binds successful supersession to the prior observation');
select is((select superseded_by_observation_id::text
  from public.fact_observations
  where id='b7000000-0000-4000-8000-000000000040'),
'b7000000-0000-4000-8000-000000000068',
'the predecessor database row confirms the exact successor');


select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000062',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',2
)$call$,
'PT412','stale venue visit source provenance','stale source revision rejects the transaction');
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000062'),0::bigint,'stale revision creates no orphan observation');

select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000063',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000054',1
)$call$,
'PT412','stale venue visit source provenance','invalid current source type rejects the transaction');
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000063'),0::bigint,'wrong source type creates no observation');

select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000064',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000056',1
)$call$,
'42501','venue visit observation unavailable','foreign-project source fails non-disclosing');
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000064'),0::bigint,'foreign source creates no observation');

select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000061',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Changed replay note',null,
  'b7000000-0000-4000-8000-000000000051',1
)$call$,
'23505','venue fact observation conflict','same stable observation ID rejects changed immutable intent');
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000061'),1::bigint,'changed-intent retry does not duplicate observation');

-- A historical two-call success may have committed a matching observation only.
select is((public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000041',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
) -> 'link' ->> 'source_id'),'b7000000-0000-4000-8000-000000000051','matching historical orphan is repaired under the checked source lock');
select is((select count(*) from public.observation_sources where observation_id='b7000000-0000-4000-8000-000000000041' and is_primary),1::bigint,'historical replay repairs one primary link');

-- A historical primary link to a different source must not be reassigned.
select lives_ok(
  $wp212v_link$select public.link_venue_fact_observation_source_checked(
    'b7000000-0000-4000-8000-000000000001',
    'b7000000-0000-4000-8000-000000000042',
    'b7000000-0000-4000-8000-000000000059',
    true, 'in_person_visit', 1
  )$wp212v_link$,
  'historical observation starts with a valid different primary source'
);
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000042',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
)$call$,
'23505','venue visit observation provenance conflict','foreign primary provenance cannot be silently reassigned');
select is((select count(*) from public.observation_sources where observation_id='b7000000-0000-4000-8000-000000000042' and source_id='b7000000-0000-4000-8000-000000000059' and is_primary),1::bigint,'conflicting historical primary provenance remains unchanged');

select set_config('request.jwt.claims','{"sub":"b7222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000065',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000051',1
)$call$,
'42501','venue visit observation unavailable','non-member is denied before any append');
reset role;
select is((select count(*) from public.fact_observations where id='b7000000-0000-4000-8000-000000000065'),0::bigint,'denied member cannot leave orphan observation');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"b7333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000066',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000057',1
)$call$,'42501','venue visit observation unavailable',
'revoked editor is denied at atomic RPC boundary');

select set_config('request.jwt.claims','{"sub":"b7444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
select throws_ok($call$select public.append_venue_fact_observation_visit_atomic(
  'b7000000-0000-4000-8000-000000000001',
  'b7000000-0000-4000-8000-000000000031',
  'b7000000-0000-4000-8000-000000000067',
  '12.5'::jsonb,'12.5 m','observed','high',
  '2026-10-06T12:00:00.000Z','Visit measurement',null,
  'b7000000-0000-4000-8000-000000000058',1
)$call$,'42501','venue visit observation unavailable',
'active read-only viewer cannot write through the privileged RPC');
reset role;
select is((select count(*) from public.fact_observations
  where id in ('b7000000-0000-4000-8000-000000000066',
               'b7000000-0000-4000-8000-000000000067')),
  0::bigint,'revoked/editor and viewer denial leave no observation writes');
select is((select count(*) from public.observation_sources
  where observation_id in ('b7000000-0000-4000-8000-000000000066',
                           'b7000000-0000-4000-8000-000000000067')),
  0::bigint,'revoked/editor and viewer denial leave no provenance links');
select * from finish();
rollback;
