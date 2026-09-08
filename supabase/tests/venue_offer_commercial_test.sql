begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'venue_offers', 'venue_offers table exists');
select has_table('public', 'offer_components', 'offer_components table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.venue_offers'::regclass),
  'venue_offers has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.offer_components'::regclass),
  'offer_components has RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.venue_offers', 'select')
  and not has_table_privilege('authenticated', 'public.venue_offers', 'insert')
  and not has_table_privilege('authenticated', 'public.venue_offers', 'update')
  and not has_table_privilege('authenticated', 'public.venue_offers', 'delete'),
  'authenticated clients cannot bypass venue offer RPC boundaries'
);
select ok(
  has_table_privilege('authenticated', 'public.offer_components', 'select')
  and not has_table_privilege('authenticated', 'public.offer_components', 'insert')
  and not has_table_privilege('authenticated', 'public.offer_components', 'update')
  and not has_table_privilege('authenticated', 'public.offer_components', 'delete'),
  'authenticated clients cannot bypass offer component RPC boundaries'
);
select ok(
  not has_table_privilege('anon', 'public.venue_offers', 'select')
  and not has_table_privilege('anon', 'public.offer_components', 'select'),
  'anonymous role has no commercial read grants'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'c1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'offer-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'offer-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'offer-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'offer-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'offer-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'offer-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Offer Project A', 'c1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111'),
  ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Offer Project B', 'c4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'c4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'c6666666-6666-4666-8666-666666666666', 'owner', 'revoked', now(), now());

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ca100000-0000-4000-8000-000000000001', 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'OA1', 'Offer Venue A', 'research', 'c1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111'),
  ('cb100000-0000-4000-8000-000000000001', 'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'OB1', 'Offer Venue B', 'research', 'c4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444');

insert into public.sources (
  id, project_id, source_type, title, evidence_level, status, created_by, updated_by
)
values
  ('ca200000-0000-4000-8000-000000000001', 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'quote', 'Synthetic quote A', 'confirmed_for_event', 'active', 'c1111111-1111-4111-8111-111111111111', 'c1111111-1111-4111-8111-111111111111'),
  ('cb200000-0000-4000-8000-000000000001', 'cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'quote', 'Synthetic quote B', 'confirmed_for_event', 'active', 'c4444444-4444-4444-8444-444444444444', 'c4444444-4444-4444-8444-444444444444');

create function pg_temp.try_create_offer(
  target_project uuid,
  target_venue uuid,
  target_offer uuid,
  target_status text,
  target_source uuid,
  target_components jsonb
)
returns boolean language plpgsql as $$
begin
  perform public.create_venue_offer(
    target_project,
    target_venue,
    target_offer,
    target_status,
    '  Synthetic commercial offer  ',
    '2027-06-01',
    '2027-06-30',
    6::smallint,
    250000::bigint,
    'EUR',
    'excluded',
    2000,
    180,
    1500::bigint,
    50000::bigint,
    true,
    100000::bigint,
    true,
    '18:00',
    '02:00',
    1::smallint,
    25000::bigint,
    target_source,
    '  synthetic evidence  ',
    target_components
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_update_offer(
  target_project uuid,
  target_venue uuid,
  target_offer uuid,
  target_revision bigint,
  target_name text
)
returns boolean language plpgsql as $$
begin
  perform public.update_venue_offer_draft(
    target_project,
    target_venue,
    target_offer,
    target_revision,
    target_name,
    '2027-06-01',
    '2027-06-30',
    6::smallint,
    260000::bigint,
    'EUR',
    'excluded',
    2000,
    180,
    1500::bigint,
    50000::bigint,
    true,
    100000::bigint,
    true,
    '18:00',
    '02:00',
    1::smallint,
    25000::bigint,
    'ca200000-0000-4000-8000-000000000001',
    'updated synthetic evidence'
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_transition_offer(
  target_project uuid,
  target_venue uuid,
  target_offer uuid,
  target_status text,
  target_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.transition_venue_offer_status(
    target_project,
    target_venue,
    target_offer,
    target_status,
    target_revision
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_create_component(
  target_project uuid,
  target_offer uuid,
  target_component uuid,
  target_offer_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.create_venue_offer_component(
    target_project,
    target_offer,
    target_component,
    target_offer_revision,
    '  Furniture  ',
    'mandatory_extra',
    'per_guest',
    1200::bigint,
    180.125::numeric,
    '  guest  ',
    'EUR',
    'excluded',
    2000,
    '  synthetic component  '
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_update_component(
  target_project uuid,
  target_offer uuid,
  target_component uuid,
  target_offer_revision bigint,
  target_component_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.update_venue_offer_component(
    target_project,
    target_offer,
    target_component,
    target_offer_revision,
    target_component_revision,
    'Updated furniture',
    'mandatory_extra',
    'per_guest',
    1300::bigint,
    181.125::numeric,
    'guest',
    'EUR',
    'excluded',
    2000,
    'updated component'
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_remove_component(
  target_project uuid,
  target_offer uuid,
  target_component uuid,
  target_offer_revision bigint,
  target_component_revision bigint
)
returns boolean language plpgsql as $$
begin
  perform public.remove_venue_offer_component(
    target_project,
    target_offer,
    target_component,
    target_offer_revision,
    target_component_revision
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.lifecycle_component(target_component uuid)
returns jsonb language sql immutable as $$
  select jsonb_build_array(jsonb_build_object(
    'id', target_component,
    'label', 'Lifecycle component',
    'component_type', 'included',
    'calculation_type', 'fixed',
    'unit_amount_minor', 1000,
    'quantity', 1,
    'unit_label', 'package',
    'currency', 'EUR',
    'tax_mode', 'included',
    'tax_rate_basis_points', 2000,
    'notes', 'synthetic lifecycle component'
  ));
$$;

set local role anon;
select throws_ok(
  $$select * from public.venue_offers$$,
  '42501',
  'permission denied for table venue_offers',
  'anonymous direct venue offer read is denied at grant layer'
);
select throws_ok(
  $$select * from public.offer_components$$,
  '42501',
  'permission denied for table offer_components',
  'anonymous direct offer component read is denied at grant layer'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select ok(
  pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    'draft',
    'ca200000-0000-4000-8000-000000000001',
    '[]'::jsonb
  ),
  'owner creates a draft offer in own project'
);
select ok(
  (select name = 'Synthetic commercial offer'
     and status = 'draft'
     and revision = 1
     and included_start_time = '18:00'::time
     and included_end_time = '02:00'::time
     and included_end_day_offset = 1
   from public.venue_offers
   where id = 'ca300000-0000-4000-8000-000000000001'),
  'draft creation canonicalizes text and retains explicit after-midnight semantics'
);
select ok(
  pg_temp.try_update_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    1,
    '  Revised draft  '
  ),
  'owner edits draft through expected-revision command'
);
select is(
  (select revision from public.venue_offers where id = 'ca300000-0000-4000-8000-000000000001'),
  2::bigint,
  'draft edit increments offer revision'
);
select ok(
  not pg_temp.try_update_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    1,
    'Stale overwrite'
  ),
  'stale draft edit is rejected'
);
select is(
  (select name from public.venue_offers where id = 'ca300000-0000-4000-8000-000000000001'),
  'Revised draft',
  'stale draft edit cannot overwrite canonical terms'
);

select ok(
  pg_temp.try_create_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000001',
    2
  ),
  'owner adds component while offer is draft'
);
select ok(
  (select label = 'Furniture'
     and owner_type = 'venue_offer'
     and quantity = 180.125::numeric
     and revision = 1
   from public.offer_components
   where id = 'ca400000-0000-4000-8000-000000000001'),
  'component canonicalization and staged owner type persist exactly'
);
select ok(
  pg_temp.try_update_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000001',
    2,
    1
  ),
  'owner updates draft component with both revisions'
);
select is(
  (select revision from public.offer_components where id = 'ca400000-0000-4000-8000-000000000001'),
  2::bigint,
  'component update increments component revision'
);
select ok(
  not pg_temp.try_update_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000001',
    2,
    1
  ),
  'stale component revision is rejected'
);

select ok(
  pg_temp.try_transition_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    'quoted',
    2
  ),
  'draft transitions explicitly to quoted'
);
select is(
  (select revision from public.venue_offers where id = 'ca300000-0000-4000-8000-000000000001'),
  3::bigint,
  'quote transition increments offer revision'
);
select ok(
  not pg_temp.try_update_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000001',
    3,
    'Illegal quoted rewrite'
  ),
  'quoted commercial terms are immutable'
);
select ok(
  not pg_temp.try_create_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000002',
    3
  ),
  'quoted offer rejects new components'
);
select ok(
  not pg_temp.try_update_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000001',
    3,
    2
  ),
  'quoted offer rejects component edits'
);
select ok(
  not pg_temp.try_remove_component(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca300000-0000-4000-8000-000000000001',
    'ca400000-0000-4000-8000-000000000001',
    3,
    2
  ),
  'quoted offer rejects component removal'
);

select ok(
  pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000002',
    'quoted',
    'ca200000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'id', 'ca400000-0000-4000-8000-000000000010',
      'label', 'Included furniture',
      'component_type', 'included',
      'calculation_type', 'fixed',
      'unit_amount_minor', 5000,
      'quantity', 1,
      'unit_label', 'package',
      'currency', 'EUR',
      'tax_mode', 'included',
      'tax_rate_basis_points', 2000,
      'notes', 'quoted component'
    ))
  ),
  'received quoted offer and its components are created atomically'
);
select ok(
  (select status = 'quoted' and revision = 2
   from public.venue_offers where id = 'ca300000-0000-4000-8000-000000000002')
  and (select count(*) = 1 from public.offer_components where owner_id = 'ca300000-0000-4000-8000-000000000002'),
  'quoted creation retains component set before historical immutability begins'
);
select ok(
  not pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000003',
    'quoted',
    'ca200000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'id', 'ca400000-0000-4000-8000-000000000011',
      'label', 'Fractional money must fail',
      'component_type', 'included',
      'calculation_type', 'fixed',
      'unit_amount_minor', 12.5,
      'quantity', 1,
      'unit_label', 'package',
      'currency', 'EUR',
      'tax_mode', 'included',
      'tax_rate_basis_points', 2000,
      'notes', 'invalid fractional minor units'
    ))
  ),
  'nested component JSON rejects fractional minor-unit money without rounding'
);
select ok(
  not pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000004',
    'quoted',
    'ca200000-0000-4000-8000-000000000001',
    jsonb_build_array(jsonb_build_object(
      'id', 'ca400000-0000-4000-8000-000000000012',
      'label', 'Fractional tax rate must fail',
      'component_type', 'included',
      'calculation_type', 'fixed',
      'unit_amount_minor', 1200,
      'quantity', 1,
      'unit_label', 'package',
      'currency', 'EUR',
      'tax_mode', 'included',
      'tax_rate_basis_points', 12.5,
      'notes', 'invalid fractional basis points'
    ))
  ),
  'nested component JSON rejects fractional tax basis points without rounding'
);
select ok(
  not pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ca100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000005',
    'draft',
    'cb200000-0000-4000-8000-000000000001',
    '[]'::jsonb
  ),
  'same-project source integrity rejects project-B source injection'
);
select ok(
  not pg_temp.try_create_offer(
    'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'cb100000-0000-4000-8000-000000000001',
    'ca300000-0000-4000-8000-000000000006',
    'draft',
    'ca200000-0000-4000-8000-000000000001',
    '[]'::jsonb
  ),
  'same-project Venue integrity rejects project-B Venue injection'
);

