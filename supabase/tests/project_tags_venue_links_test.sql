begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'tags', 'project tag dictionary exists');
select has_table('public', 'entity_tags', 'generic tag link table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.tags'::regclass)
  and (select relrowsecurity from pg_class where oid = 'public.entity_tags'::regclass),
  'both project tag tables have RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.tags', 'select')
  and has_column_privilege('authenticated', 'public.tags', 'label', 'insert')
  and has_column_privilege('authenticated', 'public.tags', 'label', 'update')
  and not has_table_privilege('authenticated', 'public.tags', 'delete')
  and has_table_privilege('authenticated', 'public.entity_tags', 'select')
  and has_column_privilege('authenticated', 'public.entity_tags', 'tag_id', 'insert')
  and has_table_privilege('authenticated', 'public.entity_tags', 'delete')
  and not has_table_privilege('authenticated', 'public.entity_tags', 'update'),
  'grants permit tag soft deletion and assignment unlink, but no protected hard delete or link rewrite'
);
select ok(
  not has_column_privilege('authenticated', 'public.tags', 'created_by', 'insert')
  and not has_column_privilege('authenticated', 'public.tags', 'project_id', 'update')
  and not has_column_privilege('authenticated', 'public.tags', 'key', 'update')
  and not has_column_privilege('authenticated', 'public.tags', 'revision', 'update')
  and not has_column_privilege('authenticated', 'public.entity_tags', 'created_by', 'insert')
  and not has_table_privilege('anon', 'public.tags', 'select')
  and not has_table_privilege('anon', 'public.entity_tags', 'select'),
  'protected identity and audit columns and anonymous access are denied by grants'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', 'a1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'tag-owner-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'tag-editor-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'tag-viewer-a@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a4444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'tag-owner-b@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a5555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'tag-outsider@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a6666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'tag-revoked@example.invalid', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.projects (id, name, created_by, updated_by)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tag Project A', 'a1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tag Project B', 'a4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444');

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a1111111-1111-4111-8111-111111111111', 'owner', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a2222222-2222-4222-8222-222222222222', 'editor', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a3333333-3333-4333-8333-333333333333', 'viewer', 'active', now(), null),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'a4444444-4444-4444-8444-444444444444', 'owner', 'active', now(), null),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a6666666-6666-4666-8666-666666666666', 'editor', 'revoked', now(), now());

insert into public.venues (id, project_id, name, status, created_by, updated_by)
values
  ('aa100000-0000-4000-8000-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tag Venue A', 'research', 'a1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111'),
  ('aa100000-0000-4000-8000-000000000002', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Tag Venue A2', 'research', 'a1111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111'),
  ('bb100000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Tag Venue B', 'research', 'a4444444-4444-4444-8444-444444444444', 'a4444444-4444-4444-8444-444444444444');

create function pg_temp.tag_create_state(
  target_project uuid, target_id uuid, target_key text, target_label text
)
returns text language plpgsql as $$
begin
  insert into public.tags (id, project_id, key, label)
  values (target_id, target_project, target_key, target_label);
  return '00000';
exception when others then return sqlstate;
end;
$$;

create function pg_temp.tag_link_state(
  target_project uuid, target_id uuid, target_tag uuid,
  target_type text, target_entity uuid
)
returns text language plpgsql as $$
begin
  insert into public.entity_tags (id, project_id, tag_id, target_type, target_id)
  values (target_id, target_project, target_tag, target_type, target_entity);
  return '00000';
exception when others then return sqlstate;
end;
$$;

create function pg_temp.tag_restore_state(target_id uuid)
returns text language plpgsql as $$
begin
  update public.tags set deleted_at = null where id = target_id;
  return '00000';
exception when others then return sqlstate;
end;
$$;

create function pg_temp.tag_unlink_state(target_id uuid)
returns text language plpgsql as $$
declare affected integer;
begin
  delete from public.entity_tags where id = target_id;
  get diagnostics affected = row_count;
  return case when affected = 1 then '00000' else '02000' end;
exception when others then return sqlstate;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.tags$$, '42501', 'permission denied for table tags',
  'anonymous cannot query tag definitions'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000001', 'garden', 'Jardin 🌿'),
  '00000', 'owner can create a canonical project tag'
);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'Garden', 'Bad key'),
  '23514', 'mixed-case key is rejected by the database'
);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'garden', 'Duplicate'),
  '23505', 'active duplicate key conflicts without merge'
);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'bad-label', E'unsafe\nlabel'),
  '23514', 'unsafe label control is rejected by the database'
);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'bad-label', repeat('é', 81)),
  '23514', '81 Unicode scalars exceed the label bound'
);
select is(
  (select created_by::text from public.tags where key = 'garden'),
  'a1111111-1111-4111-8111-111111111111',
  'tag creation identity comes from live authentication'
);

