begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regprocedure(
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint,uuid,uuid)'
  ) is not null,
  'replay-safe rating command accepts stable operation and device identity'
);

select ok(
  to_regprocedure(
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint)'
  ) is not null,
  'legacy rating overload remains during the expand/switch compatibility window'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint)',
    'EXECUTE'
  ),
  'authenticated legacy clients remain compatible during rollout'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint)',
    'EXECUTE'
  ),
  'legacy compatibility does not widen anonymous access'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.set_venue_member_rating(uuid,uuid,text,numeric,bigint,uuid,uuid)',
    'EXECUTE'
  ),
  'anonymous cannot execute the replay-safe rating command'
);

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
(
  '00000000-0000-0000-0000-000000000000',
  'd1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'wp212s-owner-a@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'd2222222-2222-4222-8222-222222222222',
  'authenticated',
  'authenticated',
  'wp212s-viewer-a@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'd3333333-3333-4333-8333-333333333333',
  'authenticated',
  'authenticated',
  'wp212s-owner-b@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
),
(
  '00000000-0000-0000-0000-000000000000',
  'd4444444-4444-4444-8444-444444444444',
  'authenticated',
  'authenticated',
  'wp212s-revoked@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects(id, name, created_by, updated_by)
values
(
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'WP-2.12S rating replay A',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
),
(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'WP-2.12S rating replay B',
  'd3333333-3333-4333-8333-333333333333',
  'd3333333-3333-4333-8333-333333333333'
);

insert into public.project_members(
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
(
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'd1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
),
(
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'd2222222-2222-4222-8222-222222222222',
  'viewer',
  'active',
  now(),
  null
),
(
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'd3333333-3333-4333-8333-333333333333',
  'owner',
  'active',
  now(),
  null
),
(
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'd4444444-4444-4444-8444-444444444444',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues(
  id, project_id, code, name, status, created_by, updated_by
)
values
(
  'dd100000-0000-4000-8000-000000000001',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'S1',
  'Rating replay Venue A',
  'research',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
),
(
  'cc100000-0000-4000-8000-000000000001',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'S2',
  'Rating replay Venue B',
  'research',
  'd3333333-3333-4333-8333-333333333333',
  'd3333333-3333-4333-8333-333333333333'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $legacy$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'interior_aesthetic_score_personal',
    5.25,
    0
  )$legacy$,
  'authenticated legacy five-argument overload still mutates during rollout'
);

select is(
  (
    select rating
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'interior_aesthetic_score_personal'
  ),
  5.25::numeric,
  'legacy five-argument overload persists the authenticated rating'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'interior_aesthetic_score_personal'
  ),
  1::bigint,
  'legacy five-argument overload advances the row revision once'
);

select throws_ok(
  $legacy_stale_existing$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'interior_aesthetic_score_personal',
    6.5,
    0
  )$legacy_stale_existing$,
  'PT412',
  'venue rating unavailable',
  'legacy five-argument stale existing-row conflict is non-retryable'
);

reset role;

select is(
  (
    select rating
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'interior_aesthetic_score_personal'
  ),
  5.25::numeric,
  'legacy stale existing-row conflict leaves rating unchanged'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'interior_aesthetic_score_personal'
  ),
  1::bigint,
  'legacy stale existing-row conflict leaves revision unchanged'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $legacy_stale_missing$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'logistics_score_personal',
    6,
    1
  )$legacy_stale_missing$,
  'PT412',
  'venue rating unavailable',
  'legacy five-argument nonzero expected revision without a row is non-retryable'
);

reset role;

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'logistics_score_personal'
  ),
  0::bigint,
  'legacy missing-row stale conflict creates no rating row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $receipt$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$receipt$,
  'first receipt-aware rating write succeeds'
);

select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  'exact retry after lost response recognizes prior success'
);

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  1::bigint,
  'exact replay keeps one rating row'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  1::bigint,
  'exact replay does not increment rating revision twice'
);

reset role;

select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000001'
      and project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and device_id = 'dd700000-0000-4000-8000-000000000001'
      and entity_type = 'venue_member_rating'
      and result_revision = 1
  ),
  1::bigint,
  'accepted rating operation owns one completed replay receipt'
);

select is(
  (
    select entity_id
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000001'
  ),
  (
    select id
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  'receipt binds the acknowledged rating-row identity'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    8,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id with changed rating fails closed'
);

select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'logistics_score_personal',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id with changed dimension fails closed'
);

select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    1,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id with changed predecessor revision fails closed'
);

select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000099'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id from another device fails closed'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id cannot cross user identity'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.set_venue_member_rating(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$authz$,
  '22023',
  'venue rating unavailable',
  'same operation id cannot cross project identity'
);

select throws_ok(
  $authz$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'exterior_aesthetic_score_personal',
    4,
    0
  )$authz$,
  '42501',
  'venue rating unavailable',
  'authenticated outsider is denied by the legacy five-argument overload'
);

select throws_ok(
  $authz$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'value_for_money_score_personal',
    4.5,
    0,
    'dd600000-0000-4000-8000-000000000030',
    'dd700000-0000-4000-8000-000000000030'
  )$authz$,
  '42501',
  'venue rating unavailable',
  'authenticated outsider is denied by the receipt-aware seven-argument overload'
);

reset role;

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd3333333-3333-4333-8333-333333333333'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'exterior_aesthetic_score_personal'
  ),
  0::bigint,
  'denied legacy outsider attempt creates no rating row'
);

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd3333333-3333-4333-8333-333333333333'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'value_for_money_score_personal'
  ),
  0::bigint,
  'denied receipt-aware outsider attempt creates no rating row'
);

