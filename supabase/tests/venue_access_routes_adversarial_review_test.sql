begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'f7111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'route-adversarial-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'f7aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Route adversarial project',
  'f7111111-1111-4111-8111-111111111111',
  'f7111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'f7aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'f7111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'f7100000-0000-4000-8000-000000000001',
  'f7aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'RADV',
  'Route adversarial venue',
  'research',
  'f7111111-1111-4111-8111-111111111111',
  'f7111111-1111-4111-8111-111111111111'
);

insert into public.project_reference_origins (
  id, project_id, label, address_text, latitude, longitude,
  is_default, sort_order, created_by, updated_by
)
values (
  'f7200000-0000-4000-8000-000000000001',
  'f7aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Adversarial reference',
  '7 Rue Test',
  48.856600,
  2.352200,
  true,
  0,
  'f7111111-1111-4111-8111-111111111111',
  'f7111111-1111-4111-8111-111111111111'
);

create function pg_temp.append_route_sqlstate(target_origin_label text)
returns text language plpgsql as $$
begin
  perform public.append_venue_access_route(
    'f7aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'f7100000-0000-4000-8000-000000000001',
    'f7400000-0000-4000-8000-000000000001',
    'f7200000-0000-4000-8000-000000000001',
    'reference_to_venue',
    target_origin_label,
    'Route adversarial venue',
    'car',
    30,
    20000,
    0,
    '2026-09-09T12:00:00Z',
    null,
    null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

select ok(
  not has_function_privilege(
    'authenticated',
    'public.append_venue_access_route_text_bound_core(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.append_venue_access_route_text_bound_core(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  ),
  'the renamed route append core remains inaccessible to client roles'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f7111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.append_route_sqlstate('   '),
  '00000',
  'referenced route canonicalizes whitespace-only caller origin label to null'
);

select ok(
  (select
     origin_label = 'Adversarial reference'
     and reference_origin_address_snapshot = '7 Rue Test'
     and reference_origin_latitude_snapshot = 48.856600
     and reference_origin_longitude_snapshot = 2.352200
   from public.venue_access_routes
   where id = 'f7400000-0000-4000-8000-000000000001'),
  'referenced route still captures only the server-owned origin snapshot'
);

reset role;
select * from finish();
rollback;
