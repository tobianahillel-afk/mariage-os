begin;

create extension if not exists pgtap with schema extensions;

select plan(2);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '89999999-9999-4999-8999-999999999999',
  'authenticated',
  'authenticated',
  'config.hardening@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name)
values ('8ddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Configuration Hardening');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at
)
values (
  '8ddddddd-dddd-4ddd-8ddd-dddddddddddd',
  '89999999-9999-4999-8999-999999999999',
  'owner',
  'active',
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"89999999-9999-4999-8999-999999999999","role":"authenticated","aal":"aal1"}',
  true
);

select throws_ok(
  $$select public.update_project_settings('8ddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Null currency', 'fr-FR', 'Europe/Paris', null, 100)$$,
  '22023',
  'project settings unavailable',
  'null currency fails through the protected validation boundary'
);

select throws_ok(
  $$select public.save_project_reference_origin('8ddddddd-dddd-4ddd-8ddd-dddddddddddd', null, 'Half coordinate', null, 48.8566, null, false, 0)$$,
  '22023',
  'reference origin unavailable',
  'reference origin rejects a partial coordinate pair'
);

reset role;
select * from finish();
rollback;
