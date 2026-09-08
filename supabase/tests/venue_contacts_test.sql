begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'contacts', 'contacts table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.contacts'::regclass),
  'contacts has RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.contacts', 'select')
  and not has_table_privilege('authenticated', 'public.contacts', 'insert')
  and not has_table_privilege('authenticated', 'public.contacts', 'update')
  and not has_table_privilege('authenticated', 'public.contacts', 'delete'),
  'authenticated clients cannot bypass contact RPC boundary'
);
select ok(
  not has_table_privilege('anon', 'public.contacts', 'select'),
  'anonymous role has no contact read grant'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'c1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'contact-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'contact-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'contact-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'contact-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'contact-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'contact-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Contact Project A', 'c1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111'),
  ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Contact Project B', 'c4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c6666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ca100000-0000-4000-8000-000000000001', 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'CTA', 'Contact Venue A', 'research', 'c1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111'),
  ('cb100000-0000-4000-8000-000000000001', 'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'CTB', 'Contact Venue B', 'research', 'c4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444');

create function pg_temp.try_save_contact(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  expected_revision bigint,
  target_name text,
  target_phone text
)
returns boolean language plpgsql as $$
begin
  perform public.save_venue_contact(
    target_project, target_venue, target_id, expected_revision,
    target_name, null, null, target_phone, null, null
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.save_contact_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  expected_revision bigint,
  target_name text,
  target_phone text
)
returns text language plpgsql as $$
begin
  perform public.save_venue_contact(
    target_project, target_venue, target_id, expected_revision,
    target_name, null, null, target_phone, null, null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.contacts$$,
  '42501',
  'permission denied for table contacts',
  'anonymous direct contact read is denied at grant layer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000001',
    null,
    '  Alice Martin  ',
    ' +33123456789 '
  ),
  'owner creates a contact through the atomic command'
);
select ok(
  (select name = 'Alice Martin'
     and phone = '+33123456789'
     and parent_type = 'venue'
     and parent_id = 'ca100000-0000-4000-8000-000000000001'
     and revision = 1
   from public.contacts
   where id = 'ca200000-0000-4000-8000-000000000001'),
  'contact creation canonicalizes optional text and phone'
);
select is(
  pg_temp.save_contact_sqlstate(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000001',
    1,
    'Alice Updated',
    '+33123456789'
  ),
  '00000',
  'matching expected revision updates the contact'
);
select ok(
  (select name = 'Alice Updated' and revision = 2
   from public.contacts where id = 'ca200000-0000-4000-8000-000000000001'),
  'successful update increments revision server-side'
);
select is(
  pg_temp.save_contact_sqlstate(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000001',
    1,
    'Stale write',
    '+33123456789'
  ),
  '40001',
  'stale expected revision is a typed conflict'
);
select ok(
  (select name = 'Alice Updated' and revision = 2
   from public.contacts where id = 'ca200000-0000-4000-8000-000000000001'),
  'stale update preserves the current row'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'cb100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000002',
    null, 'Cross project', '+33123456789'
  ),
  'cross-project Venue parent is rejected'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000003',
    null, 'Local phone', '01 23 45 67 89'
  ),
  'local/noncanonical phone is rejected instead of guessed'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000004',
    null, 'Unicode digits', '+٣٣١٢٣٤٥٦٧٨٩'
  ),
  'Unicode digit lookalikes are rejected'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000001',
    null, 'Duplicate id', '+33123456789'
  ),
  'duplicate mutable contact identity does not become replay/idempotency'
);

select set_config('request.jwt.claims', '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000005',
    null, 'Editor contact', '+33111111111'
  ),
  'active editor with venues.write can create a contact'
);

select set_config('request.jwt.claims', '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000006',
    null, 'Viewer denied', '+33111111112'
  ),
  'viewer without venues.write cannot mutate contacts'
);
select is(
  (select count(*) from public.contacts where project_id = 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2::bigint,
  'viewer can still read project contacts through venues.read'
);

select set_config('request.jwt.claims', '{"sub":"c5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is(
  (select count(*) from public.contacts),
  0::bigint,
  'outsider sees no project contacts'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000007',
    null, 'Outsider denied', '+33111111113'
  ),
  'outsider cannot mutate contacts'
);

select set_config('request.jwt.claims', '{"sub":"c4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is(
  (select count(*) from public.contacts),
  0::bigint,
  'project-B owner cannot read project-A contacts'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000008',
    null, 'Project B denied', '+33111111114'
  ),
  'project-B owner cannot mutate project-A contacts'
);

select set_config('request.jwt.claims', '{"sub":"c6666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is(
  (select count(*) from public.contacts),
  0::bigint,
  'revoked member cannot read contacts'
);
select ok(
  not pg_temp.try_save_contact(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca200000-0000-4000-8000-000000000009',
    null, 'Revoked denied', '+33111111115'
  ),
  'revoked member cannot mutate contacts'
);

reset role;
select * from finish();
rollback;