select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000030'
  ),
  0::bigint,
  'denied receipt-aware outsider attempt leaves no replay receipt'
);

insert into public.sync_mutation_receipts(
  operation_id, project_id, user_id, device_id, entity_type, entity_id,
  result_revision
)
values (
  'dd600000-0000-4000-8000-000000000099',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'd1111111-1111-4111-8111-111111111111',
  'dd700000-0000-4000-8000-000000000001',
  'venue_core_update',
  'dd100000-0000-4000-8000-000000000001',
  1
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000099',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'operation id already owned by another command type fails closed'
);

select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    8,
    1,
    'dd600000-0000-4000-8000-000000000002',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  'genuinely new rating operation with current revision succeeds'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  2::bigint,
  'new rating operation advances revision exactly once'
);

select throws_ok(
  $rating_replay$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$rating_replay$,
  'PT412',
  'venue rating conflict',
  'old acknowledged operation conflicts after the rating changed later'
);

reset role;

select is(
  (
    select rating
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  8::numeric,
  'acknowledged-rating conflict leaves the newer rating value unchanged'
);

select is(
  (
    select revision
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  2::bigint,
  'acknowledged-rating conflict leaves the newer rating revision unchanged'
);

select is(
  (
    select result_revision
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'acknowledged-rating conflict preserves the original receipt revision'
);

select is(
  (
    select entity_id
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000001'
  ),
  (
    select id
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'love_score'
  ),
  'acknowledged-rating conflict keeps the original receipt bound to the rating row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select throws_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    7,
    1,
    'dd600000-0000-4000-8000-000000000003',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  'PT412',
  'venue rating unavailable',
  'genuinely new stale operation still conflicts'
);

reset role;
select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000003'
  ),
  0::bigint,
  'failed stale operation leaves no durable replay receipt'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $missing_row_setup$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'exterior_aesthetic_score_personal',
    6,
    0,
    'dd600000-0000-4000-8000-000000000004',
    'dd700000-0000-4000-8000-000000000001'
  )$missing_row_setup$,
  'rating setup creates a durable receipt before row disappearance'
);

reset role;
delete from public.member_ratings
where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  and user_id = 'd1111111-1111-4111-8111-111111111111'
  and target_type = 'venue'
  and target_id = 'dd100000-0000-4000-8000-000000000001'
  and dimension_key = 'exterior_aesthetic_score_personal';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select throws_ok(
  $missing_row_replay$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'exterior_aesthetic_score_personal',
    6,
    0,
    'dd600000-0000-4000-8000-000000000004',
    'dd700000-0000-4000-8000-000000000001'
  )$missing_row_replay$,
  'PT412',
  'venue rating conflict',
  'receipt whose rating row disappeared uses non-retryable conflict'
);

reset role;
select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'exterior_aesthetic_score_personal'
  ),
  0::bigint,
  'missing acknowledged rating row is not recreated by replay'
);
select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000004'
  ),
  1::bigint,
  'missing-row conflict preserves the original durable receipt only'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select throws_ok(
  $missing_rating_stale$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'value_for_money_score_personal',
    6,
    1,
    'dd600000-0000-4000-8000-000000000005',
    'dd700000-0000-4000-8000-000000000001'
  )$missing_rating_stale$,
  'PT412',
  'venue rating unavailable',
  'nonzero expected revision without a rating uses non-retryable conflict'
);

reset role;
select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd1111111-1111-4111-8111-111111111111'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'value_for_money_score_personal'
  ),
  0::bigint,
  'missing-rating stale conflict creates no rating row'
);
select is(
  (
    select count(*)
    from public.sync_mutation_receipts
    where operation_id = 'dd600000-0000-4000-8000-000000000005'
  ),
  0::bigint,
  'missing-rating stale conflict leaves no replay receipt'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'logistics_score_personal',
    6,
    0,
    'dd600000-0000-4000-8000-000000000010',
    'dd700000-0000-4000-8000-000000000010'
  )$$,
  'active viewer preserves accepted self-rating capability'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"d4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select lives_ok(
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'value_for_money_score_personal',
    7,
    0,
    'dd600000-0000-4000-8000-000000000020',
    'dd700000-0000-4000-8000-000000000020'
  )$$,
  'active member creates a receipt before later revocation'
);

reset role;
update public.project_members
set membership_status = 'revoked',
    revoked_at = now()
where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  and user_id = 'd4444444-4444-4444-8444-444444444444';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"d4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select throws_ok(
  $authz$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'value_for_money_score_personal',
    7,
    0,
    'dd600000-0000-4000-8000-000000000020',
    'dd700000-0000-4000-8000-000000000020'
  )$authz$,
  '42501',
  'venue rating unavailable',
  'revoked member cannot exploit an existing replay receipt'
);

select throws_ok(
  $authz$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'logistics_score_personal',
    6,
    0
  )$authz$,
  '42501',
  'venue rating unavailable',
  'revoked member is denied by the legacy five-argument overload'
);

reset role;

select is(
  (
    select count(*)
    from public.member_ratings
    where project_id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and user_id = 'd4444444-4444-4444-8444-444444444444'
      and target_type = 'venue'
      and target_id = 'dd100000-0000-4000-8000-000000000001'
      and dimension_key = 'logistics_score_personal'
  ),
  0::bigint,
  'denied legacy revoked-member attempt creates no rating row'
);

select * from finish();
rollback;
