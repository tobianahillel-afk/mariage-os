begin;
create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'fact_observations', 'fact observations table exists');
select has_table('public', 'sources', 'sources table exists');
select has_table('public', 'observation_sources', 'observation sources table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.fact_observations'::regclass),
  'observations RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.sources'::regclass),
  'sources RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.observation_sources'::regclass),
  'links RLS enabled'
);
select has_function(
  'public',
  'create_venue_fact_source',
  array['uuid','text','text','text','text','timestamp with time zone','text','text'],
  'create source RPC exists'
);
select has_function(
  'public',
  'append_venue_fact_observation',
  array['uuid','uuid','jsonb','text','text','text','timestamp with time zone','text','uuid'],
  'append observation RPC exists'
);
select has_function(
  'public',
  'link_venue_fact_observation_source',
  array['uuid','uuid','uuid','boolean'],
  'link source RPC exists'
);
select has_function(
  'public',
  'resolve_venue_fact_from_observation',
  array['uuid','uuid','uuid','bigint','text','text'],
  'resolve observation RPC exists'
);
select ok(
  not has_table_privilege('authenticated', 'public.fact_observations', 'insert')
  and not has_table_privilege('authenticated', 'public.fact_observations', 'update')
  and not has_table_privilege('authenticated', 'public.fact_observations', 'delete')
  and not has_table_privilege('authenticated', 'public.sources', 'insert')
  and not has_table_privilege('authenticated', 'public.sources', 'update')
  and not has_table_privilege('authenticated', 'public.observation_sources', 'insert'),
  'authenticated cannot bypass evidence RPCs'
);

insert into auth.users(
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
('00000000-0000-0000-0000-000000000000','c1111111-1111-4111-8111-111111111111','authenticated','authenticated','evidence-a-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','c2222222-2222-4222-8222-222222222222','authenticated','authenticated','evidence-a-editor@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','c3333333-3333-4333-8333-333333333333','authenticated','authenticated','evidence-a-viewer@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','c4444444-4444-4444-8444-444444444444','authenticated','authenticated','evidence-outsider@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','d1111111-1111-4111-8111-111111111111','authenticated','authenticated','evidence-b-owner@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now()),
('00000000-0000-0000-0000-000000000000','c5555555-5555-4555-8555-555555555555','authenticated','authenticated','evidence-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"]}','{}',now(),now());

insert into public.projects(id, name, created_by, updated_by) values
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','Evidence A','c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111'),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','Evidence B','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');

insert into public.project_members(
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
) values
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','c1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','c2222222-2222-4222-8222-222222222222','editor','active',now(),null),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','c3333333-3333-4333-8333-333333333333','viewer','active',now(),null),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','d1111111-1111-4111-8111-111111111111','owner','active',now(),null),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','c5555555-5555-4555-8555-555555555555','owner','revoked',now(),now());

insert into public.venues(
  id, project_id, code, name, status, created_by, updated_by
) values
('cc100000-0000-4000-8000-000000000001','cccccccc-cccc-4ccc-8ccc-cccccccccccc','A1','Evidence Venue A','research','c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111'),
('dd100000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','B1','Evidence Venue B','research','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');

insert into public.fact_definitions(
  id, project_id, key, label, entity_type, value_type, priority,
  system_defined, created_by, updated_by
) values
('cc200000-0000-4000-8000-000000000001','cccccccc-cccc-4ccc-8ccc-cccccccccccc','external_caterer_allowed','External caterer','venue','boolean','blocking',false,'c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111'),
('dd200000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','external_caterer_allowed','External caterer','venue','boolean','blocking',false,'d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');

insert into public.facts(
  id, project_id, target_type, target_id, definition_id, state,
  retained_value, created_by, updated_by
) values
('cc300000-0000-4000-8000-000000000001','cccccccc-cccc-4ccc-8ccc-cccccccccccc','venue','cc100000-0000-4000-8000-000000000001','cc200000-0000-4000-8000-000000000001','known','true','c1111111-1111-4111-8111-111111111111','c1111111-1111-4111-8111-111111111111'),
('dd300000-0000-4000-8000-000000000001','dddddddd-dddd-4ddd-8ddd-dddddddddddd','venue','dd100000-0000-4000-8000-000000000001','dd200000-0000-4000-8000-000000000001','known','true','d1111111-1111-4111-8111-111111111111','d1111111-1111-4111-8111-111111111111');

