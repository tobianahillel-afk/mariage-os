begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'availability-adversarial-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'availability-adversarial-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Availability adversarial A', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Availability adversarial B', 'e2222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e2222222-2222-4222-8222-222222222222', 'owner', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ea100000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'EAA', 'Availability adversarial venue A', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('eb100000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'EAB', 'Availability adversarial venue B', 'research', 'e2222222-2222-4222-8222-222222222222', 'e2222222-2222-4222-8222-222222222222');

insert into public.wedding_date_options (
  id, project_id, event_date, label, status, created_by, updated_by
)
values (
  'ea200000-0000-4000-8000-000000000001',
  'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '2027-06-12',
  'Availability adversarial date A',
  'candidate',
  'e1111111-1111-4111-8111-111111111111',
  'e1111111-1111-4111-8111-111111111111'
);

create function pg_temp.append_availability_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_id uuid,
  target_date_option uuid,
  target_event_date text
)
returns text language plpgsql as $$
begin
  perform public.append_venue_availability(
    target_project,
    target_venue,
    target_id,
    target_date_option,
    target_event_date,
    'available',
    null,
    '2026-09-08T10:00:00Z',
    null,
    null
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

create function pg_temp.update_date_option_sqlstate()
returns text language plpgsql as $$
begin
  perform public.update_wedding_date_option(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000001',
    '2027-06-14'::date,
    'Availability adversarial date A',
    null,
    'candidate'
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);

select is(
  pg_temp.append_availability_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea400000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    '2027-06-12'
  ),
  '00000',
  'setup appends availability linked to the matching candidate date option'
);

select is(
  pg_temp.update_date_option_sqlstate(),
  '23503',
  'a referenced date option cannot drift away from immutable availability event_date'
);

select set_config('request.jwt.claims', '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is(
  pg_temp.append_availability_sqlstate(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb100000-0000-4000-8000-000000000001',
    'eb400000-0000-4000-8000-000000000001',
    null,
    '2027-06-12'
  ),
  '00000',
  'project B setup appends its availability row'
);

select set_config('request.jwt.claims', '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.append_availability_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'eb400000-0000-4000-8000-000000000001',
    null,
    '2027-06-12'
  ),
  '42501',
  'foreign-project retry identity is treated as unavailable rather than a same-project replay conflict'
);

select * from finish();
rollback;
