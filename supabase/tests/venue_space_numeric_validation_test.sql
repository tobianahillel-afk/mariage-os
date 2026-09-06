begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '8d999999-9999-4999-8999-999999999999',
  'authenticated',
  'authenticated',
  'space-numeric-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'Space Numeric Validation Project',
  '8d999999-9999-4999-8999-999999999999',
  '8d999999-9999-4999-8999-999999999999'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '8d999999-9999-4999-8999-999999999999',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  '8d100000-0000-4000-8000-000000000001',
  '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'SN1',
  'Space Numeric Validation Venue',
  'research',
  '8d999999-9999-4999-8999-999999999999',
  '8d999999-9999-4999-8999-999999999999'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"8d999999-9999-4999-8999-999999999999","role":"authenticated"}',
  true
);

select is(
  (
    public.create_venue_space(
      '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
      '8d100000-0000-4000-8000-000000000001',
      'Baseline Room',
      'reception_room',
      true,
      300.00,
      20.00,
      15.00,
      4.00,
      180,
      240,
      1,
      null
    ) ->> 'area_m2'
  )::numeric,
  300.00::numeric,
  'baseline Venue-space measurement is stored exactly'
);

select throws_ok(
  $$select public.create_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '8d100000-0000-4000-8000-000000000001',
    'Area Precision Attack', 'reception_room', true,
    1.234, 20.00, 15.00, 4.00, 100, 120, 2, null
  )$$,
  '22023',
  'venue space unavailable',
  'area with more than two decimal places is rejected instead of rounded'
);

select throws_ok(
  $$select public.create_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '8d100000-0000-4000-8000-000000000001',
    'Length Precision Attack', 'reception_room', true,
    100.00, 20.001, 15.00, 4.00, 100, 120, 2, null
  )$$,
  '22023',
  'venue space unavailable',
  'length with more than two decimal places is rejected instead of rounded'
);

select throws_ok(
  $$select public.create_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '8d100000-0000-4000-8000-000000000001',
    'Width Precision Attack', 'reception_room', true,
    100.00, 20.00, 15.001, 4.00, 100, 120, 2, null
  )$$,
  '22023',
  'venue space unavailable',
  'width with more than two decimal places is rejected instead of rounded'
);

select throws_ok(
  $$select public.create_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '8d100000-0000-4000-8000-000000000001',
    'Height Precision Attack', 'reception_room', true,
    100.00, 20.00, 15.00, 4.001, 100, 120, 2, null
  )$$,
  '22023',
  'venue space unavailable',
  'height with more than two decimal places is rejected instead of rounded'
);

select throws_ok(
  $$select public.create_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '8d100000-0000-4000-8000-000000000001',
    'Numeric Overflow Attack', 'reception_room', true,
    100000000.00, 20.00, 15.00, 4.00, 100, 120, 2, null
  )$$,
  '22023',
  'venue space unavailable',
  'measurement outside numeric(10,2) range is rejected before persistence'
);

select is(
  (
    public.create_venue_space(
      '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
      '8d100000-0000-4000-8000-000000000001',
      'Numeric Boundary Room',
      'reception_room',
      true,
      99999999.99,
      null,
      null,
      null,
      2147483647,
      null,
      -2147483648,
      null
    ) ->> 'area_m2'
  )::numeric,
  99999999.99::numeric,
  'exact numeric(10,2) and integer boundaries remain accepted'
);

select throws_ok(
  $$select public.update_venue_space(
    '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
    (select id from public.venue_spaces where name = 'Baseline Room'),
    1,
    'Baseline Room', 'reception_room', true,
    301.234, 20.00, 15.00, 4.00, 180, 240, 1, null
  )$$,
  '22023',
  'venue space unavailable',
  'over-precision update is rejected before canonical mutation'
);

select is(
  (select area_m2 from public.venue_spaces where name = 'Baseline Room'),
  300.00::numeric,
  'rejected over-precision update leaves canonical measurement unchanged'
);

select is(
  (select revision from public.venue_spaces where name = 'Baseline Room'),
  1::bigint,
  'rejected over-precision update leaves optimistic revision unchanged'
);

select * from finish();
rollback;