insert into public.sources(
  id, project_id, source_type, title, url, evidence_level, status,
  created_by, updated_by
) values (
  'dd400000-0000-4000-8000-000000000001',
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'contract',
  'Project B contract',
  'https://example.com/project-b',
  'contractual',
  'active',
  'd1111111-1111-4111-8111-111111111111',
  'd1111111-1111-4111-8111-111111111111'
);

create function pg_temp.try_source(
  p uuid, t text, l text, s text
) returns uuid language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.create_venue_fact_source(
    p, t, 'Synthetic source', 'https://example.com/evidence', l,
    now(), 'notes', s
  );
  return (result_row ->> 'id')::uuid;
exception when others then
  return null;
end$$;

create function pg_temp.try_observation(
  p uuid, f uuid, v jsonb, l text, c text, supersedes uuid
) returns uuid language plpgsql as $$
declare result_row jsonb;
begin
  result_row := public.append_venue_fact_observation(
    p, f, v, 'raw evidence', l, c, now(), 'note', supersedes
  );
  return (result_row ->> 'id')::uuid;
exception when others then
  return null;
end$$;

create function pg_temp.try_link(
  p uuid, o uuid, s uuid, primary_flag boolean
) returns boolean language plpgsql as $$
begin
  perform public.link_venue_fact_observation_source(p, o, s, primary_flag);
  return true;
exception when others then
  return false;
end$$;

create function pg_temp.try_resolve(
  p uuid, f uuid, o uuid, r bigint, s text, n text
) returns boolean language plpgsql as $$
begin
  perform public.resolve_venue_fact_from_observation(p, f, o, r, s, n);
  return true;
exception when others then
  return false;
end$$;

set local role anon;
select throws_ok(
  $$select * from public.fact_observations$$,
  '42501',
  'permission denied for table fact_observations',
  'anon observations denied'
);
select throws_ok(
  $$select * from public.sources$$,
  '42501',
  'permission denied for table sources',
  'anon sources denied'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select isnt(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'contract',
    'contractual',
    'active'
  ),
  null::uuid,
  'owner creates contract source'
);
select isnt(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'official_website',
    'official_general',
    'active'
  ),
  null::uuid,
  'owner creates official website source'
);
select is(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'bad_type',
    'contractual',
    'active'
  ),
  null::uuid,
  'invalid source type rejected'
);
select is(
  pg_temp.try_source(
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'contract',
    'contractual',
    'active'
  ),
  null::uuid,
  'project-B source creation injection rejected'
);

