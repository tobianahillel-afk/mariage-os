begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function(
  'public','create_venue_fact_source',
  array['uuid','text','text','text','text','text','text','text'],
  'public source RPC receives raw timestamp text'
);
select has_function(
  'public','append_venue_fact_observation',
  array['uuid','uuid','jsonb','text','text','text','text','text','uuid'],
  'public observation RPC receives raw timestamp text'
);
select has_function(
  'public','set_venue_fact_freshness',
  array['uuid','uuid','bigint','text','text'],
  'public freshness RPC receives raw timestamp text'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_venue_fact_source_timestamp_core(uuid,text,text,text,text,timestamptz,text,text)',
    'EXECUTE'
  ),
  'authenticated cannot bypass source raw-text parsing through timestamptz core'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.append_venue_fact_observation_timestamp_core(uuid,uuid,jsonb,text,text,text,timestamptz,text,uuid)',
    'EXECUTE'
  ),
  'authenticated cannot bypass observation raw-text parsing through timestamptz core'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.set_venue_fact_freshness_timestamp_core(uuid,uuid,bigint,timestamptz,timestamptz)',
    'EXECUTE'
  ),
  'authenticated cannot bypass freshness raw-text parsing through timestamptz core'
);
select ok(
  not has_function_privilege(
    'authenticated','public.fact_parse_application_instant(text)','EXECUTE'
  ),
  'strict DB timestamp parser is internal'
);

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a7111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','rpc-grammar-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);
insert into public.projects(id,name,created_by,updated_by) values (
  'a7000000-0000-4000-8000-000000000001','RPC grammar project',
  'a7111111-1111-4111-8111-111111111111','a7111111-1111-4111-8111-111111111111'
);
insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  'a7000000-0000-4000-8000-000000000001','a7111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);
insert into public.venues(id,project_id,code,name,status,created_by,updated_by) values (
  'a7000000-0000-4000-8000-000000000011','a7000000-0000-4000-8000-000000000001',
  'RG1','RPC grammar venue','research','a7111111-1111-4111-8111-111111111111',
  'a7111111-1111-4111-8111-111111111111'
);
insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000021','a7000000-0000-4000-8000-000000000001',
  'rpc_timestamp_grammar','RPC timestamp grammar','venue','boolean','important',false,
  'a7111111-1111-4111-8111-111111111111','a7111111-1111-4111-8111-111111111111'
);
insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,created_by,updated_by
) values (
  'a7000000-0000-4000-8000-000000000031','a7000000-0000-4000-8000-000000000001',
  'venue','a7000000-0000-4000-8000-000000000011','a7000000-0000-4000-8000-000000000021',
  'unknown',null,'a7111111-1111-4111-8111-111111111111','a7111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_source(raw_timestamp text)
returns jsonb language plpgsql as $$
declare saved jsonb;
begin
  saved := public.create_venue_fact_source(
    'a7000000-0000-4000-8000-000000000001','written_confirmation',
    'RPC timestamp source',null,'confirmed_for_event',raw_timestamp,null,'active'
  );
  return saved;
exception when others then return null;
end$$;

create function pg_temp.try_observation(raw_timestamp text)
returns jsonb language plpgsql as $$
declare saved jsonb;
begin
  saved := public.append_venue_fact_observation(
    'a7000000-0000-4000-8000-000000000001','a7000000-0000-4000-8000-000000000031',
    'true'::jsonb,null,'confirmed_for_event','high',raw_timestamp,null,null
  );
  return saved;
exception when others then return null;
end$$;

create function pg_temp.try_freshness(raw_verified text, raw_stale text, expected_revision bigint)
returns boolean language plpgsql as $$
begin
  perform public.set_venue_fact_freshness(
    'a7000000-0000-4000-8000-000000000001','a7000000-0000-4000-8000-000000000031',
    expected_revision,raw_verified,raw_stale
  );
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a7111111-1111-4111-8111-111111111111","role":"authenticated"}',true
);

select is(
  pg_temp.try_source('2026-09-07 10:11:12 UTC'),null::jsonb,
  'source RPC rejects PostgreSQL-friendly non-canonical timestamp syntax'
);
select is(
  pg_temp.try_source('2026-09-07T10:11:12+00'),null::jsonb,
  'source RPC rejects offset syntax outside frozen plus-or-minus HH:mm grammar'
);
select is(
  (select count(*) from public.sources where project_id='a7000000-0000-4000-8000-000000000001'),
  0::bigint,'rejected source grammar remains atomic'
);

select is(
  pg_temp.try_observation('September 7 2026 10:11:12 UTC'),null::jsonb,
  'observation RPC rejects textual PostgreSQL date syntax before coercion'
);
select is(
  (select count(*) from public.fact_observations where fact_id='a7000000-0000-4000-8000-000000000031'),
  0::bigint,'rejected observation grammar remains atomic'
);

select ok(
  not pg_temp.try_freshness('2026-09-07 10:11:12+00','2026-10-07T10:11:12Z',1),
  'freshness RPC rejects non-canonical raw verified timestamp'
);
select is(
  (select revision from public.facts where id='a7000000-0000-4000-8000-000000000031'),
  1::bigint,'rejected freshness grammar leaves revision unchanged'
);

select isnt(
  pg_temp.try_source('2026-09-07T10:11:12.123456+00:00'),null::jsonb,
  'canonical source microseconds remain accepted'
);
select is(
  (select observed_at from public.sources where project_id='a7000000-0000-4000-8000-000000000001'),
  '2026-09-07T10:11:12.123456Z'::timestamptz,
  'canonical source microseconds are preserved in PostgreSQL'
);
select isnt(
  pg_temp.try_observation('2026-09-07T10:11:12.654321Z'),null::jsonb,
  'canonical observation microseconds remain accepted'
);
select ok(
  pg_temp.try_freshness('2026-09-07T10:11:12Z','2026-10-07T10:11:12.999999+00:00',1),
  'canonical freshness timestamps remain accepted'
);
select ok(
  pg_temp.try_freshness(null,null,2),
  'nullable freshness reset semantics remain accepted'
);

reset role;
select * from finish();
rollback;
