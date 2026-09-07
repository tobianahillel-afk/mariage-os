begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  public.fact_evaluation_rule_valid(
    'boolean', null,
    '{"type":"custom_manual_assessment","accepted":true}'
  ),
  'boolean manual assessment accepts a canonical boolean target'
);
select ok(
  not public.fact_evaluation_rule_valid(
    'boolean', null,
    '{"type":"custom_manual_assessment"}'
  ),
  'manual assessment requires accepted'
);
select ok(
  not public.fact_evaluation_rule_valid(
    'boolean', null,
    '{"type":"custom_manual_assessment","accepted":"true"}'
  ),
  'manual assessment accepted value keeps boolean type parity'
);
select ok(
  public.fact_evaluation_rule_valid(
    'select',
    '{"options":[{"key":"yes","labelKey":"yes"},{"key":"no","labelKey":"no"}]}',
    '{"type":"custom_manual_assessment","accepted":"yes"}'
  ),
  'select manual assessment accepts a declared option'
);
select ok(
  not public.fact_evaluation_rule_valid(
    'select',
    '{"options":[{"key":"yes","labelKey":"yes"},{"key":"no","labelKey":"no"}]}',
    '{"type":"custom_manual_assessment","accepted":"maybe"}'
  ),
  'select manual assessment rejects an undeclared option'
);
select ok(
  public.fact_evaluation_rule_valid(
    'rating', '{"min":1,"max":5,"integer":true}',
    '{"type":"custom_manual_assessment","accepted":4}'
  ),
  'rating manual assessment accepts a canonical rating'
);
select ok(
  not public.fact_evaluation_rule_valid(
    'rating', '{"min":1,"max":5,"integer":true}',
    '{"type":"custom_manual_assessment","accepted":4.5}'
  ),
  'rating manual assessment obeys integer constraints'
);

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'e1111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','criteria-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);
insert into public.projects(id,name,created_by,updated_by)
values(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Criteria',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);
insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e1111111-1111-4111-8111-111111111111','owner','active',now()
);
insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values (
  'ee100000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','E1','Criteria Venue','research',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

select throws_ok(
  $$insert into public.fact_definitions(
      id,project_id,key,label,entity_type,value_type,priority,system_defined,
      evaluation_rule_json,created_by,updated_by
    ) values (
      'ee200000-0000-4000-8000-000000000010',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','wrong_dynamic_key','Wrong',
      'venue','boolean','blocking',true,
      '{"type":"project_target_guest_count_supported"}',
      'e1111111-1111-4111-8111-111111111111',
      'e1111111-1111-4111-8111-111111111111'
    )$$,
  '23514',
  'venue criterion system definition unavailable',
  'dynamic guest rule is reserved to its canonical key'
);
select throws_ok(
  $$insert into public.fact_definitions(
      id,project_id,key,label,entity_type,value_type,priority,system_defined,
      evaluation_rule_json,created_by,updated_by
    ) values (
      'ee200000-0000-4000-8000-000000000011',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'target_guest_count_supported','Wrong target','venue','boolean','important',
      true,'{"type":"project_target_guest_count_supported"}',
      'e1111111-1111-4111-8111-111111111111',
      'e1111111-1111-4111-8111-111111111111'
    )$$,
  '23514',
  'venue criterion system definition unavailable',
  'derived target key requires its exact blocking shape'
);
select throws_ok(
  $$insert into public.fact_definitions(
      id,project_id,key,label,entity_type,value_type,unit,priority,system_defined,
      options_json,evaluation_rule_json,created_by,updated_by
    ) values (
      'ee200000-0000-4000-8000-000000000012',
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'two_dance_areas_max_guest_estimate','Wrong ceiling','venue','number',null,
      'important',true,'{"min":0,"integer":true}',
      '{"type":"number_min","minimum":0}',
      'e1111111-1111-4111-8111-111111111111',
      'e1111111-1111-4111-8111-111111111111'
    )$$,
  '23514',
  'venue criterion system definition unavailable',
  'support ceiling key requires people units'
);

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  evaluation_rule_json,created_by,updated_by
) values (
  'ee200000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'target_guest_count_supported','Target supported','venue','boolean','blocking',
  true,'{"type":"project_target_guest_count_supported"}',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);
insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,unit,priority,system_defined,
  options_json,evaluation_rule_json,created_by,updated_by
) values (
  'ee200000-0000-4000-8000-000000000002',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'two_dance_areas_max_guest_estimate','Two dance areas ceiling','venue',
  'number','people','important',true,'{"min":0,"integer":true}',
  '{"type":"number_min","minimum":0}',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_create(k text,t text,u text,p text,o jsonb,r jsonb)
returns boolean language plpgsql as $$
begin
  perform public.create_venue_fact_definition(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',k,'Synthetic '||k,t,u,p,3,null,o,r
  );
  return true;
exception when others then
  return false;
end$$;
create function pg_temp.try_set(d uuid,rev bigint,s text,x jsonb)
returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee100000-0000-4000-8000-000000000001',d,rev,s,x
  );
  return true;
exception when others then
  return false;
end$$;
create function pg_temp.try_observe(f uuid,x jsonb)
returns boolean language plpgsql as $$
begin
  perform public.append_venue_fact_observation(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',f,x,null,'estimated','medium',
    '2026-09-07T18:00:00Z',null,null
  );
  return true;
exception when others then
  return false;
end$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select ok(
  not pg_temp.try_create(
    'target_guest_count_supported','boolean',null,'blocking',null,
    '{"type":"project_target_guest_count_supported"}'
  ),
  'authorized custom-definition RPC cannot claim the derived system key'
);
select ok(
  not pg_temp.try_create(
    'wrong_dynamic_rpc','boolean',null,'blocking',null,
    '{"type":"project_target_guest_count_supported"}'
  ),
  'authorized custom-definition RPC cannot reuse the dynamic system rule'
);
select ok(
  not pg_temp.try_create(
    'two_dance_areas_max_guest_estimate','number','people','important',
    '{"min":0,"integer":true}','{"type":"number_min","minimum":0}'
  ),
  'authorized custom-definition RPC cannot claim the support system key'
);
select ok(
  not pg_temp.try_set(
    'ee200000-0000-4000-8000-000000000001',null,'unknown',null
  ),
  'derived criterion cannot persist even an unknown retained fact'
);
select ok(
  pg_temp.try_set(
    'ee200000-0000-4000-8000-000000000002',null,'known','170'
  ),
  'support ceiling remains writable through the authorized fact RPC'
);
select ok(
  pg_temp.try_observe(
    (select id from public.facts
      where definition_id = 'ee200000-0000-4000-8000-000000000002'),
    '170'
  ),
  'ordinary support facts still accept observations'
);

reset role;
alter table public.facts disable trigger facts_wp25_derived_read_only;
insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,
  created_by,updated_by
) values (
  'ee300000-0000-4000-8000-000000000001',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','venue',
  'ee100000-0000-4000-8000-000000000001',
  'ee200000-0000-4000-8000-000000000001','unknown',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);
alter table public.facts enable trigger facts_wp25_derived_read_only;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_observe('ee300000-0000-4000-8000-000000000001','true'),
  'legacy derived fact rows cannot acquire authoritative observations'
);

reset role;
select * from finish();
rollback;
