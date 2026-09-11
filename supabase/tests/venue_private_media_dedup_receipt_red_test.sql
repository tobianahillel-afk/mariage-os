begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'da111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'wp28b-dedup@example.invalid', '', now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B dedup receipt project',
  'da111111-1111-4111-8111-111111111111',
  'da111111-1111-4111-8111-111111111111'
);

insert into public.project_members (
  project_id, user_id, role_key, membership_status, accepted_at, revoked_at
)
values (
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da111111-1111-4111-8111-111111111111',
  'owner', 'active', now(), null
);

insert into public.venues (id, project_id, code, name, status, created_by, updated_by)
values (
  'da100000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP28BDEDUP', 'WP-2.8B dedup receipt venue', 'research',
  'da111111-1111-4111-8111-111111111111',
  'da111111-1111-4111-8111-111111111111'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"da111111-1111-4111-8111-111111111111","role":"authenticated","aal":"aal1"}',
  true
);

select public.manage_venue_private_media(
  'reserve_original',
  'da400000-0000-4000-8000-000000000001',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000001',
  'da100000-0000-4000-8000-000000000001',
  'da300000-0000-4000-8000-000000000001',
  'own_visit', null, 'First.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/da200000-0000-4000-8000-000000000001/original'
);
select public.manage_venue_private_media(
  'finalize_original',
  'da400000-0000-4000-8000-000000000002',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000001'
);

select public.manage_venue_private_media(
  'reserve_original',
  'da400000-0000-4000-8000-000000000003',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'da200000-0000-4000-8000-000000000002',
  'da100000-0000-4000-8000-000000000001',
  'da300000-0000-4000-8000-000000000002',
  'own_visit', null, 'Second.jpg', 'image/jpeg', 128,
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  4, 4, null, null, null
);
insert into storage.objects (bucket_id, name)
values (
  'project-private',
  'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/da200000-0000-4000-8000-000000000002/original'
);

select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000004',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000002'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '["da200000-0000-4000-8000-000000000001"]'::jsonb,
  'MED-006 finalization reports same-project equal-SHA original IDs'
);

select is(
  (
    public.manage_venue_private_media(
      'finalize_original',
      'da400000-0000-4000-8000-000000000004',
      'daaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'da200000-0000-4000-8000-000000000002'
    ) -> 'duplicateOriginalMediaIds'
  ),
  '["da200000-0000-4000-8000-000000000001"]'::jsonb,
  'MED-006 finalization replay preserves the same duplicate receipt'
);

reset role;
select * from finish();
rollback;
