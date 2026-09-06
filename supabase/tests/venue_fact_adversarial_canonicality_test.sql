begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','f1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-adversarial-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
insert into public.projects(id,name,created_by,updated_by)
values('ffffffff-ffff-4fff-8fff-ffffffffffff','Fact Adversarial','f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');
insert into public.project_members(project_id,user_id,role_key,membership_status,accepted_at)
values('ffffffff-ffff-4fff-8fff-ffffffffffff','f1111111-1111-4111-8111-111111111111','owner','active',now());
insert into public.venues(id,project_id,code,name,status,created_by,updated_by)
values('ff100000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','F1','Adversarial Venue','research','f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');

create function pg_temp.try_create(k text,t text,u text,o jsonb) returns boolean language plpgsql as $$
begin
  perform public.create_venue_fact_definition(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',k,'Synthetic '||k,t,u,
    'important',1,null,o,null
  );
  return true;
exception when others then return false;
end$$;

create function pg_temp.try_update(d uuid,rev bigint,o jsonb) returns boolean language plpgsql as $$
begin
  perform public.update_venue_fact_definition(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',d,rev,'Updated definition',
    'important',1,null,o,null
  );
  return true;
exception when others then return false;
end$$;

create function pg_temp.try_set(k text,rev bigint,s text,x jsonb) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact(
    'ffffffff-ffff-4fff-8fff-ffffffffffff',
    'ff100000-0000-4000-8000-000000000001',
    (select id from public.fact_definitions where key=k),rev,s,x
  );
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select ok(not pg_temp.try_create('duration_false_integer','duration','minutes','{"integer":false}'),'duration integer false rejected');
select ok(not pg_temp.try_create('distance_negative_only','distance','meters','{"max":-1}'),'distance negative-only domain rejected');
select ok(not pg_temp.try_create('duration_unsafe_only','duration','minutes','{"min":100000000000000000000}'),'duration domain outside safe integer range rejected');
select ok(not pg_temp.try_create('rating_default_conflict','rating',null,'{"min":20}'),'one-sided rating bound conflicting with default rejected');
select ok(pg_temp.try_create('rating_custom_scale','rating',null,'{"min":20,"max":30}'),'explicit custom rating scale accepted');
select ok(not pg_temp.try_create('integer_no_value','number',null,'{"min":0.1,"max":0.9,"integer":true}'),'integer definition with no representable integer rejected');

select ok(pg_temp.try_create('multi_stable','multiselect',null,'{"options":[{"key":"zeta","labelKey":"z"},{"key":"alpha","labelKey":"a"}]}'),'multiselect definition created');
select ok(pg_temp.try_set('multi_stable',null,'known','["zeta","alpha"]'::jsonb),'multiselect retained value created');
select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='multi_stable'),'["alpha","zeta"]'::jsonb,'multiselect canonical order is stable key order');
select ok(pg_temp.try_update((select id from public.fact_definitions where key='multi_stable'),1,'{"options":[{"key":"alpha","labelKey":"a"},{"key":"zeta","labelKey":"z"}]}'),'option display/order change succeeds');
select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='multi_stable'),'["alpha","zeta"]'::jsonb,'option reorder does not change existing canonical truth');
select ok(pg_temp.try_set('multi_stable',1,'known','["zeta","alpha"]'::jsonb),'retained multiselect updated after option reorder');
select is((select retained_value from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='multi_stable'),'["alpha","zeta"]'::jsonb,'new canonical multiselect remains stable after reorder');

select ok(pg_temp.try_create('unicode_text','text',null,null),'Unicode text definition created');
select ok(pg_temp.try_set('unicode_text',null,'known',to_jsonb(repeat(chr(128512),5000))),'5000 Unicode code points accepted by DB boundary');
select ok(not pg_temp.try_set('unicode_text',1,'known',to_jsonb(repeat(chr(128512),5001))),'5001 Unicode code points rejected by DB boundary');

select ok(pg_temp.try_create('url_strict','url',null,null),'URL definition created');
select ok(pg_temp.try_set('url_strict',null,'known',to_jsonb('https://sub.example.invalid:65535/path?x=1#part'::text)),'canonical external URL accepted');
select ok(not pg_temp.try_set('url_strict',1,'known',to_jsonb('https://a.0'::text)),'numeric final DNS label rejected');
select ok(not pg_temp.try_set('url_strict',1,'known',to_jsonb('https://xn--'::text)),'ambiguous punycode marker rejected');
select ok(not pg_temp.try_set('url_strict',1,'known',to_jsonb('https://bad_name.example'::text)),'non-DNS host label rejected');
select ok(not pg_temp.try_set('url_strict',1,'known',to_jsonb('https://example.invalid:65536'::text)),'out-of-range port rejected');

reset role;
select * from finish();
rollback;
