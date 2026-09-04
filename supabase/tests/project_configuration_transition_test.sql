begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

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
  '91111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'transition.owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name)
values ('9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Transition Project');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at
)
values (
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '91111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select set_config(
  'mariage.test.transition_date1',
  public.create_wedding_date_option(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '2027-06-06',
    'Primary candidate',
    null
  )::text,
  true
);
select set_config(
  'mariage.test.transition_date2',
  public.create_wedding_date_option(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '2027-06-13',
    'Secondary candidate',
    null
  )::text,
  true
);
select public.select_wedding_date_option(
  '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  current_setting('mariage.test.transition_date1')::uuid
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, %L, %L, null)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date1'),
    '2027-06-06',
    'Selected label edit',
    'metadata remains editable'
  ),
  'selected option permits metadata-only edits without changing canonical civil date or state'
);

select throws_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, %L, null, null)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date1'),
    '2027-06-07',
    'Forbidden selected-date rewrite'
  ),
  '22023',
  'wedding date unavailable',
  'generic metadata command cannot rewrite the civil date of the selected option'
);

select throws_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date1'),
    '2027-06-06',
    'archived'
  ),
  '22023',
  'wedding date unavailable',
  'generic metadata command cannot demote or archive the selected option'
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date2'),
    '2027-06-13',
    'archived'
  ),
  'non-selected candidate can be archived explicitly'
);

select throws_ok(
  format(
    'select public.select_wedding_date_option(%L::uuid, %L::uuid)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date2')
  ),
  '22023',
  'wedding date unavailable',
  'archived option cannot jump directly to selected'
);

select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, null, null, %L)',
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date2'),
    '2027-06-13',
    'candidate'
  ),
  'archived option can explicitly return to candidate before selection'
);

select ok(
  public.select_wedding_date_option(
    '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.transition_date2')::uuid
  ),
  'reactivated candidate can become selected through the protected transition'
);

reset role;
select is(
  (
    select id
    from public.wedding_date_options
    where project_id = '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and status = 'selected'
  ),
  current_setting('mariage.test.transition_date2')::uuid,
  'protected transition leaves exactly the intended selected option'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"91111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select throws_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'mariage_os_links',
      null,
      false, false, false, false, false,
      true, false, false, false,
      'emails',
      'not_applicable'
    )
  $$,
  '22023',
  'RSVP settings unavailable',
  'automatic planned channel cannot claim provider setup is not applicable'
);

select throws_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'manual',
      null,
      false, false, false, false, false,
      false, false, false, true,
      'not_yet',
      'configure_now'
    )
  $$,
  '22023',
  'RSVP settings unavailable',
  'provider setup cannot be requested when no automatic channel is planned'
);

select lives_ok(
  $$
    select public.upsert_project_rsvp_intent_settings(
      '9aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'mariage_os_links',
      '2027-05-01',
      true, true, false, false, true,
      true, false, false, true,
      'emails',
      'later'
    )
  $$,
  'automatic channel may be planned while technical provider setup is explicitly deferred'
);

select * from finish();
rollback;
