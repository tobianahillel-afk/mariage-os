begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'media', 'media metadata table exists');
select has_table('public', 'media_links', 'media link table exists');
select has_function(
  'public',
  'create_venue_remote_media',
  array['uuid','uuid','uuid','uuid','text','text','text','text'],
  'atomic remote Venue media create/replay command exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.media'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.media_links'::regclass),
  'media tables have RLS enabled'
);
select ok(
  has_table_privilege('authenticated', 'public.media', 'select')
  and not has_table_privilege('authenticated', 'public.media', 'insert')
  and not has_table_privilege('authenticated', 'public.media', 'update')
  and not has_table_privilege('authenticated', 'public.media', 'delete')
  and has_table_privilege('authenticated', 'public.media_links', 'select')
  and not has_table_privilege('authenticated', 'public.media_links', 'insert')
  and not has_table_privilege('authenticated', 'public.media_links', 'update')
  and not has_table_privilege('authenticated', 'public.media_links', 'delete'),
  'authenticated clients cannot bypass the media RPC mutation boundary'
);
select ok(
  not has_table_privilege('anon', 'public.media', 'select')
  and not has_table_privilege('anon', 'public.media_links', 'select'),
  'anonymous role has no media read grants'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)',
    'execute'
  ),
  'only authenticated clients receive the remote media capability'
);
select ok(
  (select p.prosecdef
   from pg_proc p
   where p.oid = 'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)'::regprocedure),
  'remote media command is SECURITY DEFINER'
);
select is(
  (select p.proconfig[1]
   from pg_proc p
   where p.oid = 'public.create_venue_remote_media(uuid,uuid,uuid,uuid,text,text,text,text)'::regprocedure),
  'search_path=pg_catalog',
  'remote media command fixes search_path to pg_catalog'
);

select ok(
  public.media_public_url_is_valid('https://example.com/photo.jpg', true, true, false),
  'remote URL accepts canonical HTTPS DNS URL'
);
select ok(
  public.media_public_url_is_valid('https://8.8.8.8/photo.jpg', true, true, false),
  'remote URL accepts a public IP literal'
);
select ok(
  public.media_public_url_is_valid(
    'https://example.com/' || repeat('a', 2048 - char_length('https://example.com/')),
    true,
    true,
    false
  ),
  'remote URL accepts exactly 2048 Unicode scalar values'
);
select ok(
  not public.media_public_url_is_valid(
    'https://example.com/' || repeat('a', 2049 - char_length('https://example.com/')),
    true,
    true,
    false
  ),
  'remote URL rejects 2049 Unicode scalar values'
);
select ok(
  public.media_public_url_is_valid('http://example.com/source', false, false, true),
  'source-page URL accepts canonical HTTP navigation URL'
);
select ok(
  not public.media_public_url_is_valid('http://example.com/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://user:pass@example.com/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://localhost/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://router.local/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://10.0.0.1/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://127.0.0.1/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://169.254.1.1/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://192.168.1.1/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://[::1]/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://[fc00::1]/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://[fe80::1]/photo.jpg', true, true, false)
  and not public.media_public_url_is_valid('https://intranet/photo.jpg', true, true, false),
  'remote URL rejects insecure, credentialed and local/private-network forms'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'media-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'media-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'media-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'media-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'media-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'e6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'media-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Media Project A', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Media Project B', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'e4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'e6666666-6666-4666-8666-666666666666', 'editor', 'revoked', now(), now());

