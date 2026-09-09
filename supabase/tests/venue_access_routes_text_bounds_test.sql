begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_check(
  'public',
  'venue_access_routes',
  'venue_access_routes_origin_label_160_check',
  'route origin labels have the frozen 160-character storage bound'
);
select has_check(
  'public',
  'venue_access_routes',
  'venue_access_routes_destination_label_160_check',
  'route destination labels have the frozen 160-character storage bound'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.append_venue_access_route_text_bound_core(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  ),
  'authenticated clients cannot bypass the hardened route wrapper'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'f7777777-7777-4777-8777-777777777777',
  'authenticated',
  'authenticated',
  'route-bounds-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'fccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Route Bounds Project',
  'f7777777-7777-4777-8777-777777777777',
  'f7777777-7777-4777-8777-777777777777'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at
)
values (
  'fccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'f7777777-7777-4777-8777-777777777777',
  'owner',
  'active',
  now()
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'fc100000-0000-4000-8000-000000000001',
  'fccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'RTBND',
  'Route Bounds Venue',
  'research',
  'f7777777-7777-4777-8777-777777777777',
  'f7777777-7777-4777-8777-777777777777'
);

create function pg_temp.route_bound_sqlstate(
  target_id uuid,
  target_origin_label text,
  target_destination_label text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_access_route(
    'fccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'fc100000-0000-4000-8000-000000000001',
    target_id,
    null,
    'custom',
    target_origin_label,
    target_destination_label,
    'car',
    null,
    null,
    null,
    '2026-09-09T10:00:00Z',
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
  '{"sub":"f7777777-7777-4777-8777-777777777777","role":"authenticated"}',
  true
);

select is(
  pg_temp.route_bound_sqlstate(
    'fc400000-0000-4000-8000-000000000001',
    repeat('o', 160),
    repeat('d', 160)
  ),
  '00000',
  'exactly 160-character route labels are accepted'
);
select is(
  pg_temp.route_bound_sqlstate(
    'fc400000-0000-4000-8000-000000000002',
    repeat('o', 161),
    'destination'
  ),
  '22023',
  '161-character caller-owned origin label is rejected at the command boundary'
);
select is(
  pg_temp.route_bound_sqlstate(
    'fc400000-0000-4000-8000-000000000003',
    'origin',
    repeat('d', 161)
  ),
  '22023',
  '161-character destination label is rejected at the command boundary'
);

reset role;
select * from finish();
rollback;
