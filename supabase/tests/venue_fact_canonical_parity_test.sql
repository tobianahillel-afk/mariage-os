begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('00000000-0000-0000-0000-000000000000','e1111111-1111-4111-8111-111111111111','authenticated','authenticated','fact-parity-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());
insert into public.projects(id,name,created_by,updated_by)
values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Fact Parity','e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111');
insert into public.project_members(project_id,user_id,role_key,membership_status,accepted_at)
values('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','e1111111-1111-4111-8111-111111111111','owner','active',now());
insert into public.venues(id,project_id,code,name,status,created_by,updated_by)
values('ee100000-0000-4000-8000-000000000001','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','E1','Parity Venue','research','e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111');

create function pg_temp.make_def(k text,t text) returns uuid language plpgsql as $$
declare x jsonb;
begin
  x := public.create_venue_fact_definition(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    k,
    'Synthetic ' || k,
    t,
    null,
    'important',
    1,
    null,
    null,
    null
  );
  return (x ->> 'id')::uuid;
end$$;

create function pg_temp.try_set(k text,r bigint,x jsonb) returns boolean language plpgsql as $$
begin
  perform public.set_retained_venue_fact(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee100000-0000-4000-8000-000000000001',
    (select id from public.fact_definitions where key = k),
    r,
    'known',
    x
  );
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',true);

select ok(pg_temp.make_def('url_parity','url') is not null,'URL definition created');
select ok(pg_temp.make_def('date_parity','date') is not null,'date definition created');
select ok(pg_temp.make_def('number_parity','number') is not null,'number definition created');

select ok(pg_temp.try_set('url_parity',null,to_jsonb('https://example.invalid:65535/path?x=1#section'::text)),'canonical URL accepted');
select ok(not pg_temp.try_set('url_parity',1,to_jsonb('https://%'::text)),'malformed percent host rejected');
select ok(not pg_temp.try_set('url_parity',1,to_jsonb('https://user@example.invalid'::text)),'credential URL rejected');
select ok(not pg_temp.try_set('url_parity',1,to_jsonb('https://999.999.999.999'::text)),'ambiguous numeric host rejected');
select ok(not pg_temp.try_set('url_parity',1,to_jsonb('https://example.invalid:65536'::text)),'out-of-range port rejected');
select is((select revision from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='url_parity'),1::bigint,'rejected URLs do not mutate retained revision');

select ok(pg_temp.try_set('date_parity',null,'"0001-01-01"'::jsonb),'year 0001 civil date accepted');
select ok(not pg_temp.try_set('date_parity',1,'"0000-01-01"'::jsonb),'year 0000 civil date rejected');
select ok(not pg_temp.try_set('date_parity',1,'"1900-02-29"'::jsonb),'non-leap century date rejected');
select ok(pg_temp.try_set('date_parity',1,'"2000-02-29"'::jsonb),'leap-century date accepted');

select ok(pg_temp.try_set('number_parity',null,'1e308'::jsonb),'canonical numeric upper bound accepted');
select ok(not pg_temp.try_set('number_parity',1,'1.5e308'::jsonb),'number above canonical bound rejected');
select is((select revision from public.facts f join public.fact_definitions d on d.id=f.definition_id where d.key='number_parity'),1::bigint,'rejected oversized number does not mutate retained revision');

reset role;
select * from finish();
rollback;
