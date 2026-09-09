begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.venue_remote_media_assert_writer(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.venue_remote_media_assert_writer(uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.venue_remote_media_assert_writer(uuid)'::regprocedure))
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
  'media writes and membership authority changes serialize on the project before live permission evaluation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_remote_media_assert_writer(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.venue_remote_media_assert_writer(uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)',
    'execute'
  ),
  'media writer helper remains internal while only authenticated clients receive the public media command'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.venue_remote_media_assert_writer(uuid)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'media authorization helper resolves only through the trusted pg_catalog search path'
);

select is(
  (
    select proconfig
    from pg_catalog.pg_proc
    where oid = 'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)'::regprocedure
  ),
  array['search_path=pg_catalog']::text[],
  'public media command resolves only through the trusted pg_catalog search path'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'c1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'media-auth-review-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'media-auth-review-editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Media authorization adversarial review',
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
  'MAR1',
  'Media authorization review venue',
  'research',
  'c1111111-1111-4111-8111-111111111111',
  'c1111111-1111-4111-8111-111111111111'
);

create function pg_temp.create_media_sqlstate(
  target_media uuid,
  target_link uuid,
  url_suffix text
)
returns text language plpgsql as $$
begin
  perform public.create_venue_remote_media(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    target_media,
    target_link,
    'exterior',
    'https://example.com/' || url_suffix || '.jpg',
    'https://example.com/' || url_suffix,
    'Authorization review'
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
  pg_temp.create_media_sqlstate(
    'ca200000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    'editor-before-downgrade'
  ),
  '00000',
  'active editor can create remote Venue media before role downgrade'
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
  'owner downgrades media editor to viewer through the protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.create_media_sqlstate(
    'ca200000-0000-4000-8000-000000000002',
    'ca300000-0000-4000-8000-000000000002',
    'same-session-after-downgrade'
  ),
  '42501',
  'same authenticated session loses media write immediately after downgrade'
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
  'owner restores editor role for the media revocation control'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.create_media_sqlstate(
    'ca200000-0000-4000-8000-000000000003',
    'ca300000-0000-4000-8000-000000000003',
    'editor-restored'
  ),
  '00000',
  'restored editor media permission is evaluated from live membership state'
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
  'owner revokes media editor through the protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.create_media_sqlstate(
    'ca200000-0000-4000-8000-000000000004',
    'ca300000-0000-4000-8000-000000000004',
    'same-session-after-revocation'
  ),
  '42501',
  'same authenticated session loses media write immediately after revocation'
);
reset role;

select * from finish();
rollback;
