begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'd1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'offer-null-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Null Status Project',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'd1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'da100000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'NULL1',
  'Null Boundary Venue',
  'research',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_null_status_create()
returns boolean language plpgsql as $$
begin
  perform public.create_venue_offer(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da300000-0000-4000-8000-000000000001',
    null,
    'Null status must not become draft',
    null,
    null,
    null,
    null,
    'EUR',
    'unknown',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    0::smallint,
    null,
    null,
    null,
    '[]'::jsonb
  );
  return true;
exception when others then
  return false;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select ok(
  not pg_temp.try_null_status_create(),
  'NULL creation status fails closed instead of silently creating a draft'
);
select is(
  (select count(*) from public.venue_offers where id = 'da300000-0000-4000-8000-000000000001'),
  0::bigint,
  'rejected NULL creation status leaves no Venue offer row'
);

reset role;
select * from finish();
rollback;
