begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'venue_spaces', 'venue_spaces table exists');
select has_table('public', 'member_entity_preferences', 'member_entity_preferences table exists');
select has_table('public', 'member_ratings', 'member_ratings table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.venue_spaces'::regclass), 'venue_spaces has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.member_entity_preferences'::regclass), 'member preferences has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.member_ratings'::regclass), 'member ratings has RLS');
select has_function(
  'public', 'create_venue_space',
  array['uuid','uuid','text','text','boolean','numeric','numeric','numeric','numeric','integer','integer','integer','text'],
  'create venue space command exists'
);
select has_function(
  'public', 'update_venue_space',
  array['uuid','uuid','bigint','text','text','boolean','numeric','numeric','numeric','numeric','integer','integer','integer','text'],
  'update venue space command exists'
);
select has_function(
  'public', 'set_venue_member_preference',
  array['uuid','uuid','boolean','text','bigint'],
  'self-authored venue preference command exists'
);
select has_function(
  'public', 'set_venue_member_rating',
  array['uuid','uuid','text','numeric','bigint'],
  'self-authored venue rating command exists'
);
select ok(
  not has_table_privilege('anon', 'public.venue_spaces', 'select')
  and not has_table_privilege('anon', 'public.member_entity_preferences', 'select')
  and not has_table_privilege('anon', 'public.member_ratings', 'select'),
  'anonymous receives no private table grants'
);
select ok(
  not has_table_privilege('authenticated', 'public.venue_spaces', 'insert')
  and not has_table_privilege('authenticated', 'public.venue_spaces', 'update')
  and not has_table_privilege('authenticated', 'public.venue_spaces', 'delete')
  and not has_table_privilege('authenticated', 'public.member_entity_preferences', 'insert')
  and not has_table_privilege('authenticated', 'public.member_entity_preferences', 'update')
  and not has_table_privilege('authenticated', 'public.member_ratings', 'insert')
  and not has_table_privilege('authenticated', 'public.member_ratings', 'update'),
  'authenticated clients cannot bypass protected mutation commands'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '81111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'space-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '82222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'space-owner-a2@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '83333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'space-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '84444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'space-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '85555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'space-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '86666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'space-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '87777777-7777-4777-8777-777777777777', 'authenticated', 'authenticated', 'space-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Space Project A', '81111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111'),
  ('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Space Project B', '85555555-5555-4555-8555-555555555555', '85555555-5555-4555-8555-555555555555');

