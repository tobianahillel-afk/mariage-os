begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'f1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'media-adversarial-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'media-adversarial-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Media adversarial project A', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Media adversarial project B', 'f2222222-2222-4222-8222-222222222222', 'f2222222-2222-4222-8222-222222222222');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'f1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'f2222222-2222-4222-8222-222222222222', 'owner', 'active', now(), null);

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  ('fa100000-0000-4000-8000-000000000001', 'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'MAA', 'Media adversarial venue A', 'research', 'f1111111-1111-4111-8111-111111111111', 'f1111111-1111-4111-8111-111111111111'),
  ('fb100000-0000-4000-8000-000000000001', 'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'MAB', 'Media adversarial venue B', 'research', 'f2222222-2222-4222-8222-222222222222', 'f2222222-2222-4222-8222-222222222222');

create function pg_temp.remote_media_sqlstate(
  target_project uuid,
  target_venue uuid,
  target_media uuid,
  target_link uuid,
  target_category text,
  target_remote text,
  target_source text,
  target_caption text
)
returns text language plpgsql as $$
begin
  perform public.create_venue_remote_media(
    target_project,
    target_venue,
    target_media,
    target_link,
    target_category,
    target_remote,
    target_source,
    target_caption
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

select is(
  public.create_venue_remote_media(
    'fbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'fb100000-0000-4000-8000-000000000001',
    'fb200000-0000-4000-8000-000000000001',
    'fb300000-0000-4000-8000-000000000001',
    'exterior',
    'https://example.com/project-b.jpg',
    'https://example.com/project-b',
    'Project B media'
  ) #>> '{link,id}',
  'fb300000-0000-4000-8000-000000000001',
  'project B fixture owns the foreign link identity'
);

reset role;
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.remote_media_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000010',
    'fb300000-0000-4000-8000-000000000001',
    'view',
    'https://example.com/foreign-link-collision.jpg',
    null,
    null
  ),
  '42501',
  'foreign-project link UUID collision is non-disclosing'
);

reset role;
select is(
  (select count(*)::integer
   from public.media
   where id = 'fa200000-0000-4000-8000-000000000010'),
  0,
  'foreign link collision rolls back the newly inserted media row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  public.create_venue_remote_media(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000020',
    'fa300000-0000-4000-8000-000000000020',
    'ceremony',
    'https://example.com/semantic-link.jpg',
    'https://example.com/semantic-link',
    'Semantic link fixture'
  ) #>> '{media,id}',
  'fa200000-0000-4000-8000-000000000020',
  'project A fixture creates the semantic Venue gallery relationship'
);

select is(
  pg_temp.remote_media_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000020',
    'fa300000-0000-4000-8000-000000000021',
    'ceremony',
    'https://example.com/semantic-link.jpg',
    'https://example.com/semantic-link',
    'Semantic link fixture'
  ),
  '23505',
  'same semantic Venue gallery link under a different caller link ID conflicts'
);

reset role;
select is(
  (select count(*)::integer
   from public.media_links
   where id = 'fa300000-0000-4000-8000-000000000021'),
  0,
  'semantic duplicate conflict leaves no second link row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"f1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  pg_temp.remote_media_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000030',
    'fa300000-0000-4000-8000-000000000030',
    null,
    'https://EXAMPLE.com/noncanonical-remote.jpg',
    null,
    null
  ),
  '22023',
  'direct RPC rejects a non-canonical remote URL instead of persisting it verbatim'
);

select is(
  pg_temp.remote_media_sqlstate(
    'faaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'fa100000-0000-4000-8000-000000000001',
    'fa200000-0000-4000-8000-000000000031',
    'fa300000-0000-4000-8000-000000000031',
    null,
    'https://example.com/canonical-remote.jpg',
    'https://EXAMPLE.com/noncanonical-source',
    null
  ),
  '22023',
  'direct RPC rejects a non-canonical source-page URL instead of persisting it verbatim'
);

reset role;

select * from finish();
rollback;
