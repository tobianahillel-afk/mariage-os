begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

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
  '93333333-3333-4333-8333-333333333333',
  'authenticated',
  'authenticated',
  'history.owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name)
values ('9ccccccc-cccc-4ccc-8ccc-cccccccccccc', 'History Project');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at
)
values (
  '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '93333333-3333-4333-8333-333333333333',
  'owner',
  'active',
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"93333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}',
  true
);
select set_config(
  'mariage.test.history_date',
  public.create_wedding_date_option(
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '2027-09-05',
    'Historical option',
    null
  )::text,
  true
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-05',
    'rejected'
  ),
  'candidate can enter rejected state while preserving its civil date'
);

select throws_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, null)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-12'
  ),
  '22023',
  'wedding date unavailable',
  'rejected history cannot silently rewrite its civil date'
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-05',
    'candidate'
  ),
  'rejected history can explicitly return to candidate without rewriting its date'
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, null)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-12'
  ),
  'reactivated candidate can change its civil date in a later explicit edit'
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-12',
    'archived'
  ),
  'candidate can enter archived state while preserving its current civil date'
);

select throws_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, null)',
    '9ccccccc-cccc-4ccc-8ccc-cccccccccccc',
    current_setting('mariage.test.history_date'),
    '2027-09-19'
  ),
  '22023',
  'wedding date unavailable',
  'archived history cannot silently rewrite its civil date'
);

select * from finish();
rollback;
