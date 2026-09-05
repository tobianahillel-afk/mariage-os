insert into storage.buckets (id, name, public)
values ('project-private', 'project-private', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

create policy project_private_media_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-private'
  and public.has_project_permission(
    substring(
      name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid,
    'media.read'
  )
);

create policy project_private_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-private'
  and public.has_project_permission(
    substring(
      name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid,
    'media.write'
  )
);

create policy project_private_media_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'project-private'
  and public.has_project_permission(
    substring(
      name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid,
    'media.write'
  )
)
with check (
  bucket_id = 'project-private'
  and public.has_project_permission(
    substring(
      name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid,
    'media.write'
  )
);

create policy project_private_media_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-private'
  and public.has_project_permission(
    substring(
      name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid,
    'media.write'
  )
);

comment on policy project_private_media_select on storage.objects is
  'WP-1.9 foundation: private project media reads require a valid project-namespaced path and live media.read permission.';
comment on policy project_private_media_insert on storage.objects is
  'WP-1.9 foundation: private project media inserts require a valid project-namespaced path and live media.write permission.';
comment on policy project_private_media_update on storage.objects is
  'WP-1.9 foundation: private project media updates cannot move an object into or out of an unauthorized project namespace.';
comment on policy project_private_media_delete on storage.objects is
  'WP-1.9 foundation: private project media deletes require live media.write permission.';
