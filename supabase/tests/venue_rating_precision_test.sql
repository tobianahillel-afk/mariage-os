begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '89999999-9999-4999-8999-999999999999',
  'authenticated',
  'authenticated',
  'rating-precision-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Rating Precision Project',
  '89999999-9999-4999-8999-999999999999',
  '89999999-9999-4999-8999-999999999999'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '89999999-9999-4999-8999-999999999999',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  '8c100000-0000-4000-8000-000000000001',
  '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'RP1',
  'Rating Precision Venue',
  'research',
  '89999999-9999-4999-8999-999999999999',
  '89999999-9999-4999-8999-999999999999'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"89999999-9999-4999-8999-999999999999","role":"authenticated"}',
  true
);

select is(
  (
    public.set_venue_member_rating(
      '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
      '8c100000-0000-4000-8000-000000000001',
      'love_score',
      9.00,
      0
    ) ->> 'rating'
  )::numeric,
  9.00::numeric,
  'baseline rating is stored exactly'
);

select throws_ok(
  $$select public.set_venue_member_rating(
    '8ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '8c100000-0000-4000-8000-000000000001',
    'love_score',
    4.555,
    1
  )$$,
  '22023',
  'venue rating unavailable',
  'rating with more than two decimal places is rejected instead of rounded'
);

select is(
  (
    select rating
    from public.member_ratings
    where project_id = '8ccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and user_id = '89999999-9999-4999-8999-999999999999'
      and target_type = 'venue'
      and target_id = '8c100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  9.00::numeric,
  'rejected over-precision input leaves the canonical rating unchanged'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = '8ccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and user_id = '89999999-9999-4999-8999-999999999999'
      and target_type = 'venue'
      and target_id = '8c100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  1::bigint,
  'rejected over-precision input leaves the optimistic revision unchanged'
);

select * from finish();
rollback;
