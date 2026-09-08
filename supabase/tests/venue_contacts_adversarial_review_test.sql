begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  position(
    'for update'
    in lower(pg_get_functiondef('public.venue_contact_assert_writer(uuid)'::regprocedure))
  ) > 0
  and position(
    'for update'
    in lower(pg_get_functiondef('public.venue_contact_assert_writer(uuid)'::regprocedure))
  ) < position(
    'has_project_permission'
    in lower(pg_get_functiondef('public.venue_contact_assert_writer(uuid)'::regprocedure))
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
  'contact writes and membership authority changes serialize on the project before live permission evaluation'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.venue_contact_assert_writer(uuid)',
    'execute'
  ),
  'authenticated clients cannot invoke the contact authorization helper directly'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'contact-review-owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'contact-review-editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values (
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Contact adversarial review',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ea100000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'CRA', 'Contact review venue A', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ea100000-0000-4000-8000-000000000002', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'CRB', 'Contact review venue B', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111');

create function pg_temp.save_contact_sqlstate(
  target_venue uuid,
  target_id uuid,
  expected_revision bigint,
  target_name text,
  target_phone text
)
returns text language plpgsql as $$
begin
  perform public.save_venue_contact(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    target_venue,
    target_id,
    expected_revision,
    target_name,
    null,
    null,
    target_phone,
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
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    null,
    'Editor before downgrade',
    '+33123456789'
  ),
  '00000',
  'active editor can write before role downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e2222222-2222-4222-8222-222222222222',
    'viewer'
  ),
  'owner downgrades editor to viewer through protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000002',
    null,
    'Same session after downgrade',
    '+33123456789'
  ),
  '42501',
  'same authenticated session loses contact write immediately after downgrade'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.change_project_member_role(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e2222222-2222-4222-8222-222222222222',
    'editor'
  ),
  'owner restores editor role for revocation control'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000003',
    null,
    'Editor restored',
    '+33123456789'
  ),
  '00000',
  'restored editor permission is evaluated from live membership state'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);
select ok(
  public.revoke_project_member(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'e2222222-2222-4222-8222-222222222222'
  ),
  'owner revokes editor through protected membership command'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000004',
    null,
    'Same session after revocation',
    '+33123456789'
  ),
  '42501',
  'same authenticated session loses contact write immediately after revocation'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}',
  true
);

select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000005',
    null,
    'Parent lock',
    '+33123456789'
  ),
  '00000',
  'owner creates contact for parent immutability control'
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000002',
    'ea200000-0000-4000-8000-000000000005',
    1,
    'Attempted reparent',
    '+33123456789'
  ),
  '40001',
  'same-project update cannot move an existing contact to a different Venue parent'
);
select ok(
  (
    select parent_id = 'ea100000-0000-4000-8000-000000000001'::uuid
      and revision = 1
      and name = 'Parent lock'
    from public.contacts
    where id = 'ea200000-0000-4000-8000-000000000005'
  ),
  'failed reparent preserves parent identity, revision and payload'
);

select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000006',
    null,
    'Trimmed phone',
    chr(160) || '+33123456789' || chr(160)
  ),
  '00000',
  'ECMAScript surrounding whitespace is trimmed before canonical phone validation'
);
select is(
  (
    select phone
    from public.contacts
    where id = 'ea200000-0000-4000-8000-000000000006'
  ),
  '+33123456789',
  'trimmed phone is stored only in canonical form'
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000007',
    null,
    'Blank phone',
    chr(160) || chr(160)
  ),
  '00000',
  'blank optional phone canonicalizes to null'
);
select ok(
  (
    select phone is null
    from public.contacts
    where id = 'ea200000-0000-4000-8000-000000000007'
  ),
  'blank optional phone is persisted as null'
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000008',
    null,
    'Shortest phone',
    '+12'
  ),
  '00000',
  'shortest canonical phone form is accepted by PostgreSQL boundary'
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000009',
    null,
    'Longest phone',
    '+123456789012345'
  ),
  '00000',
  'longest canonical phone form is accepted by PostgreSQL boundary'
);

select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000a', null, 'Too short', '+1'),
  '22023',
  'single-digit international identifier is rejected'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000b', null, 'Leading zero', '+012'),
  '22023',
  'leading-zero international identifier is rejected'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000c', null, 'Too long', '+1234567890123456'),
  '22023',
  'overlong canonical-looking phone is rejected'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000d', null, 'No plus', '33123456789'),
  '22023',
  'local or missing-plus phone is rejected rather than guessed'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000e', null, 'Dial prefix', '0033123456789'),
  '22023',
  '00 international prefix is not silently rewritten'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-00000000000f', null, 'Spaces', '+33 1 23 45 67 89'),
  '22023',
  'internal spaces are rejected rather than stripped'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-000000000010', null, 'Punctuation', '+33-123456789'),
  '22023',
  'phone punctuation is rejected rather than stripped'
);
select is(
  pg_temp.save_contact_sqlstate('ea100000-0000-4000-8000-000000000001', 'ea200000-0000-4000-8000-000000000011', null, 'Unicode digits', '+٣٣١٢٣٤٥٦٧٨٩'),
  '22023',
  'Unicode digit lookalikes are rejected'
);
select is(
  pg_temp.save_contact_sqlstate(
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000012',
    null,
    'Control character',
    '+33' || chr(7) || '123456789'
  ),
  '22023',
  'control characters inside a phone are rejected'
);

reset role;
select * from finish();
rollback;
