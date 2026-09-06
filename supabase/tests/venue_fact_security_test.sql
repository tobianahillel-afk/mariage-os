begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public','fact_definitions','fact_definitions table exists');
select has_table('public','facts','facts table exists');
select ok((select relrowsecurity from pg_class where oid='public.fact_definitions'::regclass),'definitions RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.facts'::regclass),'facts RLS enabled');
select has_function('public','create_venue_fact_definition',array['uuid','text','text','text','text','text','numeric','text','jsonb','jsonb'],'create definition RPC exists');
select has_function('public','set_retained_venue_fact',array['uuid','uuid','uuid','bigint','text','jsonb'],'set retained fact RPC exists');
select ok(
  not has_table_privilege('authenticated','public.fact_definitions','insert')
  and not has_table_privilege('authenticated','public.fact_definitions','update')
  and not has_table_privilege('authenticated','public.facts','insert')
  and not has_table_privilege('authenticated','public.facts','update'),
  'authenticated cannot bypass mutation RPCs'
);

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('00000000-0000-0000-0000-000000000000','a1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-a-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','a2222222-2222-4222-8222-222222222222','authenticated','authenticated','fact-a-editor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','a3333333-3333-4333-8333-333333333333','authenticated','authenticated','fact-a-viewer@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','a4444444-4444-4444-8444-444444444444','authenticated','authenticated','fact-outsider@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','b1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-b-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','a5555555-5555-4555-8555-555555555555','authenticated','authenticated','fact-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.projects(id,name,created_by,updated_by) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fact A','a1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fact B','b1111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111');
insert into public.project_members(project_id,user_id,role_key,membership_status,accepted_at,revoked_at) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a2222222-2222-4222-8222-222222222222','editor','active',now(),null),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a3333333-3333-4333-8333-333333333333','viewer','active',now(),null),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','b1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','a5555555-5555-4555-8555-555555555555','owner','revoked',now(),now());
insert into public.venues(id,project_id,code,name,status,created_by,updated_by) values
('aa100000-0000-4000-8000-000000000001','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','A1','Venue A','research','a1111111-1111-4111-8111-111111111111','a1111111-1111-4111-8111-111111111111'),
('bb100000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','B1','Venue B','research','b1111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111');

create function pg_temp.try_create(p uuid,k text) returns boolean language plpgsql as $$
begin
  perform public.create_venue_fact_definition(p,k,'Synthetic '||k,'boolean',null,'important',1,null,null,null);
  return true;
exception when others then return false;
end$$;
create function pg_temp.try_set(p uuid,v uuid,d uuid,r bigint,s text,x jsonb) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact(p,v,d,r,s,x); return true;
exception when others then return false;
end$$;

set local role anon;
select throws_ok($$select * from public.fact_definitions$$,'42501','permission denied for table fact_definitions','anon definitions denied');
select throws_ok($$select * from public.facts$$,'42501','permission denied for table facts','anon facts denied');
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select ok(pg_temp.try_create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','owner_boolean'),'owner creates definition');
select ok(pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),null,'known','false'),'owner stores known false');
select is((select retained_value from public.facts limit 1),'false'::jsonb,'false is not unknown sentinel');
select ok(pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),1,'unknown',null),'explicit unknown accepted');
select ok(not pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),2,'unknown','false'),'unknown cannot carry false sentinel');
select ok(not pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),1,'known','true'),'stale revision rejected');
select ok(not pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','bb100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),null,'known','true'),'project-B Venue injection rejected');
select throws_ok($$insert into public.facts(project_id,target_type,target_id,definition_id,state,retained_value) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','venue','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='owner_boolean'),'known','true')$$,'42501','permission denied for table facts','direct fact write denied');

reset role;
insert into public.fact_definitions(id,project_id,key,label,entity_type,value_type,priority,system_defined,created_by,updated_by)
values('bb200000-0000-4000-8000-000000000001','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','project_b_boolean','B boolean','venue','boolean','important',false,'b1111111-1111-4111-8111-111111111111','b1111111-1111-4111-8111-111111111111');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select ok(not pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001','bb200000-0000-4000-8000-000000000001',null,'known','true'),'project-B definition injection rejected');

select set_config('request.jwt.claims','{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
select ok(pg_temp.try_create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','editor_boolean'),'editor may create definition');
select ok(pg_temp.try_set('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','aa100000-0000-4000-8000-000000000001',(select id from public.fact_definitions where key='editor_boolean'),null,'known','true'),'editor may set fact');

select set_config('request.jwt.claims','{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}',true);
select cmp_ok((select count(*) from public.fact_definitions),'>',0::bigint,'viewer reads definitions');
select cmp_ok((select count(*) from public.facts),'>',0::bigint,'viewer reads facts');
select ok(not pg_temp.try_create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','viewer_denied'),'viewer cannot create');

select set_config('request.jwt.claims','{"sub":"a4444444-4444-4444-8444-444444444444","role":"authenticated"}',true);
select is((select count(*) from public.fact_definitions),0::bigint,'outsider sees no definitions');
select is((select count(*) from public.facts),0::bigint,'outsider sees no facts');
select ok(not pg_temp.try_create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','outsider_denied'),'outsider cannot mutate');

select set_config('request.jwt.claims','{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
select is((select count(*) from public.fact_definitions where project_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0::bigint,'project-B owner cannot read A definitions');
select is((select count(*) from public.facts where project_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),0::bigint,'project-B owner cannot read A facts');

select set_config('request.jwt.claims','{"sub":"a5555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
select is((select count(*) from public.fact_definitions),0::bigint,'revoked member sees no definitions');
select is((select count(*) from public.facts),0::bigint,'revoked member sees no facts');
select ok(not pg_temp.try_create('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','revoked_denied'),'revoked member cannot mutate');

reset role;
select * from finish();
rollback;
