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
  'offer-same-state-owner@example.invalid',
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
  'Offer same-state project',
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

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'da100000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'SS1',
  'Same-state Venue',
  'research',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

insert into public.venue_offers (
  id, project_id, venue_id, name, status, currency, tax_mode,
  created_by, updated_by
)
values
  (
    'da300000-0000-4000-8000-000000000001',
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'Quoted historical offer',
    'quoted',
    'EUR',
    'unknown',
    'd1111111-1111-4111-8111-111111111111',
    'd1111111-1111-4111-8111-111111111111'
  ),
  (
    'da300000-0000-4000-8000-000000000002',
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'Rejected historical offer',
    'rejected',
    'EUR',
    'unknown',
    'd1111111-1111-4111-8111-111111111111',
    'd1111111-1111-4111-8111-111111111111'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.transition_venue_offer_status(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da300000-0000-4000-8000-000000000001',
    'quoted',
    1
  )$$,
  '22023',
  'venue offer transition unavailable',
  'quoted -> quoted is not one of the frozen transition arcs'
);

select throws_ok(
  $$select public.transition_venue_offer_status(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'da300000-0000-4000-8000-000000000002',
    'rejected',
    1
  )$$,
  '22023',
  'venue offer transition unavailable',
  'terminal rejected -> rejected same-state command fails closed'
);

reset role;
select * from finish();
rollback;