select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000020', 'quoted', 'ca200000-0000-4000-8000-000000000001', pg_temp.lifecycle_component('ca400000-0000-4000-8000-000000000020'))
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000020', 'accepted', 2)
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000020', 'superseded', 3),
  'quoted -> accepted -> superseded lifecycle path is allowed'
);
select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000021', 'quoted', 'ca200000-0000-4000-8000-000000000001', pg_temp.lifecycle_component('ca400000-0000-4000-8000-000000000021'))
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000021', 'rejected', 2)
  and not pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000021', 'accepted', 3),
  'rejected offer is terminal'
);
select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000022', 'quoted', 'ca200000-0000-4000-8000-000000000001', pg_temp.lifecycle_component('ca400000-0000-4000-8000-000000000022'))
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000022', 'expired', 2)
  and not pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000022', 'superseded', 3),
  'expired offer is terminal'
);
select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000023', 'quoted', 'ca200000-0000-4000-8000-000000000001', pg_temp.lifecycle_component('ca400000-0000-4000-8000-000000000023'))
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000023', 'superseded', 2),
  'quoted -> superseded lifecycle path is allowed'
);
select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000024', 'draft', 'ca200000-0000-4000-8000-000000000001', '[]'::jsonb)
  and pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000024', 'rejected', 1),
  'draft -> rejected lifecycle path is allowed'
);
select ok(
  not pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000002', 'draft', 2)
  and not pg_temp.try_transition_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000002', 'mystery', 2),
  'representative denied and unknown lifecycle targets fail closed'
);

