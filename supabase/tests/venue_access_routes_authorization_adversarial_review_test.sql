begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.venue_access_route_assert_writer(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.venue_access_route_assert_writer(uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.venue_access_route_assert_writer(uuid)'::regprocedure))
  )
  and position(
    'for update'
    in lower(pg_get_functiondef('public.change_project_member_role(uuid,uuid,text)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.change_project_member_role(uuid,uuid,text)'::regprocedure))
  )
  and position(
    'for update'
    in lower(pg_get_functiondef('public.revoke_project_member(uuid,uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.revoke_project_member(uuid,uuid)'::regprocedure))
  ),
  'route writes and membership authority changes serialize on the project before live permission evaluation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_access_route_assert_writer(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'authenticated',
    'public.append_venue_access_route_text_bound_core(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)',
    'execute'
  ),
  'route helper/core remain internal while only authenticated clients receive the public append capability'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.venue_access_route_assert_writer(uuid)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'route authorization helper resolves only through the trusted pg_catalog search path'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.append_venue_access_route(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'public route append command resolves only through the trusted pg_catalog search path'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.append_venue_access_route_text_bound_core(uuid,uuid,uuid,uuid,text,text,text,text,integer,integer,integer,text,uuid,text)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'internal route append core retains the trusted pg_catalog search path'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'd1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'route-auth-review-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'route-auth-review-editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Route authorization adversarial review',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'da100000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'RAR1',
  'Route authorization review venue',
  'research',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

create function pg_temp.append_route_sqlstate(
  target_id uuid,
  target_notes text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_access_route(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    target_id,
    null,
    'custom',
    'Origin',
    'Route authorization review venue',
    'car',
    10,
    1000,
    0,
    '2026-09-09T12:00:00Z',
    null,
    target_notes
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'da400000-0000-4000-8000-000000000001',
    'Editor before downgrade.'
  ),
  '00000',
  'active editor can append a route before role downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'd2222222-2222-4222-8222-222222222222',
    'viewer'
  ),
  'owner downgrades route editor to viewer through the protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'da400000-0000-4000-8000-000000000002',
    'Same session after downgrade.'
  ),
  '42501',
  'same authenticated session loses route write immediately after downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'd2222222-2222-4222-8222-222222222222',
    'editor'
  ),
  'owner restores editor role for the route revocation control'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'da400000-0000-4000-8000-000000000003',
    'Editor restored.'
  ),
  '00000',
  'restored editor route permission is evaluated from live membership state'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.revoke_project_member(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'd2222222-2222-4222-8222-222222222222'
  ),
  'owner revokes route editor through the protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_route_sqlstate(
    'da400000-0000-4000-8000-000000000004',
    'Same session after revocation.'
  ),
  '42501',
  'same authenticated session loses route write immediately after revocation'
);
reset role;

select * from finish();
rollback;
