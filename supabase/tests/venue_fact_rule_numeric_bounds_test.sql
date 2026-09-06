begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(
  instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'e1111111-1111-4111-8111-111111111111',
  'authenticated','authenticated','fact-finite-owner@example.invalid','',now(),
  '{"provider":"email","providers":["email"]}','{}',now(),now()
);

insert into public.projects(id,name,created_by,updated_by)
values(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Fact Finite Rules',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id,user_id,role_key,membership_status,accepted_at
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'e1111111-1111-4111-8111-111111111111',
  'owner','active',now()
);

create function pg_temp.try_create_rule(
  target_key text,
  target_value_type text,
  target_rule jsonb
) returns boolean
language plpgsql
as $$
begin
  perform public.create_venue_fact_definition(
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    target_key,
    'Synthetic ' || target_key,
    target_value_type,
    null,
    'important',
    1,
    null,
    null,
    target_rule
  );
  return true;
exception
  when others then return false;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select ok(
  pg_temp.try_create_rule(
    'finite_number_min',
    'number',
    '{"type":"number_min","minimum":1e308}'
  ),
  'largest supported finite number_min remains accepted'
);

select ok(
  not pg_temp.try_create_rule(
    'overflow_number_min',
    'number',
    '{"type":"number_min","minimum":1e309}'
  ),
  'number_min outside browser finite range is rejected'
);

select ok(
  not pg_temp.try_create_rule(
    'overflow_number_max',
    'number',
    '{"type":"number_max","maximum":-1e309}'
  ),
  'number_max outside browser finite range is rejected'
);

select ok(
  not pg_temp.try_create_rule(
    'overflow_rating_min',
    'rating',
    '{"type":"rating_min","minimum":1e309}'
  ),
  'rating_min outside browser finite range is rejected'
);

select ok(
  not pg_temp.try_create_rule(
    'overflow_number_range',
    'number',
    '{"type":"number_range","minimum":0,"maximum":1e309}'
  ),
  'number_range outside browser finite range remains rejected'
);

reset role;
select * from finish();
rollback;
