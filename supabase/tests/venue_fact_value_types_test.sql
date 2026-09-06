begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','c1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-types-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
insert into public.projects(id,name,created_by,updated_by)
values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Fact Types','c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111');
insert into public.project_members(project_id,user_id,role_key,membership_status,accepted_at)
values('cccccccc-cccc-4ccc-8ccc-cccccccccccc','c1111111-1111-4111-8111-111111111111','owner','active',now());
insert into public.venues(id,project_id,code,name,status,created_by,updated_by)
values('cc100000-0000-4000-8000-000000000001','cccccccc-cccc-4ccc-8ccc-cccccccccccc','C1','Fact Types Venue','research','c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111');

create function pg_temp.make_def(k text,t text,u text,o jsonb,r jsonb) returns uuid language plpgsql as $$
declare x jsonb;
begin
  x := public.create_venue_fact_definition('cccccccc-cccc-4ccc-8ccc-cccccccccccc',k,'Synthetic '||k,t,u,'important',1,null,o,r);
  return (x->>'id')::uuid;
end$$;
create function pg_temp.try_set(k text,r bigint,s text,x jsonb) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact('cccccccc-cccc-4ccc-8ccc-cccccccccccc','cc100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key=k),r,s,x);
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select ok(pg_temp.make_def('boolean_fact','boolean',null,null,'{"type":"boolean_equals","expected":true}') is not null,'boolean definition');
select ok(pg_temp.make_def('number_fact','number','people','{"min":0,"max":500,"integer":true}','{"type":"number_min","minimum":150}') is not null,'number definition');
select ok(pg_temp.make_def('money_fact','money',null,null,'{"type":"money_max","maximum":{"minor":1200000,"currency":"EUR"}}') is not null,'money definition');
select ok(pg_temp.make_def('text_fact','text',null,null,null) is not null,'text definition');
select ok(pg_temp.make_def('date_fact','date',null,null,null) is not null,'date definition');
select ok(pg_temp.make_def('time_fact','time',null,null,'{"type":"time_at_or_after","time":"01:00","dayOffset":1}') is not null,'time definition');
select ok(pg_temp.make_def('rating_fact','rating',null,null,'{"type":"rating_min","minimum":7.5}') is not null,'rating definition');
select ok(pg_temp.make_def('select_fact','select',null,'{"options":[{"key":"low","labelKey":"criteria.low"},{"key":"high","labelKey":"criteria.high"}]}','{"type":"select_in","accepted":["low"]}') is not null,'select definition');
select ok(pg_temp.make_def('multiselect_fact','multiselect',null,'{"options":[{"key":"round_tables","labelKey":"criteria.round"},{"key":"rectangular_tables","labelKey":"criteria.rectangular"}]}',null) is not null,'multiselect definition');
select ok(pg_temp.make_def('duration_fact','duration','minutes','{"min":0,"max":1440}','{"type":"number_max","maximum":180}') is not null,'duration definition');
select ok(pg_temp.make_def('distance_fact','distance','meters','{"min":0}',null) is not null,'distance definition');
select ok(pg_temp.make_def('url_fact','url',null,null,null) is not null,'url definition');

select ok(pg_temp.try_set('boolean_fact',null,'known','false'),'boolean false persists');
select ok(not pg_temp.try_set('boolean_fact',1,'known','"false"'),'boolean string rejected');
select ok(pg_temp.try_set('number_fact',null,'known','0'),'numeric zero persists');
select ok(pg_temp.try_set('number_fact',1,'known','180'),'integer-constrained number persists');
select ok(not pg_temp.try_set('number_fact',2,'known','180.5'),'fractional constrained number rejected');
select ok(pg_temp.try_set('money_fact',null,'known','{"minor":950000,"currency":"EUR"}'),'money persists');
select ok(not pg_temp.try_set('money_fact',1,'known','{"minor":950000.5,"currency":"EUR"}'),'fractional money minor rejected');
select ok(pg_temp.try_set('text_fact',null,'known','""'),'empty text is known');
select ok(not pg_temp.try_set('text_fact',1,'known',to_jsonb(repeat('x',5001))),'oversized text rejected');
select ok(pg_temp.try_set('date_fact',null,'known','"2028-02-29"'),'valid leap date persists');
select ok(not pg_temp.try_set('date_fact',1,'known','"2027-02-29"'),'impossible date rejected');
select ok(pg_temp.try_set('time_fact',null,'known','{"time":"01:30","dayOffset":1}'),'valid next-day time persists');
select ok(not pg_temp.try_set('time_fact',1,'known','{"time":"25:00","dayOffset":0}'),'invalid wall clock rejected');
select ok(pg_temp.try_set('rating_fact',null,'known','7.5'),'rating persists');
select ok(not pg_temp.try_set('rating_fact',1,'known','10.1'),'rating above 10 rejected');
select ok(pg_temp.try_set('select_fact',null,'known','"low"'),'declared select persists');
select ok(not pg_temp.try_set('select_fact',1,'known','"missing"'),'unknown select rejected');
select ok(pg_temp.try_set('multiselect_fact',null,'known','["rectangular_tables","round_tables"]'),'multiselect persists');
select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='multiselect_fact'),'["round_tables","rectangular_tables"]'::jsonb,'multiselect canonicalized to definition order');
select ok(not pg_temp.try_set('multiselect_fact',1,'known','["round_tables","round_tables"]'),'duplicate multiselect rejected');
select ok(pg_temp.try_set('duration_fact',null,'known','135'),'duration minutes persists');
select ok(not pg_temp.try_set('duration_fact',1,'known','-1'),'negative duration rejected');
select ok(pg_temp.try_set('distance_fact',null,'known','12500'),'distance meters persists');
select ok(not pg_temp.try_set('distance_fact',1,'known','12.5'),'fractional distance rejected');
select ok(pg_temp.try_set('url_fact',null,'known','"https://example.invalid/venue"'),'https URL persists');
select ok(not pg_temp.try_set('url_fact',1,'known','"javascript:alert(1)"'),'unsafe URL rejected');

select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='boolean_fact'),'false'::jsonb,'false remains retained');
select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='number_fact'),'180'::jsonb,'zero/update path stays numeric truth');

reset role;
select * from finish();
rollback;
