begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','boundary-parity-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by) values (
  'a1000000-0000-4000-8000-000000000001',
  'Boundary parity project',
  'a1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values (
  'a1000000-0000-4000-8000-000000000001',
  'a1111111-1111-4111-8111-111111111111',
  'owner','active',now(),null
);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  'a1000000-0000-4000-8000-000000000011',
  'a1000000-0000-4000-8000-000000000001',
  'BP1','Boundary parity venue','research',
  'a1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values (
  'a1000000-0000-4000-8000-000000000021',
  'a1000000-0000-4000-8000-000000000001',
  'boundary_boolean','Boundary boolean','venue','boolean','important',false,
  'a1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111'
);

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values (
  'a1000000-0000-4000-8000-000000000031',
  'a1000000-0000-4000-8000-000000000001',
  'venue','a1000000-0000-4000-8000-000000000011',
  'a1000000-0000-4000-8000-000000000021','unknown',null,
  'a1111111-1111-4111-8111-111111111111',
  'a1111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_create_definition(
  target_label text,
  target_unit text,
  target_freshness text
)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.create_venue_fact_definition(
    'a1000000-0000-4000-8000-000000000001',
    'review_boundary_text',
    target_label,
    'text',
    target_unit,
    'important',
    null,
    target_freshness,
    null,
    null
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_update_definition(
  target_definition_id uuid,
  target_label text,
  target_freshness text
)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.update_venue_fact_definition(
    'a1000000-0000-4000-8000-000000000001',
    target_definition_id,
    1,
    target_label,
    'important',
    null,
    target_freshness,
    null,
    null
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_create_source_at(target_observed_at timestamptz)
returns jsonb language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.create_venue_fact_source(
    'a1000000-0000-4000-8000-000000000001',
    'written_confirmation',
    'Boundary source',
    null,
    'confirmed_for_event',
    target_observed_at,
    null,
    'active'
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
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000031',
    'true'::jsonb,
    null,
    'confirmed_for_event',
    'high',
    target_observed_at,
    null,
    null
  );
  return result_row;
exception when others then
  return null;
end$$;

create function pg_temp.try_set_freshness(
  target_revision bigint,
  target_last_verified_at timestamptz,
  target_stale_at timestamptz
)
returns boolean language plpgsql as $$
begin
  perform public.set_venue_fact_freshness(
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000031',
    target_revision,
    target_last_verified_at,
    target_stale_at
  );
  return true;
exception when others then
  return false;
end$$;

create function pg_temp.try_force_definition_label(target_label text)
returns boolean language plpgsql security definer as $$
begin
  insert into public.fact_definitions(
    project_id,key,label,entity_type,value_type,priority,system_defined,
    created_by,updated_by
  ) values (
    'a1000000-0000-4000-8000-000000000001',
    'forced_boundary_definition',target_label,'venue','boolean','important',false,
    'a1111111-1111-4111-8111-111111111111',
    'a1111111-1111-4111-8111-111111111111'
  );
  return true;
exception when others then
  return false;
end$$;

select ok(
  not has_function_privilege(
    'authenticated',
    'public.create_venue_fact_definition_core(uuid,text,text,text,text,text,numeric,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot bypass ECMAScript definition-create wrapper'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.update_venue_fact_definition_core(uuid,uuid,bigint,text,text,numeric,text,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated cannot bypass ECMAScript definition-update wrapper'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.try_create_definition(chr(160), null, null),
  null::jsonb,
  'NBSP-only fact-definition label is rejected'
);
select is(
  pg_temp.try_create_definition('Boundary text', chr(160), null),
  null::jsonb,
  'NBSP-only fact-definition unit is rejected'
);
select is(
  pg_temp.try_create_definition('Boundary text', null, chr(65279)),
  null::jsonb,
  'BOM-only fact-definition freshness policy is rejected'
);

select is(
  pg_temp.try_create_definition(
    chr(160) || 'Boundary text' || chr(12288),
    chr(9) || 'people' || chr(160),
    chr(65279) || '30d' || chr(12288)
  ) ->> 'label',
  'Boundary text',
  'definition create wrapper canonically trims ECMAScript label boundaries'
);
select is(
  (select unit from public.fact_definitions where key='review_boundary_text'),
  'people',
  'definition create wrapper canonically trims ECMAScript unit boundaries'
);
select is(
  (select freshness_policy from public.fact_definitions where key='review_boundary_text'),
  '30d',
  'definition create wrapper canonically trims ECMAScript freshness boundaries'
);

select is(
  pg_temp.try_update_definition(
    (select id from public.fact_definitions where key='review_boundary_text'),
    chr(160),
    '30d'
  ),
  null::jsonb,
  'NBSP-only definition label is rejected on update'
);
select is(
  (select label from public.fact_definitions where key='review_boundary_text'),
  'Boundary text',
  'rejected definition update leaves canonical label unchanged'
);
select is(
  (select revision from public.fact_definitions where key='review_boundary_text'),
  1::bigint,
  'rejected definition update leaves revision unchanged'
);

select is(
  pg_temp.try_create_source_at('infinity'::timestamptz),
  null::jsonb,
  'non-finite source observed_at is rejected at persistence boundary'
);
select is(
  pg_temp.try_append_at('infinity'::timestamptz),
  null::jsonb,
  'non-finite observation observed_at is rejected at persistence boundary'
);

select isnt(
  pg_temp.try_append_at('2026-09-07 10:11:12.123456+00'::timestamptz),
  null::jsonb,
  'finite PostgreSQL microsecond observation timestamp remains persistable'
);
select is(
  (select observed_at from public.fact_observations where fact_id='a1000000-0000-4000-8000-000000000031'),
  '2026-09-07 10:11:12.123456+00'::timestamptz,
  'microsecond observation timestamp is stored without corruption'
);

select ok(
  not pg_temp.try_set_freshness(1, 'infinity'::timestamptz, null),
  'non-finite last_verified_at is rejected at persistence boundary'
);
select is(
  (select revision from public.facts where id='a1000000-0000-4000-8000-000000000031'),
  1::bigint,
  'rejected non-finite freshness mutation leaves fact revision unchanged'
);

select isnt(
  public.resolve_venue_fact_from_observation(
    'a1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000031',
    (select id from public.fact_observations where fact_id='a1000000-0000-4000-8000-000000000031'),
    1,
    'known',
    null
  ) ->> 'resolved_at',
  null::text,
  'normal observation resolution returns its server-generated resolved_at timestamp'
);
select ok(
  pg_catalog.isfinite(
    (select resolved_at from public.facts where id='a1000000-0000-4000-8000-000000000031')
  ),
  'server-generated resolved_at remains finite'
);

reset role;

select ok(
  not pg_temp.try_force_definition_label(chr(160)),
  'table/trigger integrity rejects privileged NBSP-only definition write-around'
);

select * from finish();
rollback;
