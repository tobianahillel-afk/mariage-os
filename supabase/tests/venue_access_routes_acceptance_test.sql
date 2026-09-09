begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'e1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'route-acceptance-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Route acceptance project',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at
)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now()
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'ea100000-0000-4000-8000-000000000001',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'RACC',
  'Route acceptance venue',
  'research',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_reference_origins (
  id, project_id, label, address_text, latitude, longitude,
  is_default, sort_order, created_by, updated_by
)
values
  (
    'ea200000-0000-4000-8000-000000000001',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Paris',
    '1 Rue Paris',
    48.856600,
    2.352200,
    true,
    0,
    'e1111111-1111-4111-8111-111111111111',
    'e1111111-1111-4111-8111-111111111111'
  ),
  (
    'ea200000-0000-4000-8000-000000000002',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Home',
    '10 Rue Home',
    43.700000,
    7.250000,
    false,
    1,
    'e1111111-1111-4111-8111-111111111111',
    'e1111111-1111-4111-8111-111111111111'
  );

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select is(
  (public.append_venue_access_route(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'reference_to_venue',
    null,
    'Route acceptance venue',
    'car',
    95,
    123000,
    0,
    '2026-09-09T10:00:00Z',
    null,
    'Paris route'
  )->>'id')::uuid,
  'ea400000-0000-4000-8000-000000000001'::uuid,
  'ACC-030 persists the Paris driving observation'
);

select is(
  (public.append_venue_access_route(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000002',
    'ea200000-0000-4000-8000-000000000002',
    'reference_to_venue',
    null,
    'Route acceptance venue',
    'car',
    70,
    100000,
    0,
    '2026-09-09T11:00:00Z',
    null,
    'Home route'
  )->>'id')::uuid,
  'ea400000-0000-4000-8000-000000000002'::uuid,
  'ACC-030 persists the home driving observation without overwriting Paris'
);

select is(
  (
    select var.id
    from public.venue_access_routes var
    join public.project_reference_origins pro
      on pro.project_id = var.project_id
     and pro.id = var.reference_origin_id
     and pro.is_default
    where var.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and var.venue_id = 'ea100000-0000-4000-8000-000000000001'
      and var.route_type = 'reference_to_venue'
      and var.mode = 'car'
      and var.reference_origin_address_snapshot is not distinct from pro.address_text
      and var.reference_origin_latitude_snapshot is not distinct from pro.latitude
      and var.reference_origin_longitude_snapshot is not distinct from pro.longitude
    order by var.observed_at desc, var.created_at desc, var.id asc
    limit 1
  ),
  'ea400000-0000-4000-8000-000000000001'::uuid,
  'current default-origin selection initially resolves the Paris observation'
);

select is(
  public.save_project_reference_origin(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000002',
    'Home',
    '10 Rue Home',
    43.700000,
    7.250000,
    true,
    1
  ),
  'ea200000-0000-4000-8000-000000000002'::uuid,
  'accepted origin command switches the project default to Home'
);

select is(
  (
    select pro.id
    from public.project_reference_origins pro
    where pro.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and pro.is_default
  ),
  'ea200000-0000-4000-8000-000000000002'::uuid,
  'Home is the sole default origin after the switch'
);

select is(
  (
    select var.id
    from public.venue_access_routes var
    join public.project_reference_origins pro
      on pro.project_id = var.project_id
     and pro.id = var.reference_origin_id
     and pro.is_default
    where var.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and var.venue_id = 'ea100000-0000-4000-8000-000000000001'
      and var.route_type = 'reference_to_venue'
      and var.mode = 'car'
      and var.reference_origin_address_snapshot is not distinct from pro.address_text
      and var.reference_origin_latitude_snapshot is not distinct from pro.latitude
      and var.reference_origin_longitude_snapshot is not distinct from pro.longitude
    order by var.observed_at desc, var.created_at desc, var.id asc
    limit 1
  ),
  'ea400000-0000-4000-8000-000000000002'::uuid,
  'ACC-030 default switch selects the existing Home observation'
);

select is(
  (select count(*)::integer
   from public.venue_access_routes
   where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and venue_id = 'ea100000-0000-4000-8000-000000000001'),
  2,
  'default switching preserves both historical route observations'
);

select ok(
  (select
     count(*) = 2
     and bool_and(revision = 1)
   from public.venue_access_routes
   where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and venue_id = 'ea100000-0000-4000-8000-000000000001'),
  'default switching never rewrites accepted route history'
);

select is(
  public.save_project_reference_origin(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000002',
    'Home moved',
    '11 Rue Home',
    43.701000,
    7.251000,
    true,
    1
  ),
  'ea200000-0000-4000-8000-000000000002'::uuid,
  'default origin physical context can change without rewriting history'
);

select is(
  (
    select var.id
    from public.venue_access_routes var
    join public.project_reference_origins pro
      on pro.project_id = var.project_id
     and pro.id = var.reference_origin_id
     and pro.is_default
    where var.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and var.venue_id = 'ea100000-0000-4000-8000-000000000001'
      and var.route_type = 'reference_to_venue'
      and var.mode = 'car'
      and var.reference_origin_address_snapshot is not distinct from pro.address_text
      and var.reference_origin_latitude_snapshot is not distinct from pro.latitude
      and var.reference_origin_longitude_snapshot is not distinct from pro.longitude
    order by var.observed_at desc, var.created_at desc, var.id asc
    limit 1
  ),
  null::uuid,
  'physical origin edit makes the older Home route explicitly ineligible for current summary'
);

select is(
  (public.append_venue_access_route(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000003',
    'ea200000-0000-4000-8000-000000000002',
    'reference_to_venue',
    null,
    'Route acceptance venue',
    'car',
    68,
    99000,
    0,
    '2026-09-09T12:00:00Z',
    null,
    'Fresh Home route'
  )->>'id')::uuid,
  'ea400000-0000-4000-8000-000000000003'::uuid,
  'fresh observation can be appended for the moved default origin'
);

select is(
  (
    select var.id
    from public.venue_access_routes var
    join public.project_reference_origins pro
      on pro.project_id = var.project_id
     and pro.id = var.reference_origin_id
     and pro.is_default
    where var.project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and var.venue_id = 'ea100000-0000-4000-8000-000000000001'
      and var.route_type = 'reference_to_venue'
      and var.mode = 'car'
      and var.reference_origin_address_snapshot is not distinct from pro.address_text
      and var.reference_origin_latitude_snapshot is not distinct from pro.latitude
      and var.reference_origin_longitude_snapshot is not distinct from pro.longitude
    order by var.observed_at desc, var.created_at desc, var.id asc
    limit 1
  ),
  'ea400000-0000-4000-8000-000000000003'::uuid,
  'fresh moved-context observation restores current default-origin selection'
);

select is(
  (select count(*)::integer
   from public.venue_access_routes
   where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
     and venue_id = 'ea100000-0000-4000-8000-000000000001'),
  3,
  'stale and fresh observations coexist as immutable history after context change'
);

reset role;
select * from finish();
rollback;