insert into public.project_members (project_id, user_id, role_key, membership_status, accepted_at, revoked_at)
values
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '81111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '82222222-2222-4222-8222-222222222222', 'owner', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '83333333-3333-4333-8333-333333333333', 'editor', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '84444444-4444-4444-8444-444444444444', 'viewer', 'active', now(), null),
  ('8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '85555555-5555-4555-8555-555555555555', 'owner', 'active', now(), null),
  ('8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '87777777-7777-4777-8777-777777777777', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('8a100000-0000-4000-8000-000000000001', '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A1', 'Space Venue A', 'research', '81111111-1111-4111-8111-111111111111', '81111111-1111-4111-8111-111111111111'),
  ('8b100000-0000-4000-8000-000000000001', '8bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B1', 'Space Venue B', 'research', '85555555-5555-4555-8555-555555555555', '85555555-5555-4555-8555-555555555555');

select throws_ok(
  $$insert into public.member_entity_preferences (
      project_id, user_id, target_type, target_id, favorite
    ) values (
      '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '81111111-1111-4111-8111-111111111111',
      'venue',
      '8b100000-0000-4000-8000-000000000001',
      true
    )$$,
  '23514',
  'member opinion target unavailable',
  'cross-project polymorphic preference target is rejected'
);
select throws_ok(
  $$insert into public.member_ratings (
      project_id, user_id, target_type, target_id, dimension_key, rating
    ) values (
      '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '81111111-1111-4111-8111-111111111111',
      'vendor',
      '8a100000-0000-4000-8000-000000000001',
      'love_score',
      5
    )$$,
  '23514',
  'member opinion target unavailable',
  'unsupported target type fails closed until its owning domain extends validation'
);

create function pg_temp.try_create_space(
  target_project uuid,
  target_venue uuid,
  target_name text,
  target_capacity integer default 150
)
returns boolean language plpgsql as $$
begin
  perform public.create_venue_space(
    target_project, target_venue, target_name, 'reception_room', true,
    300.00, 20.00, 15.00, 4.00, target_capacity, 220, 1, 'synthetic space'
  );
  return true;
exception
  when insufficient_privilege or invalid_parameter_value or check_violation then return false;
end;
$$;

create function pg_temp.try_update_space(
  target_project uuid,
  target_space uuid,
  target_revision bigint,
  target_name text
)
returns boolean language plpgsql as $$
begin
  perform public.update_venue_space(
    target_project, target_space, target_revision, target_name,
    'reception_room', true, 320.00, 20.00, 16.00, 4.00, 170, 240, 2,
    'updated synthetic space'
  );
  return true;
exception
  when insufficient_privilege or invalid_parameter_value or serialization_failure or check_violation then return false;
end;
$$;

create function pg_temp.try_preference(
  target_project uuid,
  target_venue uuid,
  target_favorite boolean,
  target_note text,
  target_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.set_venue_member_preference(
    target_project, target_venue, target_favorite, target_note, target_revision
  );
  return true;
exception
  when insufficient_privilege or invalid_parameter_value or serialization_failure or check_violation then return false;
end;
$$;

create function pg_temp.try_rating(
  target_project uuid,
  target_venue uuid,
  target_dimension text,
  target_rating numeric,
  target_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.set_venue_member_rating(
    target_project, target_venue, target_dimension, target_rating, target_revision
  );
  return true;
exception
  when insufficient_privilege or invalid_parameter_value or serialization_failure or check_violation then return false;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.venue_spaces$$,
  '42501', 'permission denied for table venue_spaces',
  'anonymous venue-space read denied at grant layer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Main room'
  ),
  'owner may create own-project physical space'
);
select is((select count(*)::integer from public.venue_spaces), 1, 'owner sees created own-project space');
select is((select capacity_seated from public.venue_spaces where name = 'Main room'), 150, 'seated capacity stored independently');
select is((select capacity_cocktail from public.venue_spaces where name = 'Main room'), 220, 'cocktail capacity stored independently');
select is((select revision from public.venue_spaces where name = 'Main room'), 1::bigint, 'new space starts revision one');
select ok(
  not pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Invalid capacity', -1
  ),
  'negative capacity is rejected'
);
select ok(
  not pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8b100000-0000-4000-8000-000000000001',
    'Cross project'
  ),
  'cross-project Venue parent injection is rejected'
);
select throws_ok(
  $$insert into public.venue_spaces (project_id, venue_id, name, space_type)
    values (
      '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '8a100000-0000-4000-8000-000000000001',
      'Bypass', 'other'
    )$$,
  '42501', 'permission denied for table venue_spaces',
  'direct space insert cannot bypass protected command'
);
select ok(
  pg_temp.try_update_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.venue_spaces where name = 'Main room'),
    1,
    'Main room reviewed'
  ),
  'owner may update own space with current revision'
);
select is((select revision from public.venue_spaces where name = 'Main room reviewed'), 2::bigint, 'space update increments revision');
select is((select capacity_seated from public.venue_spaces where name = 'Main room reviewed'), 170, 'space update stores revised seated capacity');
select ok(
  not pg_temp.try_update_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    (select id from public.venue_spaces where name = 'Main room reviewed'),
    1,
    'Stale overwrite'
  ),
  'stale space edit is rejected'
);
select is((select name from public.venue_spaces where id = (select id from public.venue_spaces where name = 'Main room reviewed')), 'Main room reviewed', 'stale edit leaves canonical value unchanged');

select set_config('request.jwt.claims', '{"sub":"83333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select ok(
  pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Editor room'
  ),
  'editor with venues.write may create a space'
);

select set_config('request.jwt.claims', '{"sub":"84444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is((select count(*)::integer from public.venue_spaces), 2, 'viewer with venues.read may read spaces');
select ok(
  not pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Viewer write'
  ),
  'viewer cannot mutate shared space data'
);

select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is((select count(*)::integer from public.venue_spaces), 0, 'project-B owner cannot read project-A spaces');
select ok(
  not pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Project B bypass'
  ),
  'project-B owner cannot write project-A spaces'
);

select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*)::integer from public.venue_spaces), 0, 'outsider cannot read project spaces');

