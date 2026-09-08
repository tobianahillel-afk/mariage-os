begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'b1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'offer-readiness-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Quote Readiness Project',
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'b1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'ba100000-0000-4000-8000-000000000001',
  'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'READY1',
  'Quote Readiness Venue',
  'research',
  'b1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);

create function pg_temp.component_payload(target_component_id uuid)
returns jsonb language sql immutable as $$
  select jsonb_build_array(jsonb_build_object(
    'id', target_component_id,
    'label', 'Room',
    'component_type', 'included',
    'calculation_type', 'fixed',
    'unit_amount_minor', null,
    'quantity', null,
    'unit_label', null,
    'currency', 'EUR',
    'tax_mode', 'unknown',
    'tax_rate_basis_points', null,
    'notes', null
  ));
$$;

create function pg_temp.try_create_offer(
  target_offer_id uuid,
  target_status text,
  target_valid_to text,
  target_base_amount_minor bigint,
  target_components jsonb
)
returns boolean language plpgsql as $$
begin
  perform public.create_venue_offer(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ba100000-0000-4000-8000-000000000001',
    target_offer_id,
    target_status,
    'Readiness quote',
    null,
    target_valid_to,
    null,
    target_base_amount_minor,
    'EUR',
    'unknown',
    null,
    null,
    null,
    null,
    null,
    null,
    true,
    null,
    null,
    0::smallint,
    null,
    null,
    null,
    target_components
  );
  return true;
exception when others then
  return false;
end;
$$;

create function pg_temp.try_transition_to_quoted(target_offer_id uuid)
returns boolean language plpgsql as $$
begin
  perform public.transition_venue_offer_status(
    'baaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ba100000-0000-4000-8000-000000000001',
    target_offer_id,
    'quoted',
    1
  );
  return true;
exception when others then
  return false;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select ok(
  not pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000001',
    'quoted',
    null,
    100000,
    pg_temp.component_payload('ba400000-0000-4000-8000-000000000001')
  ),
  'direct quoted creation rejects a missing validity end date'
);
select ok(
  not pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000002',
    'quoted',
    '2026-12-31',
    null,
    pg_temp.component_payload('ba400000-0000-4000-8000-000000000002')
  ),
  'direct quoted creation rejects a missing offer-level price signal'
);
select ok(
  not pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000003',
    'quoted',
    '2026-12-31',
    100000,
    '[]'::jsonb
  ),
  'direct quoted creation rejects an empty component set'
);

select ok(
  pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000011',
    'draft',
    null,
    100000,
    pg_temp.component_payload('ba400000-0000-4000-8000-000000000011')
  ),
  'setup creates draft missing validity only'
);
select ok(
  not pg_temp.try_transition_to_quoted('ba300000-0000-4000-8000-000000000011'),
  'draft to quoted rejects a missing validity end date'
);

select ok(
  pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000012',
    'draft',
    '2026-12-31',
    null,
    pg_temp.component_payload('ba400000-0000-4000-8000-000000000012')
  ),
  'setup creates draft missing price only'
);
select ok(
  not pg_temp.try_transition_to_quoted('ba300000-0000-4000-8000-000000000012'),
  'draft to quoted rejects a missing offer-level price signal'
);

select ok(
  pg_temp.try_create_offer(
    'ba300000-0000-4000-8000-000000000013',
    'draft',
    '2026-12-31',
    100000,
    '[]'::jsonb
  ),
  'setup creates draft missing components only'
);
select ok(
  not pg_temp.try_transition_to_quoted('ba300000-0000-4000-8000-000000000013'),
  'draft to quoted rejects an empty component set'
);

reset role;
select * from finish();
rollback;
