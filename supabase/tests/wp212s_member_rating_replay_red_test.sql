begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure(
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint,uuid,uuid)'
  ) is not null,
  'RED: rating command exposes stable operation and device identity'
);

select ok(
  to_regprocedure(
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint)'
  ) is null,
  'RED: legacy non-receipt rating signature is removed'
);

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'd1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'wp212s-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects(id, name, created_by, updated_by)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'WP-2.12S rating replay',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

insert into public.project_members(
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'd1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues(
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'dd100000-0000-4000-8000-000000000001',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'S1',
  'Rating replay Venue',
  'research',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0
  )$$,
  'first rating write succeeds'
);

select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0
  )$$,
  'RED: exact retry after lost response recognizes prior success'
);

reset role;

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  1::bigint,
  'response-loss retry never creates a second rating row'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  1::bigint,
  'response-loss retry never increments rating revision twice'
);

select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'RED: accepted rating operation owns one replay receipt'
);

select * from finish();
rollback;