select set_config('request.jwt.claims', '{"sub":"c2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select ok(
  pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000030', 'draft', 'ca200000-0000-4000-8000-000000000001', '[]'::jsonb),
  'editor may create Venue offer because venues.write is granted'
);

select set_config('request.jwt.claims', '{"sub":"c3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select cmp_ok((select count(*) from public.venue_offers), '>', 0::bigint, 'viewer reads project Venue offers');
select ok(
  not pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000031', 'draft', 'ca200000-0000-4000-8000-000000000001', '[]'::jsonb),
  'viewer cannot create Venue offers'
);

select set_config('request.jwt.claims', '{"sub":"c5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is((select count(*) from public.venue_offers), 0::bigint, 'outsider sees no Venue offers');
select is((select count(*) from public.offer_components), 0::bigint, 'outsider sees no offer components');
select ok(
  not pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000032', 'draft', 'ca200000-0000-4000-8000-000000000001', '[]'::jsonb),
  'outsider cannot mutate known project offer resources'
);

select set_config('request.jwt.claims', '{"sub":"c6666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*) from public.venue_offers), 0::bigint, 'revoked member sees no Venue offers');
select ok(
  not pg_temp.try_create_offer('caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ca100000-0000-4000-8000-000000000001', 'ca300000-0000-4000-8000-000000000033', 'draft', 'ca200000-0000-4000-8000-000000000001', '[]'::jsonb),
  'revoked member cannot mutate Venue offers'
);

select set_config('request.jwt.claims', '{"sub":"c4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is(
  (select count(*) from public.venue_offers where project_id = 'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  0::bigint,
  'project-B owner cannot read project-A Venue offers'
);
select ok(
  pg_temp.try_create_offer('cbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'cb100000-0000-4000-8000-000000000001', 'cb300000-0000-4000-8000-000000000001', 'draft', 'cb200000-0000-4000-8000-000000000001', '[]'::jsonb),
  'project-B owner may create only own-project Venue offer'
);
select is((select count(*) from public.venue_offers), 1::bigint, 'project-B owner sees only own-project Venue offer rows');

reset role;
select throws_ok(
  $$insert into public.offer_components (
      id, project_id, owner_type, owner_id, label, component_type,
      calculation_type, currency, tax_mode, created_by, updated_by
    ) values (
      'ca400000-0000-4000-8000-000000000099',
      'caaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'vendor_offer',
      'ca300000-0000-4000-8000-000000000030',
      'Unsupported staged owner',
      'included',
      'fixed',
      'EUR',
      'unknown',
      'c1111111-1111-4111-8111-111111111111',
      'c1111111-1111-4111-8111-111111111111'
    )$$,
  '23514',
  null,
  'staged schema rejects unsupported future vendor_offer owner type'
);

select * from finish();
rollback;
