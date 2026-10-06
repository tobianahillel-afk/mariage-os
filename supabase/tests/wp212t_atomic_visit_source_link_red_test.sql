begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a7111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','wp212t-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  'a7000000-0000-4000-8000-000000000001','WP212T RED',
  'a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  'a7000000-0000-4000-8000-000000000001',
  'a7111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000011',
  'a7000000-0000-4000-8000-000000000001',
  'T1','Atomic provenance venue','research',
  'a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000021',
  'a7000000-0000-4000-8000-000000000001',
  'visit_width','Visit width','venue','number','important',false,
  'a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000031',
  'a7000000-0000-4000-8000-000000000001',
  'venue','a7000000-0000-4000-8000-000000000011',
  'a7000000-0000-4000-8000-000000000021',
  'unknown',null,
  'a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);

insert into public.fact_observations(
  id,project_id,fact_id,value,raw_value_text,evidence_level,confidence,
  observation_status,observed_at,note,created_by
) values (
  'a7000000-0000-4000-8000-000000000041',
  'a7000000-0000-4000-8000-000000000001',
  'a7000000-0000-4000-8000-000000000031',
  '12.5'::jsonb,'12.5 m','observed','high','active',
  '2026-10-06T12:00:00Z'::timestamptz,'Visit measurement',
  'a7111111-1111-4111-8111-111111111111'
);

insert into public.sources(
  id,project_id,source_type,title,url,evidence_level,observed_at,notes,status,
  created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000051',
  'a7000000-0000-4000-8000-000000000001',
  'in_person_visit','Visit source',null,'observed',
  '2026-10-06T12:00:00Z'::timestamptz,null,'active',
  'a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_legacy_link() returns boolean
language plpgsql as $$
begin
  perform public.link_venue_fact_observation_source(
    'a7000000-0000-4000-8000-000000000001',
    'a7000000-0000-4000-8000-000000000041',
    'a7000000-0000-4000-8000-000000000051',
    true
  );
  return true;
exception when others then
  return false;
end
$$;

select ok(
  has_function_privilege(
    'authenticated',
    'public.link_venue_fact_observation_source(uuid,uuid,uuid,boolean)',
    'EXECUTE'
  ),
  'accepted general link RPC remains executable'
);

select has_function(
  'public',
  'link_venue_fact_observation_source_checked',
  array['uuid','uuid','uuid','boolean','text','bigint'],
  'visit replay has an atomic type/revision checked link RPC'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a7111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  (select source_type from public.sources where id='a7000000-0000-4000-8000-000000000051'),
  'in_person_visit',
  'replay initially observes in-person provenance'
);
select is(
  (select revision from public.sources where id='a7000000-0000-4000-8000-000000000051'),
  1::bigint,
  'replay initially observes source revision one'
);

select lives_ok(
  $$select public.update_venue_fact_source(
    'a7000000-0000-4000-8000-000000000001',
    'a7000000-0000-4000-8000-000000000051',
    1,
    'official_website',
    'Visit source changed after read',
    null,
    'observed',
    '2026-10-06T12:00:00.000Z',
    null,
    'active'
  )$$,
  'another authorized write can change source provenance after the replay read'
);

select is(
  (select source_type from public.sources where id='a7000000-0000-4000-8000-000000000051'),
  'official_website',
  'source type changed before link'
);
select is(
  (select revision from public.sources where id='a7000000-0000-4000-8000-000000000051'),
  2::bigint,
  'source revision changed before link'
);

select ok(
  not pg_temp.try_legacy_link(),
  'stale visit provenance must be rejected at link time'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id='a7000000-0000-4000-8000-000000000001'
      and observation_id='a7000000-0000-4000-8000-000000000041'
      and source_id='a7000000-0000-4000-8000-000000000051'
  ),
  0::bigint,
  'rejected stale provenance leaves no observation/source link'
);

reset role;
select * from finish();
rollback;
