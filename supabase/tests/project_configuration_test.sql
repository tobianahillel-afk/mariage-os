begin;

create extension if not exists pgtap with schema extensions;

select plan(71);

select has_table('public', 'wedding_date_options', 'wedding date options table exists');
select has_table('public', 'project_reference_origins', 'reference origins table exists');
select has_table('public', 'user_project_preferences', 'personal project preferences table exists');
select has_table('public', 'project_rsvp_intent_settings', 'RSVP intent settings table exists');

select has_function(
  'public',
  'update_project_settings',
  array['uuid', 'text', 'text', 'text', 'text', 'integer'],
  'protected project settings command exists'
);
select has_function(
  'public',
  'create_wedding_date_option',
  array['uuid', 'date', 'text', 'text'],
  'candidate date creation command exists'
);
select has_function(
  'public',
  'update_wedding_date_option',
  array['uuid', 'uuid', 'date', 'text', 'text', 'text'],
  'date metadata/state command exists'
);
select has_function(
  'public',
  'select_wedding_date_option',
  array['uuid', 'uuid'],
  'atomic selected-date command exists'
);
select has_function(
  'public',
  'save_project_reference_origin',
  array['uuid', 'uuid', 'text', 'text', 'numeric', 'numeric', 'boolean', 'integer'],
  'reference-origin save command exists'
);
select has_function(
  'public',
  'delete_project_reference_origin',
  array['uuid', 'uuid'],
  'reference-origin delete command exists'
);
select has_function(
  'public',
  'upsert_user_project_preferences',
  array['uuid', 'jsonb'],
  'self preference upsert command exists'
);
select has_function(
  'public',
  'upsert_project_rsvp_intent_settings',
  array[
    'uuid', 'text', 'date', 'boolean', 'boolean', 'boolean', 'boolean',
    'boolean', 'boolean', 'boolean', 'boolean', 'boolean', 'text', 'text'
  ],
  'provider-neutral RSVP intent command exists'
);

select ok(
  has_table_privilege('authenticated', 'public.wedding_date_options', 'select')
  and has_table_privilege('authenticated', 'public.project_reference_origins', 'select')
  and has_table_privilege('authenticated', 'public.user_project_preferences', 'select')
  and has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'select')
  and not has_table_privilege('authenticated', 'public.wedding_date_options', 'insert')
  and not has_table_privilege('authenticated', 'public.wedding_date_options', 'update')
  and not has_table_privilege('authenticated', 'public.project_reference_origins', 'insert')
  and not has_table_privilege('authenticated', 'public.project_reference_origins', 'update')
  and not has_table_privilege('authenticated', 'public.user_project_preferences', 'insert')
  and not has_table_privilege('authenticated', 'public.user_project_preferences', 'update')
  and not has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'insert')
  and not has_table_privilege('authenticated', 'public.project_rsvp_intent_settings', 'update'),
  'new configuration tables are read-only to browser roles outside protected commands'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.update_project_settings(uuid,text,text,text,text,integer)',
    'execute'
  )
  and has_function_privilege(
    'authenticated',
    'public.select_wedding_date_option(uuid,uuid)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.update_project_settings(uuid,text,text,text,text,integer)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.upsert_user_project_preferences(uuid,jsonb)',
    'execute'
  ),
  'configuration commands expose authenticated execution only before live authorization checks'
);

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
values
  ('00000000-0000-0000-0000-000000000000', '81111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'config.owner@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '82222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'config.editor@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '83333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'config.viewer@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '84444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'config.multi@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '85555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'config.outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '86666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'config.revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '87777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'config.ownerb@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name)
values
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Configuration Project A'),
  ('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Configuration Project B'),
  ('8ccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Configuration Project C');

insert into public.project_members (
  project_id,
  user_id,
  role_key,
  membership_status,
  accepted_at,
  revoked_at
)
values
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '81111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '82222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '83333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '84444444-4444-4444-8444-444444444444', 'editor', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '86666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now()),
  ('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '84444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '87777777-7777-4777-8777-777777777777', 'owner', 'active', now(), null);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  public.update_project_settings(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '  Notre Mariage  ',
    'fr-FR',
    'Europe/Paris',
    'eur',
    180
  ),
  2::bigint,
  'owner updates project basics through protected command'
);
reset role;