select set_config('request.jwt.claims', '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'editor-key', 'Editor'),
  '42501', 'editor cannot change the project taxonomy'
);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000001', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '00000', 'editor can link an existing active project tag to a Venue'
);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'bb100000-0000-4000-8000-000000000001'),
  '23503', 'composite Venue FK rejects a cross-project target'
);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'vendor', 'aa100000-0000-4000-8000-000000000001'),
  '23514', 'non-Venue target type is rejected'
);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '23505', 'duplicate assignment conflicts without identity merge'
);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000002'),
  '00000', 'same active tag can link a second same-project Venue'
);
select is(
  pg_temp.tag_unlink_state('aa300000-0000-4000-8000-000000000002'),
  '00000', 'editor may unlink an active Venue tag'
);

select set_config('request.jwt.claims', '{"sub":"a3333333-3333-4333-8333-333333333333","role":"authenticated"}', true);
select is((select count(*)::integer from public.tags), 1, 'viewer reads active tag definitions');
select is((select count(*)::integer from public.entity_tags), 1, 'viewer reads active Venue assignment');
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '42501', 'viewer cannot mutate Venue assignments'
);

select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
update public.tags set label = 'Jardin vert' where key = 'garden';
select is((select label from public.tags where key = 'garden'), 'Jardin vert', 'owner can rename label without changing key');
update public.tags set deleted_at = now() where key = 'garden';
select is((select count(*)::integer from public.entity_tags), 0, 'deleted tag hides retained assignment from active queries');
select is((select count(*)::integer from public.tags where deleted_at is not null), 1, 'owner can find deleted tag for restore');

select set_config('request.jwt.claims', '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
select is((select count(*)::integer from public.tags), 0, 'editor cannot see deleted dictionary entry as active');
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '23514', 'linking a deleted tag fails at the database boundary'
);

select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000002', 'garden', 'Replacement'),
  '00000', 'soft deletion releases active key for a distinct replacement identity'
);
select is(
  pg_temp.tag_restore_state('aa200000-0000-4000-8000-000000000001'),
  '23505', 'restoring with an active-key conflict fails explicitly'
);
update public.tags set deleted_at = now() where id = 'aa200000-0000-4000-8000-000000000002';
select is(
  pg_temp.tag_restore_state('aa200000-0000-4000-8000-000000000001'),
  '00000', 'original tag restores under its unchanged UUID and key'
);
select is((select count(*)::integer from public.entity_tags), 1, 'retained assignment reappears after restore');

select set_config('request.jwt.claims', '{"sub":"a5555555-5555-4555-8555-555555555555","role":"authenticated"}', true);
select is((select count(*)::integer from public.tags), 0, 'outsider cannot read project tags');
select is((select count(*)::integer from public.entity_tags), 0, 'outsider cannot read Venue assignments');
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000003', 'outsider', 'Outsider'),
  '42501', 'outsider cannot create project tag'
);

select set_config('request.jwt.claims', '{"sub":"a6666666-6666-4666-8666-666666666666","role":"authenticated"}', true);
select is((select count(*)::integer from public.tags), 0, 'revoked member cannot read tags');
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000002', 'aa200000-0000-4000-8000-000000000001', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '42501', 'revoked member cannot link a Venue tag'
);

select set_config('request.jwt.claims', '{"sub":"a4444444-4444-4444-8444-444444444444","role":"authenticated"}', true);
select is((select count(*)::integer from public.tags), 0, 'project-B owner cannot read project-A tags');
select is(
  pg_temp.tag_create_state('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bb200000-0000-4000-8000-000000000001', 'garden', 'B garden'),
  '00000', 'same canonical key can exist independently in project B'
);
select is(
  pg_temp.tag_link_state('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'bb300000-0000-4000-8000-000000000001', 'aa200000-0000-4000-8000-000000000001', 'venue', 'bb100000-0000-4000-8000-000000000001'),
  '23514', 'cross-project tag injection fails at active-tag validation'
);

select set_config('request.jwt.claims', '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal2"}', true);
select is(
  pg_temp.tag_create_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa200000-0000-4000-8000-000000000003', 'inside', 'Inside'),
  '00000', 'owner prepares an active tag for post-downgrade authorization'
);
select ok(
  public.change_project_member_role(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'a2222222-2222-4222-8222-222222222222',
    'viewer'
  ),
  'owner downgrades tag editor through protected membership command'
);
select set_config('request.jwt.claims', '{"sub":"a2222222-2222-4222-8222-222222222222","role":"authenticated","aal":"aal1"}', true);
select is(
  pg_temp.tag_link_state('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'aa300000-0000-4000-8000-000000000003', 'aa200000-0000-4000-8000-000000000003', 'venue', 'aa100000-0000-4000-8000-000000000001'),
  '42501', 'same authenticated session loses venues.write after downgrade'
);
select is((select count(*)::integer from public.entity_tags), 1, 'downgraded viewer retains only active assignment read');

select * from finish();
rollback;
