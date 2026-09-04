begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

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
  '92222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'null-validation.owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name)
values ('9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Null Validation Project');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at
)
values (
  '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  '92222222-2222-4222-8222-222222222222',
  'owner',
  'active',
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"92222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);

select throws_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      null,
      null,
      false, false, false, false, false,
      false, false, false, true,
      'not_yet',
      'not_applicable'
    )
  $$,
  '22023',
  'RSVP settings unavailable',
  'null RSVP method fails through controlled validation'
);

select throws_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'manual',
      null,
      false, false, false, false, false,
      false, false, false, true,
      null,
      'not_applicable'
    )
  $$,
  '22023',
  'RSVP settings unavailable',
  'null contact-data readiness fails through controlled validation'
);

select throws_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'manual',
      null,
      false, false, false, false, false,
      false, false, false, true,
      'not_yet',
      null
    )
  $$,
  '22023',
  'RSVP settings unavailable',
  'null automatic-channel setup intent fails through controlled validation'
);

reset role;
select throws_ok(
  $$
    insert into public.project_rsvp_intent_settings (
      project_id,
      rsvp_method,
      contact_data_readiness,
      automatic_channel_setup_intent
    )
    values (
      '9bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'manual',
      'not_yet',
      'later'
    )
  $$,
  '23514',
  'new row for relation "project_rsvp_intent_settings" violates check constraint "project_rsvp_intent_settings_channel_setup_consistency"',
  'table constraint prevents contradictory provider-setup intent even below the RPC layer'
);

select * from finish();
rollback;
