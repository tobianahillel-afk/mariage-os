begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function(
  'public',
  'set_venue_fact_freshness',
  array['uuid','uuid','bigint','timestamp with time zone','timestamp with time zone'],
  'explicit venue fact freshness RPC exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.set_venue_fact_freshness(uuid,uuid,bigint,timestamptz,timestamptz)',
    'EXECUTE'
  ),
  'authenticated may execute freshness RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.set_venue_fact_freshness(uuid,uuid,bigint,timestamptz,timestamptz)',
    'EXECUTE'
  ),
  'anon cannot execute freshness RPC'
);
select ok(
  not has_table_privilege('authenticated','public.facts','update'),
  'authenticated cannot bypass freshness RPC with direct fact update'
);

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('00000000-0000-0000-0000-000000000000','e1111111-1111-4111-8111-111111111111','authenticated','authenticated','fresh-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','e2222222-2222-4222-8222-222222222222','authenticated','authenticated','fresh-viewer@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','e3333333-3333-4333-8333-333333333333','authenticated','authenticated','fresh-outsider@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','f1111111-1111-4111-8111-111111111111','authenticated','authenticated','fresh-b-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','e4444444-4444-4444-8444-444444444444','authenticated','authenticated','fresh-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.projects(id,name,created_by,updated_by) values
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','Fresh A','e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111'),
('ffffffff-ffff-4fff-8fff-ffffffffffff','Fresh B','f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','e1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','e2222222-2222-4222-8222-222222222222','viewer','active',now(),null),
('ffffffff-ffff-4fff-8fff-ffffffffffff','f1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','e4444444-4444-4444-8444-444444444444','owner','revoked',now(),now());

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values
('ee100000-0000-4000-8000-000000000001','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','FA1','Fresh Venue A','research','e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111'),
('ff100000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','FB1','Fresh Venue B','research','f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values
('ee200000-0000-4000-8000-000000000001','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','fresh_boolean_a','Fresh boolean A','venue','boolean','important',false,'e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111'),
('ff200000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','fresh_boolean_b','Fresh boolean B','venue','boolean','important',false,'f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values
('ee300000-0000-4000-8000-000000000001','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','venue','ee100000-0000-4000-8000-000000000001','ee200000-0000-4000-8000-000000000001','unknown',null,'e1111111-1111-4111-8111-111111111111','e1111111-1111-4111-8111-111111111111'),
('ff300000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','venue','ff100000-0000-4000-8000-000000000001','ff200000-0000-4000-8000-000000000001','unknown',null,'f1111111-1111-4111-8111-111111111111','f1111111-1111-4111-8111-111111111111');

create function pg_temp.try_freshness(
  p uuid,
  f uuid,
  r bigint,
  verified timestamptz,
  stale timestamptz
) returns boolean language plpgsql as $$
begin
  perform public.set_venue_fact_freshness(p,f,r,verified,stale);
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    1,
    '2026-09-07T08:00:00Z',
    '2026-10-07T08:00:00Z'
  ),
  'owner records explicit verification and stale timestamps'
);
select is(
  (select last_verified_at from public.facts where id='ee300000-0000-4000-8000-000000000001'),
  '2026-09-07T08:00:00Z'::timestamptz,
  'last verified timestamp is retained exactly'
);
select is(
  (select stale_at from public.facts where id='ee300000-0000-4000-8000-000000000001'),
  '2026-10-07T08:00:00Z'::timestamptz,
  'stale timestamp is retained exactly'
);
select is(
  (select revision from public.facts where id='ee300000-0000-4000-8000-000000000001'),
  2::bigint,
  'freshness transition increments fact revision through audit trigger'
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    1,
    '2026-09-08T08:00:00Z',
    null
  ),
  'stale expected revision is rejected'
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    2,
    null,
    '2026-10-07T08:00:00Z'
  ),
  'stale timestamp cannot exist without verification timestamp'
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    2,
    '2026-10-07T08:00:00Z',
    '2026-09-07T08:00:00Z'
  ),
  'stale timestamp cannot precede verification timestamp'
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ff300000-0000-4000-8000-000000000001',
    1,
    null,
    null
  ),
  'project-B fact injection into project A is rejected'
);
select ok(
  pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    2,
    null,
    null
  ),
  'owner may explicitly return freshness to unknown'
);
select is(
  (select revision from public.facts where id='ee300000-0000-4000-8000-000000000001'),
  3::bigint,
  'explicit freshness reset also increments revision'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    3,
    null,
    null
  ),
  'viewer cannot mutate freshness'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    3,
    null,
    null
  ),
  'outsider cannot mutate freshness'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    3,
    null,
    null
  ),
  'project-B owner cannot mutate project-A freshness'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_freshness(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    'ee300000-0000-4000-8000-000000000001',
    3,
    null,
    null
  ),
  'revoked member cannot mutate freshness'
);

reset role;
select * from finish();
rollback;