select isnt(
  pg_temp.try_observation(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    'false',
    'estimated',
    'low',
    null
  ),
  null::uuid,
  'weaker conflicting observation appends'
);
select is(
  (select retained_value from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'true'::jsonb,
  'append does not overwrite retained truth'
);
select is(
  (select state from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'known',
  'append does not force conflict state'
);
select is(
  pg_temp.try_observation(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    '"false"',
    'contractual',
    'high',
    null
  ),
  null::uuid,
  'typed observation rejects string boolean'
);
select is(
  pg_temp.try_observation(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'dd300000-0000-4000-8000-000000000001',
    'true',
    'contractual',
    'high',
    null
  ),
  null::uuid,
  'cross-project fact injection rejected'
);

select isnt(
  pg_temp.try_observation(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    'false',
    'contractual',
    'high',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
      limit 1
    )
  ),
  null::uuid,
  'correction appends and supersedes old observation'
);
select is(
  (
    select count(*) from public.fact_observations
    where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  2::bigint,
  'supersession preserves both rows'
);
select is(
  (
    select count(*) from public.fact_observations
    where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
      and observation_status = 'superseded'
  ),
  1::bigint,
  'old observation is superseded not deleted'
);
select is(
  (select retained_value from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'true'::jsonb,
  'supersession still does not replace retained truth'
);

select ok(
  pg_temp.try_link(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    (
      select id from public.sources
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and source_type = 'contract'
    ),
    true
  ),
  'contract source links to active observation'
);
select ok(
  pg_temp.try_link(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    (
      select id from public.sources
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and source_type = 'official_website'
    ),
    false
  ),
  'official source also links to same observation'
);
select is(
  (
    select count(*) from public.observation_sources
    where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  2::bigint,
  'one observation retains two distinct source links'
);
select ok(
  not pg_temp.try_link(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    'dd400000-0000-4000-8000-000000000001',
    false
  ),
  'real project-B source cross-link rejected'
);

select ok(
  pg_temp.try_resolve(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    1,
    'known',
    'explicit choice'
  ),
  'explicit resolution selects active observation'
);
select is(
  (select retained_value from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'false'::jsonb,
  'explicit resolution changes retained value'
);
select isnt(
  (select retained_observation_id from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  null::uuid,
  'resolution records retained observation'
);
select is(
  (select resolved_by from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'c1111111-1111-4111-8111-111111111111'::uuid,
  'resolution records actor'
);
select ok(
  not pg_temp.try_resolve(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    1,
    'known',
    null
  ),
  'stale resolution rejected'
);
select ok(
  not pg_temp.try_resolve(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    2,
    'conflict',
    null
  ),
  'conflict selecting observation requires rationale'
);
select ok(
  pg_temp.try_resolve(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    (
      select id from public.fact_observations
      where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
        and observation_status = 'active'
    ),
    2,
    'conflict',
    'Contradictory evidence retained deliberately'
  ),
  'conflict resolution with rationale accepted'
);
select is(
  (select state from public.facts where id = 'cc300000-0000-4000-8000-000000000001'),
  'conflict',
  'resolved conflict remains explicit conflict state'
);

select throws_ok(
  $$update public.fact_observations set value = 'true' where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  '42501',
  'permission denied for table fact_observations',
  'direct observation rewrite denied'
);
select throws_ok(
  $$delete from public.fact_observations where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  '42501',
  'permission denied for table fact_observations',
  'direct observation delete denied'
);
select throws_ok(
  $$update public.facts set retained_observation_id = null where id = 'cc300000-0000-4000-8000-000000000001'$$,
  '42501',
  'permission denied for table facts',
  'direct resolution forgery denied'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select isnt(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'phone_call_note',
    'observed',
    'active'
  ),
  null::uuid,
  'editor may append source evidence'
);
select isnt(
  pg_temp.try_observation(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'cc300000-0000-4000-8000-000000000001',
    null,
    'unknown_source',
    'unknown',
    null
  ),
  null::uuid,
  'observation may retain raw evidence without normalized value'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select cmp_ok((select count(*) from public.fact_observations), '>', 0::bigint, 'viewer reads observations');
select cmp_ok((select count(*) from public.sources), '>', 0::bigint, 'viewer reads sources');
select is(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'contract',
    'contractual',
    'active'
  ),
  null::uuid,
  'viewer cannot mutate evidence'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is((select count(*) from public.fact_observations), 0::bigint, 'outsider sees no observations');
select is((select count(*) from public.sources), 0::bigint, 'outsider sees no sources');

select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  (
    select count(*) from public.fact_observations
    where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  0::bigint,
  'project-B owner cannot read A observations'
);
select is(
  (
    select count(*) from public.sources
    where project_id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  0::bigint,
  'project-B owner cannot read A sources'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"c5555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select is((select count(*) from public.fact_observations), 0::bigint, 'revoked member sees no observations');
select is((select count(*) from public.sources), 0::bigint, 'revoked member sees no sources');
select is(
  pg_temp.try_source(
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'contract',
    'contractual',
    'active'
  ),
  null::uuid,
  'revoked member cannot mutate evidence'
);

reset role;
select * from finish();
rollback;
