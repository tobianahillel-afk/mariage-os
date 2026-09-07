begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_function(
  'public',
  'withdraw_venue_fact_observation',
  array['uuid','uuid','uuid'],
  'venue fact observation withdrawal RPC exists'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.withdraw_venue_fact_observation(uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'authenticated may execute observation withdrawal RPC'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.withdraw_venue_fact_observation(uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'anon cannot execute observation withdrawal RPC'
);

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('00000000-0000-0000-0000-000000000000','71111111-1111-4111-8111-111111111111','authenticated','authenticated','withdraw-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','72222222-2222-4222-8222-222222222222','authenticated','authenticated','withdraw-viewer@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','73333333-3333-4333-8333-333333333333','authenticated','authenticated','withdraw-outsider@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','74444444-4444-4444-8444-444444444444','authenticated','authenticated','withdraw-b-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.projects(id,name,created_by,updated_by) values
('70000000-0000-4000-8000-000000000001','Withdraw A','71111111-1111-4111-8111-111111111111','71111111-1111-4111-8111-111111111111'),
('70000000-0000-4000-8000-000000000002','Withdraw B','74444444-4444-4444-8444-444444444444','74444444-4444-4444-8444-444444444444');

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at,revoked_at
) values
('70000000-0000-4000-8000-000000000001','71111111-1111-4111-8111-111111111111','owner','active',now(),null),
('70000000-0000-4000-8000-000000000001','72222222-2222-4222-8222-222222222222','viewer','active',now(),null),
('70000000-0000-4000-8000-000000000002','74444444-4444-4444-8444-444444444444','owner','active',now(),null);

insert into public.venues(
  id,project_id,code,name,status,created_by,updated_by
) values
('70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000001','WA1','Withdraw Venue A','research','71111111-1111-4111-8111-111111111111','71111111-1111-4111-8111-111111111111'),
('70000000-0000-4000-8000-000000000012','70000000-0000-4000-8000-000000000002','WB1','Withdraw Venue B','research','74444444-4444-4444-8444-444444444444','74444444-4444-4444-8444-444444444444');

insert into public.fact_definitions(
  id,project_id,key,label,entity_type,value_type,priority,system_defined,
  created_by,updated_by
) values
('70000000-0000-4000-8000-000000000021','70000000-0000-4000-8000-000000000001','withdraw_boolean_a','Withdraw boolean A','venue','boolean','important',false,'71111111-1111-4111-8111-111111111111','71111111-1111-4111-8111-111111111111'),
('70000000-0000-4000-8000-000000000022','70000000-0000-4000-8000-000000000002','withdraw_boolean_b','Withdraw boolean B','venue','boolean','important',false,'74444444-4444-4444-8444-444444444444','74444444-4444-4444-8444-444444444444');

insert into public.facts(
  id,project_id,target_type,target_id,definition_id,state,retained_value,
  created_by,updated_by
) values
('70000000-0000-4000-8000-000000000031','70000000-0000-4000-8000-000000000001','venue','70000000-0000-4000-8000-000000000011','70000000-0000-4000-8000-000000000021','unknown',null,'71111111-1111-4111-8111-111111111111','71111111-1111-4111-8111-111111111111'),
('70000000-0000-4000-8000-000000000032','70000000-0000-4000-8000-000000000002','venue','70000000-0000-4000-8000-000000000012','70000000-0000-4000-8000-000000000022','unknown',null,'74444444-4444-4444-8444-444444444444','74444444-4444-4444-8444-444444444444');

insert into public.sources(
  id,project_id,source_type,title,url,evidence_level,observed_at,notes,status,
  created_by,updated_by
) values (
  '70000000-0000-4000-8000-000000000041',
  '70000000-0000-4000-8000-000000000001',
  'written_confirmation',
  'Withdrawal proof source',
  'https://venue.example/withdrawal-proof',
  'confirmed_for_event',
  '2026-09-07T08:00:00Z',
  null,
  'active',
  '71111111-1111-4111-8111-111111111111',
  '71111111-1111-4111-8111-111111111111'
);

insert into public.fact_observations(
  id,project_id,fact_id,value,raw_value_text,evidence_level,confidence,
  observation_status,observed_at,note,created_by
) values (
  '70000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000031',
  'false'::jsonb,
  'No',
  'confirmed_for_event',
  'high',
  'active',
  '2026-09-07T08:05:00Z',
  null,
  '71111111-1111-4111-8111-111111111111'
);

insert into public.observation_sources(
  project_id,observation_id,source_id,is_primary
) values (
  '70000000-0000-4000-8000-000000000001',
  '70000000-0000-4000-8000-000000000051',
  '70000000-0000-4000-8000-000000000041',
  true
);

create function pg_temp.try_withdraw(p uuid,f uuid,o uuid)
returns boolean language plpgsql as $$
begin
  perform public.withdraw_venue_fact_observation(p,f,o);
  return true;
exception when others then return false;
end$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"71111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.resolve_venue_fact_from_observation(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051',
    1,
    'known',
    null
  )$$,
  'owner explicitly retains active observation before withdrawal'
);
select ok(
  pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051'
  ),
  'owner withdraws active observation'
);
select is(
  (select observation_status from public.fact_observations where id='70000000-0000-4000-8000-000000000051'),
  'withdrawn',
  'withdrawal changes lifecycle status only'
);
select is(
  (select count(*) from public.fact_observations where id='70000000-0000-4000-8000-000000000051'),
  1::bigint,
  'withdrawn observation remains historical row'
);
select is(
  (select value from public.fact_observations where id='70000000-0000-4000-8000-000000000051'),
  'false'::jsonb,
  'withdrawal preserves normalized observation value'
);
select is(
  (select count(*) from public.observation_sources where observation_id='70000000-0000-4000-8000-000000000051'),
  1::bigint,
  'withdrawal preserves observation source links'
);
select is(
  (select state from public.facts where id='70000000-0000-4000-8000-000000000031'),
  'known',
  'withdrawal does not silently rewrite retained fact state'
);
select is(
  (select retained_value from public.facts where id='70000000-0000-4000-8000-000000000031'),
  'false'::jsonb,
  'withdrawal does not silently rewrite retained value'
);
select is(
  (select retained_observation_id from public.facts where id='70000000-0000-4000-8000-000000000031'),
  '70000000-0000-4000-8000-000000000051'::uuid,
  'withdrawal preserves retained evidence pointer for audit history'
);
select is(
  (select revision from public.facts where id='70000000-0000-4000-8000-000000000031'),
  2::bigint,
  'withdrawal does not mutate retained fact revision'
);
select ok(
  not pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051'
  ),
  'second withdrawal is rejected as stale lifecycle transition'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"72222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051'
  ),
  'viewer cannot withdraw observations'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"73333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051'
  ),
  'outsider cannot withdraw observations'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"74444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000001',
    '70000000-0000-4000-8000-000000000031',
    '70000000-0000-4000-8000-000000000051'
  ),
  'project-B owner cannot withdraw project-A observation'
);
select ok(
  not pg_temp.try_withdraw(
    '70000000-0000-4000-8000-000000000002',
    '70000000-0000-4000-8000-000000000032',
    '70000000-0000-4000-8000-000000000051'
  ),
  'project-A observation cannot be injected into project B'
);

reset role;
select * from finish();
rollback;
