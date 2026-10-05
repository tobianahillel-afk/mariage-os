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
  ) is null,
  'legacy non-receipt rating signature is removed'
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
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
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
  $$select public.set_venue_member_rating(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '22023',
  'venue rating unavailable',
  'same operation id cannot cross project identity'
);

reset role;

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
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'love_score',
    9,
    0,
    'dd600000-0000-4000-8000-000000000001',
    'dd700000-0000-4000-8000-000000000001'
  )$$,
  '40001',
  'venue rating conflict',
  'old acknowledged operation conflicts after the rating changed later'
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
  '40001',
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
  $$select public.set_venue_member_rating(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'dd100000-0000-4000-8000-000000000001',
    'value_for_money_score_personal',
    7,
    0,
    'dd600000-0000-4000-8000-000000000020',
    'dd700000-0000-4000-8000-000000000020'
  )$$,
  '42501',
  'venue rating unavailable',
  'revoked member cannot exploit an existing replay receipt'
);

reset role;
select * from finish();
rollback;
