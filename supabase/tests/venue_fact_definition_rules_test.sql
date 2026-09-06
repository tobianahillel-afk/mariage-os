begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','d1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-rules-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
insert into public.projects(id,name,created_by,updated_by)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Fact Rules','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');
insert into public.project_members(project_id,user_id,role_key,membership_status,accepted_at)
values('dddddddd-dddd-4ddd-8ddd-dddddddddddd','d1111111-1111-4111-8111-111111111111','owner','active',now());
insert into public.venues(id,project_id,code,name,status,created_by,updated_by)
values('dd100000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','D1','Rules Venue','research','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');
insert into public.fact_definitions(id,project_id,key,label,entity_type,value_type,priority,system_defined,evaluation_rule_json,created_by,updated_by)
values('dd200000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','system_locked_boolean','System locked','venue','boolean','important',true,'{"type":"boolean_equals","expected":true}','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');

create function pg_temp.try_create(k text,t text,u text,o jsonb,r jsonb,w numeric default 3) returns boolean language plpgsql as $$
begin
  perform public.create_venue_fact_definition('dddddddd-dddd-4ddd-8ddd-dddddddddddd',k,'Synthetic '||k,t,u,'important',w,null,o,r); return true;
exception when others then return false;
end$$;
create function pg_temp.try_update(d uuid,rev bigint,o jsonb,r jsonb) returns boolean language plpgsql as $$
begin
  perform public.update_venue_fact_definition('dddddddd-dddd-4ddd-8ddd-dddddddddddd',d,rev,'Updated definition','important',3,null,o,r); return true;
exception when others then return false;
end$$;
create function pg_temp.try_set(d uuid,rev bigint,s text,x jsonb) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact('dddddddd-dddd-4ddd-8ddd-dddddddddddd','dd100000-0000-4000-8000-000000000001',d,rev,s,x); return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select ok(not pg_temp.try_create('bad_rule','number',null,null,'{"type":"boolean_equals","expected":true}'),'incompatible evaluation rule rejected');
select ok(not pg_temp.try_create('bad_duration_unit','duration','hours',null,null),'noncanonical duration unit rejected');
select ok(not pg_temp.try_create('bad_weight','boolean',null,null,null,1.2345),'weight beyond numeric(8,3) precision rejected');
select ok(not pg_temp.try_create('bad_select_options','select',null,'{"options":[{"key":"same","labelKey":"one"},{"key":"same","labelKey":"two"}]}',null),'duplicate select option key rejected');
select ok(pg_temp.try_create('number_fact','number','people','{"min":0,"max":500,"integer":true}','{"type":"number_min","minimum":150}'),'valid number definition created');
select ok(not pg_temp.try_create('number_fact','number','people','{"min":0,"max":500,"integer":true}',null),'stable definition key unique');

select throws_ok($$update public.fact_definitions set value_type='text' where key='number_fact'$$,'42501','permission denied for table fact_definitions','direct value_type repurpose denied');
select throws_ok($$update public.fact_definitions set key='changed_key' where key='number_fact'$$,'42501','permission denied for table fact_definitions','direct key repurpose denied');
select ok(not pg_temp.try_update('dd200000-0000-4000-8000-000000000001',1,null,'{"type":"boolean_equals","expected":false}'),'system-defined rule semantics protected');

select ok(pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),null,'known','180'),'known constrained number stored');
select ok(not pg_temp.try_update((select id from public.fact_definitions where key='number_fact'),1,'{"min":0,"max":100,"integer":true}','{"type":"number_min","minimum":50}'),'metadata update cannot invalidate retained known fact');
select ok(pg_temp.try_update((select id from public.fact_definitions where key='number_fact'),1,'{"min":0,"max":600,"integer":true}','{"type":"number_min","minimum":150}'),'compatible metadata update succeeds');
select is((select revision from public.fact_definitions where key='number_fact'),2::bigint,'definition revision incremented');
select ok(not pg_temp.try_update((select id from public.fact_definitions where key='number_fact'),1,'{"min":0,"max":700,"integer":true}','{"type":"number_min","minimum":150}'),'stale definition revision rejected');

select ok(pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),1,'unknown',null),'known fact can become unknown');
select ok(not pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),2,'unknown','0'),'unknown state must stay valueless');
select ok(not pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),2,'known',null),'known state requires typed retained value');
select ok(pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),2,'not_applicable',null),'not_applicable distinct state');
select ok(pg_temp.try_set((select id from public.fact_definitions where key='number_fact'),3,'conflict',null),'conflict distinct and valueless in WP-2.3');

reset role;
select * from finish();
rollback;
