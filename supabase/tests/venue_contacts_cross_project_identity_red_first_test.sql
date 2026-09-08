begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'd1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'contact-cross-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'contact-cross-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Contact collision A', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Contact collision B', 'd2222222-2222-4222-8222-222222222222', 'd2222222-2222-4222-8222-222222222222');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'd1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'd2222222-2222-4222-8222-222222222222', 'owner', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('da100000-0000-4000-8000-000000000001', 'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'DCA', 'Contact collision venue A', 'research', 'd1111111-1111-4111-8111-111111111111', 'd1111111-1111-4111-8111-111111111111'),
  ('db100000-0000-4000-8000-000000000001', 'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'DCB', 'Contact collision venue B', 'research', 'd2222222-2222-4222-8222-222222222222', 'd2222222-2222-4222-8222-222222222222');

create function pg_temp.save_contact_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid
)
returns text language plpgsql as $$
begin
  perform public.save_venue_contact(
    target_project,
    target_venue,
    target_id,
    null,
    'Collision contact',
    null,
    null,
    '+33123456789',
    null,
    null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is(
  pg_temp.save_contact_sqlstate(
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'db100000-0000-4000-8000-000000000001',
    'dd000000-0000-4000-8000-000000000001'
  ),
  '00000',
  'project B creates the collision fixture contact'
);
select is(
  pg_temp.save_contact_sqlstate(
    'dbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'db100000-0000-4000-8000-000000000001',
    'dd000000-0000-4000-8000-000000000001'
  ),
  '23505',
  'same-project duplicate create remains an explicit mutable-contact conflict'
);

select set_config('request.jwt.claims', '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.save_contact_sqlstate(
    'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'da100000-0000-4000-8000-000000000001',
    'dd000000-0000-4000-8000-000000000001'
  ),
  '42501',
  'foreign-project contact identity is unavailable rather than a conflict oracle'
);

reset role;
select * from finish();
rollback;
