begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.venue_interaction_assert_writer(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.venue_interaction_assert_writer(uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.venue_interaction_assert_writer(uuid)'::regprocedure))
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
  'interaction writes and membership authority changes serialize on the project before live permission evaluation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_interaction_assert_writer(uuid)',
    'execute'
  ),
  'authenticated clients cannot invoke the interaction authorization helper directly'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'c1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'interaction-review-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'interaction-review-editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Interaction authorization adversarial review',
  'c1111111-1111-4111-8111-111111111111',
  'c1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'ca100000-0000-4000-8000-000000000001',
  'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'IAR1',
  'Interaction authorization review venue',
  'research',
  'c1111111-1111-4111-8111-111111111111',
  'c1111111-1111-4111-8111-111111111111'
);

create function pg_temp.append_interaction_sqlstate(
  target_id uuid,
  target_summary text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_interaction(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    target_id,
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
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_interaction_sqlstate(
    'ca400000-0000-4000-8000-000000000001',
    'Editor before downgrade.'
  ),
  '00000',
  'active editor can append before role downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c2222222-2222-4222-8222-222222222222',
    'viewer'
  ),
  'owner downgrades editor to viewer through protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_interaction_sqlstate(
    'ca400000-0000-4000-8000-000000000002',
    'Same session after downgrade.'
  ),
  '42501',
  'same authenticated session loses interaction write immediately after downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c2222222-2222-4222-8222-222222222222',
    'editor'
  ),
  'owner restores editor role for revocation control'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_interaction_sqlstate(
    'ca400000-0000-4000-8000-000000000003',
    'Editor restored.'
  ),
  '00000',
  'restored editor permission is evaluated from live membership state'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.revoke_project_member(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'c2222222-2222-4222-8222-222222222222'
  ),
  'owner revokes editor through protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.append_interaction_sqlstate(
    'ca400000-0000-4000-8000-000000000004',
    'Same session after revocation.'
  ),
  '42501',
  'same authenticated session loses interaction write immediately after revocation'
);
reset role;

select * from finish();
rollback;
