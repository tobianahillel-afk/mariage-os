begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'b1111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','timestamp-domain-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  'b1000000-0000-4000-8000-000000000001',
  'Timestamp domain project',
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  'b1000000-0000-4000-8000-000000000001',
  'b1111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  'b1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000001',
  'TD1','Timestamp domain venue','research',
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values (
  'b1000000-0000-4000-8000-000000000021',
  'b1000000-0000-4000-8000-000000000001',
  'timestamp_domain','Timestamp domain','venue','boolean','important',false,
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values (
  'b1000000-0000-4000-8000-000000000031',
  'b1000000-0000-4000-8000-000000000001',
  'venue','b1000000-0000-4000-8000-000000000011',
  'b1000000-0000-4000-8000-000000000021','unknown',null,
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_create_source_at(target_observed_at timestamptz)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.create_venue_fact_source(
    'b1000000-0000-4000-8000-000000000001',
    'written_confirmation','Timestamp source',null,'confirmed_for_event',
    target_observed_at,null,'active'
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_append_at(target_observed_at timestamptz)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.append_venue_fact_observation(
    'b1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000031',
    'true'::jsonb,null,'confirmed_for_event','high',target_observed_at,null,null
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_set_freshness(target_last_verified_at timestamptz)
returns boolean language plpgsql as $$
begin
  perform public.set_venue_fact_freshness(
    'b1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000031',
    1,target_last_verified_at,null
  );
  return true;
exception when others then
  return false;
end$$;

create function pg_temp.try_force_source_at(target_observed_at timestamptz)
returns boolean language plpgsql security definer as $$
begin
  insert into public.sources(
    project_id,source_type,title,evidence_level,observed_at,status,
    created_by,updated_by
  ) values (
    'b1000000-0000-4000-8000-000000000001','written_confirmation',
    'Forced timestamp source','confirmed_for_event',target_observed_at,'active',
    'b1111111-1111-4111-8111-111111111111',
    'b1111111-1111-4111-8111-111111111111'
  );
  return true;
exception when others then
  return false;
end$$;

create function pg_temp.try_force_resolved_at(target_resolved_at timestamptz)
returns boolean language plpgsql security definer as $$
begin
  update public.facts
  set resolved_at = target_resolved_at
  where id = 'b1000000-0000-4000-8000-000000000031';
  return true;
exception when others then
  return false;
end$$;

select ok(
  public.fact_instant_in_application_domain(
    '0001-01-01 00:00:00+00'::timestamptz
  ),
  'application timestamp domain includes the first four-digit UTC instant'
);
select ok(
  public.fact_instant_in_application_domain(
    '9999-12-31 23:59:59.999999+00'::timestamptz
  ),
  'application timestamp domain includes PostgreSQL microseconds at upper edge'
);
select ok(
  not public.fact_instant_in_application_domain(
    '0001-01-01 00:00:00 BC'::timestamptz
  ),
  'application timestamp domain rejects the finite pre-year-1 range'
);
select ok(
  not public.fact_instant_in_application_domain(
    '10000-01-01 00:00:00+00'::timestamptz
  ),
  'application timestamp domain rejects finite five-digit UTC years'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.fact_instant_in_application_domain(timestamp with time zone)',
    'EXECUTE'
  ),
  'authenticated cannot invoke the internal timestamp-domain primitive directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.try_create_source_at('10000-01-01 00:00:00+00'::timestamptz),
  null::jsonb,
  'direct source RPC cannot persist a finite five-digit-year timestamp'
);
select is(
  (select count(*) from public.sources where project_id='b1000000-0000-4000-8000-000000000001'),
  0::bigint,
  'rejected source mutation remains atomic'
);

select is(
  pg_temp.try_append_at('0001-01-01 00:00:00+01'::timestamptz),
  null::jsonb,
  'direct observation RPC cannot persist an offset-normalized pre-year-1 instant'
);
select is(
  (select count(*) from public.fact_observations where fact_id='b1000000-0000-4000-8000-000000000031'),
  0::bigint,
  'rejected observation mutation remains atomic'
);

select ok(
  not pg_temp.try_set_freshness('10000-01-01 00:00:00+00'::timestamptz),
  'freshness RPC cannot persist a finite five-digit-year timestamp'
);
select is(
  (select revision from public.facts where id='b1000000-0000-4000-8000-000000000031'),
  1::bigint,
  'rejected freshness mutation leaves revision unchanged'
);
select is(
  (select last_verified_at from public.facts where id='b1000000-0000-4000-8000-000000000031'),
  null::timestamptz,
  'rejected freshness mutation leaves timestamp unchanged'
);

select isnt(
  pg_temp.try_append_at('2026-09-07 10:11:12.123456+00'::timestamptz),
  null::jsonb,
  'valid PostgreSQL microseconds remain accepted after domain hardening'
);
select isnt(
  public.resolve_venue_fact_from_observation(
    'b1000000-0000-4000-8000-000000000001',
    'b1000000-0000-4000-8000-000000000031',
    (select id from public.fact_observations where fact_id='b1000000-0000-4000-8000-000000000031'),
    1,'known',null
  ),
  null::jsonb,
  'normal retained-fact resolution remains accepted'
);

reset role;

select ok(
  not pg_temp.try_force_source_at('10000-01-01 00:00:00+00'::timestamptz),
  'table constraint blocks privileged source timestamp write-around'
);
select is(
  (select count(*) from public.sources where project_id='b1000000-0000-4000-8000-000000000001'),
  0::bigint,
  'failed privileged source write-around leaves no partial row'
);

select ok(
  not pg_temp.try_force_resolved_at('10000-01-01 00:00:00+00'::timestamptz),
  'table constraint blocks privileged resolved_at timestamp write-around'
);
select ok(
  public.fact_instant_in_application_domain(
    (select resolved_at from public.facts where id='b1000000-0000-4000-8000-000000000031')
  ),
  'failed resolved_at write-around preserves the valid server timestamp'
);

select * from finish();
rollback;