select is(
  (
    select name || ':' || locale || ':' || timezone || ':' || currency::text || ':' || target_guest_count::text
    from public.projects
    where id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'Notre Mariage:fr-FR:Europe/Paris:EUR:180',
  'project settings are normalized and persisted on the canonical project row'
);
select ok(
  (
    select revision = 2
      and updated_by = '81111111-1111-4111-8111-111111111111'::uuid
      and status = 'planning'
      and created_by is null
    from public.projects
    where id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'settings update increments revision and audit actor without altering protected status/creator'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Editor edit', 'fr-FR', 'Europe/Paris', 'EUR', 180)$$,
  '42501',
  'project settings unavailable',
  'editor cannot mutate owner-only project settings'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Viewer edit', 'fr-FR', 'Europe/Paris', 'EUR', 180)$$,
  '42501',
  'project settings unavailable',
  'viewer cannot mutate project settings'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Outsider edit', 'fr-FR', 'Europe/Paris', 'EUR', 180)$$,
  '42501',
  'project settings unavailable',
  'outsider cannot mutate guessed project settings'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Revoked edit', 'fr-FR', 'Europe/Paris', 'EUR', 180)$$,
  '42501',
  'project settings unavailable',
  'revoked owner immediately loses project settings authority'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Bad timezone', 'fr-FR', 'Mars/Olympus', 'EUR', 180)$$,
  '22023',
  'project settings unavailable',
  'unknown timezone is rejected rather than stored as a fixed-offset guess'
);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Bad currency', 'fr-FR', 'Europe/Paris', 'EURO', 180)$$,
  '22023',
  'project settings unavailable',
  'malformed currency is rejected'
);
select throws_ok(
  $$select public.update_project_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Bad guests', 'fr-FR', 'Europe/Paris', 'EUR', -1)$$,
  '22023',
  'project settings unavailable',
  'negative target guest count is rejected'
);
select set_config(
  'mariage.test.date1',
  public.create_wedding_date_option(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '2027-06-06',
    'Option juin',
    'Candidate one'
  )::text,
  true
);
select ok(current_setting('mariage.test.date1')::uuid is not null, 'owner creates first candidate wedding date');
select set_config(
  'mariage.test.date2',
  public.create_wedding_date_option(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '2027-06-13',
    'Option suivante',
    null
  )::text,
  true
);
select ok(current_setting('mariage.test.date2')::uuid is not null, 'owner creates second candidate wedding date');
select is(
  (select count(*)::integer from public.wedding_date_options where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  2,
  'owner sees both project date candidates'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select is(
  (select count(*)::integer from public.wedding_date_options),
  2,
  'viewer can read date options for an authorized project'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.wedding_date_options), 0, 'outsider cannot read date options');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select ok(
  public.select_wedding_date_option(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.date1')::uuid
  ),
  'owner selects first wedding date through protected transition'
);
reset role;
select is(
  (
    select id
    from public.wedding_date_options
    where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and status = 'selected'
  ),
  current_setting('mariage.test.date1')::uuid,
  'first selected row is the sole canonical wedding date'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select ok(
  public.select_wedding_date_option(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.date2')::uuid
  ),
  'owner selects second wedding date atomically'
);
reset role;
select is(
  (
    select string_agg(status, ':' order by event_date)
    from public.wedding_date_options
    where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and id in (
        current_setting('mariage.test.date1')::uuid,
        current_setting('mariage.test.date2')::uuid
      )
  ),
  'candidate:selected',
  'second selection demotes the previous selected option to candidate'
);
select is(
  (select count(*)::integer from public.wedding_date_options where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and status = 'selected'),
  1,
  'database retains exactly one selected date after replacement'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.create_wedding_date_option('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2027-07-01', null, null)$$,
  '42501',
  'wedding date unavailable',
  'editor cannot mutate owner-only wedding basics'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  format(
    'select public.select_wedding_date_option(%L::uuid, %L::uuid)',
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    current_setting('mariage.test.date2')
  ),
  '42501',
  'wedding date unavailable',
  'date option ID from another project cannot be selected'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.create_wedding_date_option('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2027-06-13', 'Duplicate', null)$$,
  '23505',
  'duplicate key value violates unique constraint "wedding_date_options_active_date_idx"',
  'duplicate active civil wedding date is structurally rejected'
);
select lives_ok(
  format(
    'select public.update_wedding_date_option(%L::uuid, %L::uuid, %L::date, %L, %L, %L)',
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.date1'),
    '2027-06-06',
    'Archived first option',
    'history retained',
    'archived'
  ),
  'owner can archive a non-selected historical date option'
);
select lives_ok(
  $$select public.create_wedding_date_option('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '2027-06-06', 'New active June option', null)$$,
  'same civil date can become a new active option after prior history is archived'
);

select set_config(
  'mariage.test.origin1',
  public.save_project_reference_origin(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    'Paris',
    'Paris, France',
    48.856600,
    2.352200,
    true,
    0
  )::text,
  true
);
select ok(current_setting('mariage.test.origin1')::uuid is not null, 'owner creates default reference origin');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select set_config(
  'mariage.test.origin2',
  public.save_project_reference_origin(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    null,
    'Lyon',
    'Lyon, France',
    45.764000,
    4.835700,
    true,
    1
  )::text,
  true
);
select ok(current_setting('mariage.test.origin2')::uuid is not null, 'editor with access.write creates a replacement default origin');
reset role;
select is(
  (
    select id
    from public.project_reference_origins
    where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and is_default
  ),
  current_setting('mariage.test.origin2')::uuid,
  'only the newly chosen default origin remains default'
);
select ok(
  (
    select not is_default
      and revision = 2
      and updated_by = '82222222-2222-4222-8222-222222222222'::uuid
    from public.project_reference_origins
    where id = current_setting('mariage.test.origin1')::uuid
  ),
  'replacing the default demotes and audits the prior origin atomically'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_reference_origins), 2, 'viewer can read project access origins');
select throws_ok(
  $$select public.save_project_reference_origin('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, 'Viewer origin', null, null, null, false, 2)$$,
  '42501',
  'reference origin unavailable',
  'viewer cannot write reference origins'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_reference_origins), 0, 'outsider cannot read project origins');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_reference_origins), 0, 'revoked member cannot read project origins');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  format(
    'select public.save_project_reference_origin(%L::uuid, %L::uuid, %L, null, null, null, false, 0)',
    '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    current_setting('mariage.test.origin2'),
    'Cross-project overwrite'
  ),
  '42501',
  'reference origin unavailable',
  'origin ID cannot be reused across projects'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.save_project_reference_origin('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', null, 'Invalid latitude', null, 91, 2, false, 3)$$,
  '22023',
  'reference origin unavailable',
  'invalid latitude is rejected'
);
select ok(
  public.delete_project_reference_origin(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    current_setting('mariage.test.origin1')::uuid
  ),
  'editor with access.write can delete a non-default reference origin'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select is(
  public.upsert_user_project_preferences(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"density":"compact","venueColumns":["name","status"]}'::jsonb
  ),
  1::bigint,
  'viewer can persist their own cross-device preferences'
);
select is(
  (select preferences_json->>'density' from public.user_project_preferences),
  'compact',
  'viewer reads only their own preference payload'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.user_project_preferences), 0, 'owner cannot read another member personal preferences');
