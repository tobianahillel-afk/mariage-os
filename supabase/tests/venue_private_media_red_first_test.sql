-- WP-2.8B red-first proof: accepted remote media must remain valid while
-- private Venue originals become representable as pending reservations.
begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  'e8111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'wp28b-red@example.invalid',
  '',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now()
);

insert into public.projects (id, name, created_by, updated_by)
values (
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'WP-2.8B RED project',
  'e8111111-1111-4111-8111-111111111111',
  'e8111111-1111-4111-8111-111111111111'
);

select lives_ok(
  $$
    insert into public.media (
      id,
      project_id,
      media_type,
      category,
      storage_path,
      remote_url,
      source_page_url,
      original_filename,
      mime_type,
      size_bytes,
      sha256,
      width_px,
      height_px,
      derivative_of_id,
      is_original,
      upload_status,
      caption,
      created_by,
      updated_by
    ) values (
      'e8200000-0000-4000-8000-000000000001',
      'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'image',
      'exterior',
      null,
      'https://example.com/venue.jpg',
      'https://example.com/venue',
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      true,
      'ready',
      'Accepted A remote reference',
      'e8111111-1111-4111-8111-111111111111',
      'e8111111-1111-4111-8111-111111111111'
    )
  $$,
  'WP-2.8A remote reference shape remains accepted'
);

select lives_ok(
  $$
    insert into public.media (
      id,
      project_id,
      media_type,
      category,
      storage_path,
      remote_url,
      source_page_url,
      original_filename,
      mime_type,
      size_bytes,
      sha256,
      width_px,
      height_px,
      derivative_of_id,
      is_original,
      upload_status,
      caption,
      created_by,
      updated_by
    ) values (
      'e8200000-0000-4000-8000-000000000002',
      'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'image',
      'own_visit',
      'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/e8200000-0000-4000-8000-000000000002/original',
      null,
      null,
      'Venue Visit.JPG',
      'image/jpeg',
      1024,
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      32,
      32,
      null,
      true,
      'pending',
      null,
      'e8111111-1111-4111-8111-111111111111',
      'e8111111-1111-4111-8111-111111111111'
    )
  $$,
  'WP-2.8B private original pending reservation shape is representable'
);

select is(
  (
    select storage_path
    from public.media
    where id = 'e8200000-0000-4000-8000-000000000002'
  ),
  'e8aaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/media/e8200000-0000-4000-8000-000000000002/original',
  'WP-2.8B private original reservation keeps the frozen opaque storage path'
);

select * from finish();
rollback;
