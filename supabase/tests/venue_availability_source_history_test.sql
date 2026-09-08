begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'f1111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'availability-source-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Availability source-history project',
  'f1111111-1111-4111-8111-111111111111',
  'f1111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'f1111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values (
  'fa100000-0000-4000-8000-000000000001',
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'SRC',
  'Availability source-history venue',
  'research',
  'f1111111-1111-4111-8111-111111111111',
  'f1111111-1111-4111-8111-111111111111'
);

insert into public.sources (
  id, project_id, source_type, title, url, evidence_level, observed_at,
  notes, status, created_by, updated_by
)
values (
  'fa300000-0000-4000-8000-000000000001',
  'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'official_website',
  'Synthetic availability source',
  'https://example.com/venue-availability',
  'confirmed_for_event',
  '2026-09-08T10:00:00Z'::timestamptz,
  null,
  'active',
  'f1111111-1111-4111-8111-111111111111',
  'f1111111-1111-4111-8111-111111111111'
);

create function pg_temp.delete_source_sqlstate()
returns text language plpgsql as $$
begin
  delete from public.sources
  where project_id = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    and id = 'fa300000-0000-4000-8000-000000000001';
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select lives_ok(
  $$select public.append_venue_availability(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa400000-0000-4000-8000-000000000001',
    null,
    '2027-06-12',
    'available',
    null,
    '2026-09-08T10:30:00Z',
    'fa300000-0000-4000-8000-000000000001',
    'synthetic availability evidence'
  )$$,
  'availability can cite a same-project source'
);

select lives_ok(
  $$select public.update_venue_fact_source(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
    'fa300000-0000-4000-8000-000000000001'::uuid,
    1::bigint,
    'official_website'::text,
    'Synthetic availability source'::text,
    null::text,
    'confirmed_for_event'::text,
    '2026-09-08T10:00:00Z'::text,
    'URL removed after link breakage'::text,
    'broken'::text
  )$$,
  'linked source can become broken and remove its URL'
);

select ok(
  exists (
    select 1
    from public.venue_availabilities va
    where va.id = 'fa400000-0000-4000-8000-000000000001'
      and va.project_id = 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and va.source_id = 'fa300000-0000-4000-8000-000000000001'
      and va.status = 'available'
      and va.observed_at = '2026-09-08T10:30:00Z'::timestamptz
  ),
  'source breakage and URL removal preserve immutable availability history'
);

reset role;

select is(
  pg_temp.delete_source_sqlstate(),
  '23503',
  'direct source deletion is restricted while availability history cites it'
);

select is(
  (
    select count(*)
    from public.venue_availabilities
    where id = 'fa400000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'failed source deletion cannot destroy the linked availability row'
);

select * from finish();
rollback;
