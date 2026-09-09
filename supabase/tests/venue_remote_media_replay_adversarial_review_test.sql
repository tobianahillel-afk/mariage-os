begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'c8111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'media-replay-review-owner@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Media replay adversarial review',
  'c8111111-1111-4111-8111-111111111111',
  'c8111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'c8111111-1111-4111-8111-111111111111',
  'owner',
  'active',
  now(),
  null
);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  (
    'c8100000-0000-4000-8000-000000000001',
    'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'MRA1',
    'Media replay review venue one',
    'research',
    'c8111111-1111-4111-8111-111111111111',
    'c8111111-1111-4111-8111-111111111111'
  ),
  (
    'c8100000-0000-4000-8000-000000000002',
    'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'MRA2',
    'Media replay review venue two',
    'research',
    'c8111111-1111-4111-8111-111111111111',
    'c8111111-1111-4111-8111-111111111111'
  );

create function pg_temp.remote_media_sqlstate(
  target_venue uuid,
  target_media uuid,
  target_link uuid
)
returns text language plpgsql as $$
begin
  perform public.create_venue_remote_media(
    'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    target_venue,
    target_media,
    target_link,
    'exterior',
    'https://example.com/replay-identity.jpg',
    'https://example.com/replay-identity',
    'Replay identity fixture'
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"c8111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.remote_media_sqlstate(
    'c8100000-0000-4000-8000-000000000001',
    'c8200000-0000-4000-8000-000000000001',
    'c8300000-0000-4000-8000-000000000001'
  ),
  '00000',
  'fixture creates the original remote media and Venue link'
);

select is(
  pg_temp.remote_media_sqlstate(
    'c8100000-0000-4000-8000-000000000002',
    'c8200000-0000-4000-8000-000000000001',
    'c8300000-0000-4000-8000-000000000002'
  ),
  '23505',
  'WP2.8A-B-001: reused media identity with a different Venue/link payload conflicts'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.media_links
    where project_id = 'c8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and media_id = 'c8200000-0000-4000-8000-000000000001'
  ),
  1,
  'WP2.8A-B-001: rejected replay drift leaves only the original semantic link'
);

select * from finish();
rollback;
