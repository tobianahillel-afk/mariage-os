begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'f1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'interaction-adversarial-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Interaction adversarial project',
  'f1111111-1111-4111-8111-111111111111',
  'f1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'f1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  (
    'fa100000-0000-4000-8000-000000000001',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ADV1',
    'Interaction adversarial venue one',
    'research',
    'f1111111-1111-4111-8111-111111111111',
    'f1111111-1111-4111-8111-111111111111'
  ),
  (
    'fa100000-0000-4000-8000-000000000002',
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ADV2',
    'Interaction adversarial venue two',
    'research',
    'f1111111-1111-4111-8111-111111111111',
    'f1111111-1111-4111-8111-111111111111'
  );

create function pg_temp.append_interaction_sqlstate(
  target_venue uuid,
  target_summary text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_interaction(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    target_venue,
    'fa400000-0000-4000-8000-000000000001',
    null,
    'phone_call',
    '2026-09-08T10:00:00Z',
    target_summary,
    null,
    null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.append_interaction_sqlstate(
    'fa100000-0000-4000-8000-000000000001',
    'Original Venue interaction.'
  ),
  '00000',
  'baseline interaction append succeeds'
);

select is(
  pg_temp.append_interaction_sqlstate(
    'fa100000-0000-4000-8000-000000000002',
    'Same UUID, different Venue payload.'
  ),
  '23505',
  'same-project same-UUID different-Venue replay is a typed conflict'
);

reset role;
select * from finish();
rollback;