insert into public.venues (
  id, project_id, code, name, status, created_by, updated_by
)
values
  ('ea100000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'MDA', 'Media Venue A', 'research', 'e1111111-1111-4111-8111-111111111111', 'e1111111-1111-4111-8111-111111111111'),
  ('eb100000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'MDB', 'Media Venue B', 'research', 'e4444444-4444-4444-8444-444444444444', 'e4444444-4444-4444-8444-444444444444');

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
    target_project, target_venue, target_media, target_link,
    target_category, target_remote, target_source, target_caption
  );
  return '00000';
exception when others then
  return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

select is(
  public.create_venue_remote_media(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000001',
    'exterior',
    'https://example.com/venue-a.jpg',
    'https://example.com/venue-a',
    '  Marketing exterior  '
  ) #>> '{media,id}',
  'ea200000-0000-4000-8000-000000000001',
  'owner creates a remote Venue image atomically'
);

reset role;
select ok(
  (select
     media_type = 'image'
     and category = 'exterior'
     and storage_path is null
     and remote_url = 'https://example.com/venue-a.jpg'
     and source_page_url = 'https://example.com/venue-a'
     and original_filename is null
     and mime_type is null
     and size_bytes is null
     and sha256 is null
     and width_px is null
     and height_px is null
     and derivative_of_id is null
     and is_original
     and upload_status = 'ready'
     and caption = 'Marketing exterior'
     and created_by = 'e1111111-1111-4111-8111-111111111111'
   from public.media
   where id = 'ea200000-0000-4000-8000-000000000001'),
  'remote command persists only the frozen metadata-only image state'
);
select ok(
  (select
     media_id = 'ea200000-0000-4000-8000-000000000001'
     and target_type = 'venue'
     and target_id = 'ea100000-0000-4000-8000-000000000001'
     and relationship_type = 'gallery'
   from public.media_links
   where id = 'ea300000-0000-4000-8000-000000000001'),
  'remote command persists the frozen same-project Venue gallery link'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  public.create_venue_remote_media(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000001',
    'exterior',
    'https://example.com/venue-a.jpg',
    'https://example.com/venue-a',
    'Marketing exterior'
  ) #>> '{link,id}',
  'ea300000-0000-4000-8000-000000000001',
  'identical caller-owned payload replays idempotently'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000001',
    'interior_empty',
    'https://example.com/venue-a.jpg',
    'https://example.com/venue-a',
    'Marketing exterior'
  ),
  '23505',
  'same-project reused media identity with changed semantic payload conflicts'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000099',
    'ea300000-0000-4000-8000-000000000001',
    'view',
    'https://example.com/new.jpg',
    null,
    null
  ),
  '23505',
  'link identity collision conflicts and rolls back the whole semantic create'
);
reset role;
select is(
  (select count(*)::integer
   from public.media
   where id = 'ea200000-0000-4000-8000-000000000099'),
  0,
  'link failure leaves no partial media row'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"e1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000010',
    'ea300000-0000-4000-8000-000000000010',
    'bad-category',
    'https://example.com/bad.jpg',
    null,
    null
  ),
  '22023',
  'category outside the exact allowlist is rejected'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000011',
    'ea300000-0000-4000-8000-000000000011',
    null,
    'http://example.com/not-https.jpg',
    null,
    null
  ),
  '22023',
  'remote image URL must be HTTPS'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000012',
    'ea300000-0000-4000-8000-000000000012',
    null,
    'https://example.com/ok.jpg',
    null,
    repeat('x', 5001)
  ),
  '22023',
  'caption over 5000 Unicode scalar values is rejected'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000013',
    'ea300000-0000-4000-8000-000000000013',
    null,
    'https://example.com/' || repeat('a', 2049 - char_length('https://example.com/')),
    null,
    null
  ),
  '22023',
  'remote URL over 2048 Unicode scalar values is rejected at the command boundary'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000014',
    'ea300000-0000-4000-8000-000000000014',
    null,
    'https://example.com/ok.jpg',
    'https://example.com/' || repeat('a', 2049 - char_length('https://example.com/')),
    null
  ),
  '22023',
  'source-page URL over 2048 Unicode scalar values is rejected at the command boundary'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'eb100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000015',
    'ea300000-0000-4000-8000-000000000015',
    null,
    'https://example.com/cross.jpg',
    null,
    null
  ),
  '42501',
  'cross-project Venue target is non-disclosing and rejected'
);

select is(
  public.create_venue_remote_media(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000020',
    'ea300000-0000-4000-8000-000000000020',
    null,
    'https://example.com/' || repeat('a', 2048 - char_length('https://example.com/')),
    'http://example.com/' || repeat('b', 2048 - char_length('http://example.com/')),
    repeat('c', 5000)
  ) #>> '{media,id}',
  'ea200000-0000-4000-8000-000000000020',
  'command accepts exact 2048/2048/5000 boundaries without truncation'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e2222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);
select is(
  public.create_venue_remote_media(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000021',
    'ea300000-0000-4000-8000-000000000021',
    'interior_empty',
    'https://example.com/editor.jpg',
    null,
    null
  ) #>> '{media,id}',
  'ea200000-0000-4000-8000-000000000021',
  'editor with media.write can create remote Venue media'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e3333333-3333-4333-8333-333333333333","role":"authenticated"}',
  true
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000022',
    'ea300000-0000-4000-8000-000000000022',
    null,
    'https://example.com/viewer.jpg',
    null,
    null
  ),
  '42501',
  'viewer without media.write cannot create remote Venue media'
);
select ok(
  (select count(*) from public.media where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') >= 1,
  'viewer with media.read can read same-project media'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e5555555-5555-4555-8555-555555555555","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.media),
  0,
  'outsider reads no project media'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000023',
    'ea300000-0000-4000-8000-000000000023',
    null,
    'https://example.com/outsider.jpg',
    null,
    null
  ),
  '42501',
  'outsider cannot create remote Venue media'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e6666666-6666-4666-8666-666666666666","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.media),
  0,
  'revoked member reads no project media'
);
select is(
  pg_temp.remote_media_sqlstate(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000024',
    'ea300000-0000-4000-8000-000000000024',
    null,
    'https://example.com/revoked.jpg',
    null,
    null
  ),
  '42501',
  'revoked member cannot create remote Venue media'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"e4444444-4444-4444-8444-444444444444","role":"authenticated"}',
  true
);
select is(
  public.create_venue_remote_media(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb100000-0000-4000-8000-000000000001',
    'eb200000-0000-4000-8000-000000000001',
    'eb300000-0000-4000-8000-000000000001',
    'view',
    'https://example.com/venue-b.jpg',
    null,
    null
  ) #>> '{media,id}',
  'eb200000-0000-4000-8000-000000000001',
  'project-B owner creates project-B media'
);
select is(
  (select count(*)::integer
   from public.media
   where id = 'ea200000-0000-4000-8000-000000000001'),
  0,
  'project-B RLS cannot read project-A media even with known UUID'
);
select is(
  pg_temp.remote_media_sqlstate(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb100000-0000-4000-8000-000000000001',
    'ea200000-0000-4000-8000-000000000001',
    'eb300000-0000-4000-8000-000000000099',
    'exterior',
    'https://example.com/collision.jpg',
    null,
    null
  ),
  '42501',
  'foreign-project media UUID collision is non-disclosing'
);

select * from finish();
rollback;