select is(
  public.upsert_user_project_preferences(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"density":"comfortable"}'::jsonb
  ),
  1::bigint,
  'owner can create only their own personal preference row'
);
select is((select count(*)::integer from public.user_project_preferences), 1, 'owner still sees only their own preference row');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"84444444-4444-4444-8444-444444444444","role":"authenticated","aal":"aal1"}', true);
select is(
  public.upsert_user_project_preferences('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"scope":"A"}'::jsonb),
  1::bigint,
  'multi-project member stores project A preferences'
);
select is(
  public.upsert_user_project_preferences('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '{"scope":"B"}'::jsonb),
  1::bigint,
  'multi-project member stores project B preferences independently'
);
select is(
  (select count(*)::integer from public.user_project_preferences),
  2,
  'multi-project user sees exactly their own two project-partitioned preference rows'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.upsert_user_project_preferences('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"revoked":true}'::jsonb)$$,
  '42501',
  'preferences unavailable',
  'revoked member cannot update personal cloud preferences'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.upsert_user_project_preferences('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '{"outsider":true}'::jsonb)$$,
  '42501',
  'preferences unavailable',
  'outsider cannot create a preference row in a guessed project'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.upsert_user_project_preferences('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '["not-an-object"]'::jsonb)$$,
  '22023',
  'preferences unavailable',
  'personal preferences reject non-object JSON'
);
select is(
  public.upsert_user_project_preferences(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"density":"comfortable"}'::jsonb
  ),
  2::bigint,
  'accepted personal preference update increments server revision'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select is(
  public.upsert_project_rsvp_intent_settings(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'mariage_os_links',
    '2027-04-30',
    true,
    true,
    true,
    false,
    true,
    true,
    false,
    true,
    true,
    'emails_and_phones',
    'later'
  ),
  1::bigint,
  'owner persists provider-neutral Invitations and RSVP onboarding intent'
);
reset role;
select is(
  (
    select rsvp_method || ':' || planned_email::text || ':' || planned_whatsapp::text || ':' || planned_manual_link::text || ':' || contact_data_readiness
    from public.project_rsvp_intent_settings
    where project_id = '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'mariage_os_links:true:true:true:emails_and_phones',
  'RSVP onboarding choices persist without provider implementation state'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_rsvp_intent_settings), 1, 'viewer can read project RSVP intent as project configuration');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.upsert_project_rsvp_intent_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'manual', null, false, false, false, false, false, false, false, false, true, 'not_yet', 'not_applicable')$$,
  '42501',
  'RSVP settings unavailable',
  'editor cannot mutate owner-only RSVP project configuration'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_rsvp_intent_settings), 0, 'outsider cannot read RSVP intent settings');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.project_rsvp_intent_settings), 0, 'revoked owner cannot read RSVP intent settings');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}', true);
select throws_ok(
  $$select public.upsert_project_rsvp_intent_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'magic', null, false, false, false, false, false, false, false, false, false, 'not_yet', 'not_applicable')$$,
  '22023',
  'RSVP settings unavailable',
  'unsupported RSVP method is rejected'
);
select throws_ok(
  $$select public.upsert_project_rsvp_intent_settings('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'later', null, false, false, false, false, false, false, false, false, false, 'provider_synced', 'not_applicable')$$,
  '22023',
  'RSVP settings unavailable',
  'unsupported contact-data readiness value is rejected'
);
reset role;

select is(
  (
    select count(*)::integer
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'project_rsvp_intent_settings'
      and (
        column_name ilike '%secret%'
        or column_name ilike '%token%'
        or column_name ilike '%api_key%'
        or column_name = 'provider_key'
      )
  ),
  0,
  'Lot-1 RSVP intent table contains no provider credential/token field'
);

select * from finish();
rollback;
