begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'ea111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'wp28b-adversarial-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'eb222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'wp28b-adversarial-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP-2.8B adversarial project A', 'ea111111-1111-4111-8111-111111111111', 'ea111111-1111-4111-8111-111111111111'),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'WP-2.8B adversarial project B', 'eb222222-2222-4222-8222-222222222222', 'eb222222-2222-4222-8222-222222222222');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'ea111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'eb222222-2222-4222-8222-222222222222', 'owner', 'active', now(), null);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values
  ('ea100000-0000-4000-8000-000000000001', 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'WP28BA', 'WP-2.8B adversarial venue A', 'research', 'ea111111-1111-4111-8111-111111111111', 'ea111111-1111-4111-8111-111111111111'),
  ('eb100000-0000-4000-8000-000000000001', 'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'WP28BB', 'WP-2.8B adversarial venue B', 'research', 'eb222222-2222-4222-8222-222222222222', 'eb222222-2222-4222-8222-222222222222');

create function pg_temp.try_storage_insert(object_name text)
returns boolean
language plpgsql
as $$
begin
  insert into storage.objects (bucket_id, name)
  values ('project-private', object_name);
  return true;
exception
  when insufficient_privilege then return false;
end;
$$;

create function pg_temp.try_reserve_original(
  operation_id uuid,
  project_id uuid,
  media_id uuid,
  venue_id uuid,
  link_id uuid,
  sha text
)
returns text
language plpgsql
as $$
begin
  perform public.manage_venue_private_media(
    'reserve_original', operation_id, project_id, media_id,
    venue_id, link_id, 'own_visit', 'Adversarial private photo',
    'Adversarial.jpg', 'image/jpeg', 128, sha, 4, 4,
    null, null, null
  );
  return '00000';
exception
  when others then return sqlstate;
end;
$$;

create function pg_temp.try_reserve_derivative(
  operation_id uuid,
  project_id uuid,
  media_id uuid,
  parent_id uuid,
  derivative_kind text,
  derivative_version integer
)
returns text
language plpgsql
as $$
begin
  perform public.manage_venue_private_media(
    'reserve_derivative', operation_id, project_id, media_id,
    null, null, null, null, null,
    'image/jpeg', 64,
    'dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    2, 2, parent_id, derivative_kind, derivative_version
  );
  return '00000';
exception
  when others then return sqlstate;
end;
$$;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select is(
  pg_temp.try_reserve_original(
    'ea400000-0000-4000-8000-000000000001',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000001',
    'ea100000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000001',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  '00000',
  'project A writer reserves first ready-original candidate'
);
select ok(
  pg_temp.try_storage_insert(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/ea200000-0000-4000-8000-000000000001/original'
  ),
  'project A writer uploads first exact reservation'
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_original',
    'ea400000-0000-4000-8000-000000000002',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000001'
  )$$,
  'project A first original finalizes'
);

select is(
  pg_temp.try_reserve_original(
    'ea400000-0000-4000-8000-000000000003',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000002',
    'ea100000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000002',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  '00000',
  'same-project exact SHA may reserve a second logical original'
);
select ok(
  pg_temp.try_storage_insert(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/ea200000-0000-4000-8000-000000000002/original'
  ),
  'same-project duplicate bytes keep an independent exact object path'
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_original',
    'ea400000-0000-4000-8000-000000000004',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000002'
  )$$,
  'same-project second original finalizes without destructive deduplication'
);
select is(
  (
    select count(*)::integer
    from public.media
    where sha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      and is_original
      and upload_status = 'ready'
  ),
  2,
  'authorized same-project equal SHA originals are detectable'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"eb222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.try_reserve_original(
    'eb400000-0000-4000-8000-000000000001',
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb200000-0000-4000-8000-000000000001',
    'eb100000-0000-4000-8000-000000000001',
    'eb300000-0000-4000-8000-000000000001',
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  '00000',
  'project B may independently reserve bytes with the same SHA'
);
select ok(
  pg_temp.try_storage_insert(
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/media/eb200000-0000-4000-8000-000000000001/original'
  ),
  'project B writer uploads its own equal-SHA object'
);
select lives_ok(
  $$select public.manage_venue_private_media(
    'finalize_original',
    'eb400000-0000-4000-8000-000000000002',
    'ebbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'eb200000-0000-4000-8000-000000000001'
  )$$,
  'project B equal-SHA original finalizes'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from public.media
    where sha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      and is_original
      and upload_status = 'ready'
  ),
  2,
  'project A hash lookup does not disclose project B equal bytes'
);

select is(
  pg_temp.try_reserve_derivative(
    'ea400000-0000-4000-8000-000000000005',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000010',
    'ea200000-0000-4000-8000-000000000001',
    'thumbnail', 1
  ),
  '00000',
  'ready private original accepts thumbnail v1 reservation'
);
select is(
  pg_temp.try_reserve_derivative(
    'ea400000-0000-4000-8000-000000000006',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000011',
    'ea200000-0000-4000-8000-000000000001',
    'thumbnail', 1
  ),
  '23505',
  'duplicate parent-kind-version is rejected'
);

select is(
  pg_temp.try_reserve_original(
    'ea400000-0000-4000-8000-000000000007',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000003',
    'ea100000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000003',
    'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
  ),
  '00000',
  'pending parent candidate can be reserved for adversarial review'
);
select is(
  pg_temp.try_reserve_derivative(
    'ea400000-0000-4000-8000-000000000008',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000012',
    'ea200000-0000-4000-8000-000000000003',
    'preview', 1
  ),
  '23505',
  'pending original cannot parent a derivative'
);
select is(
  pg_temp.try_reserve_derivative(
    'ea400000-0000-4000-8000-000000000009',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000013',
    'ea200000-0000-4000-8000-000000000010',
    'preview', 1
  ),
  '23505',
  'derivative cannot parent another derivative'
);
select is(
  pg_temp.try_reserve_derivative(
    'ea400000-0000-4000-8000-000000000010',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000014',
    'eb200000-0000-4000-8000-000000000001',
    'preview', 1
  ),
  '42501',
  'known foreign-project parent remains non-disclosing'
);

select is(
  pg_temp.try_reserve_original(
    'ea400000-0000-4000-8000-000000000011',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000004',
    'ea100000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000004',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc'
  ),
  '00000',
  'writer reserves pending object before live role downgrade'
);

reset role;
update public.project_members
set role_key = 'viewer'
where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'ea111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  pg_temp.try_reserve_original(
    'ea400000-0000-4000-8000-000000000012',
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'ea200000-0000-4000-8000-000000000005',
    'ea100000-0000-4000-8000-000000000001',
    'ea300000-0000-4000-8000-000000000005',
    'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  ),
  '42501',
  'same authenticated session loses lifecycle write after live role downgrade'
);
select ok(
  not pg_temp.try_storage_insert(
    'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/ea200000-0000-4000-8000-000000000004/original'
  ),
  'same authenticated session loses pending Storage INSERT after live role downgrade'
);

reset role;
update public.project_members
set membership_status = 'revoked',
    revoked_at = now()
where project_id = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  and user_id = 'ea111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ea111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);
select is(
  (
    select count(*)::integer
    from public.media
    where sha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
  ),
  0,
  'revoked membership immediately loses private media metadata reads'
);
select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'project-private'
      and name = 'eaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/ea200000-0000-4000-8000-000000000001/original'
  ),
  0,
  'revoked membership immediately loses ready private Storage reads'
);

reset role;
select * from finish();
rollback;