select set_config('request.jwt.claims', '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select is((select count(*)::integer from public.venue_spaces), 0, 'revoked member cannot read project spaces');
select ok(
  not pg_temp.try_create_space(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'Revoked write'
  ),
  'revoked member cannot create a space'
);

select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    true, '  my private note  ', 0
  ),
  'member creates own Venue preference'
);
select is((select revision from public.member_entity_preferences), 1::bigint, 'new preference starts revision one');
select is((select personal_note from public.member_entity_preferences), 'my private note', 'personal note is normalized');
select is((select user_id from public.member_entity_preferences), '81111111-1111-4111-8111-111111111111'::uuid, 'preference author derives from auth.uid');
select throws_ok(
  $$insert into public.member_entity_preferences (
      project_id, user_id, target_type, target_id, favorite
    ) values (
      '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '82222222-2222-4222-8222-222222222222',
      'venue',
      '8a100000-0000-4000-8000-000000000001',
      true
    )$$,
  '42501', 'permission denied for table member_entity_preferences',
  'client cannot insert preference while impersonating another member'
);
select ok(
  pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    false, 'updated own note', 1
  ),
  'member updates own preference with current revision'
);
select is((select revision from public.member_entity_preferences), 2::bigint, 'preference update increments revision');
select ok(
  not pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    true, null, 1
  ),
  'stale preference overwrite is rejected'
);
select ok(
  not pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8b100000-0000-4000-8000-000000000001',
    true, null, 0
  ),
  'preference command rejects cross-project Venue target'
);

select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select count(*)::integer from public.member_entity_preferences), 0, 'partner cannot read another member private preference row');
select ok(
  pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    true, 'partner private note', 0
  ),
  'partner creates independent preference'
);
select is((select count(*)::integer from public.member_entity_preferences), 1, 'partner sees only own preference row');

select set_config('request.jwt.claims', '{"sub":"84444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(
  pg_temp.try_preference(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    true, null, 0
  ),
  'viewer may persist own personal preference'
);

select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 9, 0
  ),
  'partner A records rating 9'
);
select is((select user_id from public.member_ratings where rating = 9), '81111111-1111-4111-8111-111111111111'::uuid, 'rating author derives from auth.uid');
select ok(
  not pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'typo_score', 5, 0
  ),
  'arbitrary rating dimension is rejected'
);
select ok(
  not pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 10.01, 1
  ),
  'rating above ten is rejected'
);

select set_config('request.jwt.claims', '{"sub":"82222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 6, 0
  ),
  'partner B records independent rating 6'
);
select is((select count(*)::integer from public.member_ratings), 2, 'partner may read both ratings for comparison');
select is((select rating from public.member_ratings where user_id = '81111111-1111-4111-8111-111111111111'), 9.00::numeric, 'partner A rating remains 9');
select is((select rating from public.member_ratings where user_id = '82222222-2222-4222-8222-222222222222'), 6.00::numeric, 'partner B rating remains 6');

select set_config('request.jwt.claims', '{"sub":"81111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select ok(
  pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 8, 1
  ),
  'partner A updates own rating with current revision'
);
select is((select rating from public.member_ratings where user_id = '81111111-1111-4111-8111-111111111111'), 8.00::numeric, 'partner A rating changes to 8');
select is((select rating from public.member_ratings where user_id = '82222222-2222-4222-8222-222222222222'), 6.00::numeric, 'partner B rating remains unchanged');
select ok(
  not pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 7, 1
  ),
  'stale rating overwrite is rejected'
);
select throws_ok(
  $$update public.member_ratings set rating = 10
    where user_id = '82222222-2222-4222-8222-222222222222'$$,
  '42501', 'permission denied for table member_ratings',
  'client cannot directly mutate partner rating row'
);
select ok(
  not pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8b100000-0000-4000-8000-000000000001',
    'love_score', 5, 0
  ),
  'rating command rejects cross-project Venue target'
);

select set_config('request.jwt.claims', '{"sub":"87777777-7777-4777-8777-777777777777","role":"authenticated"}', true);
select ok(
  not pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'love_score', 5, 0
  ),
  'revoked member cannot record rating'
);
select is((select count(*)::integer from public.member_ratings), 0, 'revoked member cannot read project ratings');

select set_config('request.jwt.claims', '{"sub":"86666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*)::integer from public.member_ratings), 0, 'outsider cannot read project ratings');

select set_config('request.jwt.claims', '{"sub":"85555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is((select count(*)::integer from public.member_ratings), 0, 'project-B owner cannot read project-A ratings');

select set_config('request.jwt.claims', '{"sub":"84444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select ok(
  pg_temp.try_rating(
    '8aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '8a100000-0000-4000-8000-000000000001',
    'logistics_score_personal', 4.5, 0
  ),
  'viewer may record own personal rating while unable to edit shared Venue data'
);
select is((select count(*)::integer from public.member_ratings), 3, 'viewer with venues.read sees comparison ratings including own');

select * from finish();
rollback;
