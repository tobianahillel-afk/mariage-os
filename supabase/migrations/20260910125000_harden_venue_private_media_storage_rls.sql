-- WP-2.8B: bind private Storage access to the exact server-reserved media row.
-- The accepted WP-1.9 namespace-only policies were a foundation; private Venue
-- media now has a concrete pending/ready lifecycle and may no longer authorize
-- writes, reads or deletes from path knowledge alone.

drop policy if exists project_private_media_select on storage.objects;
drop policy if exists project_private_media_insert on storage.objects;
drop policy if exists project_private_media_update on storage.objects;
drop policy if exists project_private_media_delete on storage.objects;

create policy project_private_media_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-private'
  and exists (
    select 1
    from public.media reserved_media
    where reserved_media.project_id = substring(
      storage.objects.name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid
      and reserved_media.storage_path = storage.objects.name
      and reserved_media.remote_url is null
      and (
        (
          reserved_media.upload_status = 'ready'
          and public.has_project_permission(
            reserved_media.project_id,
            'media.read'
          )
        )
        or (
          reserved_media.upload_status = 'pending'
          and public.has_project_permission(
            reserved_media.project_id,
            'media.write'
          )
        )
      )
  )
);

create policy project_private_media_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-private'
  and exists (
    select 1
    from public.media reserved_media
    where reserved_media.project_id = substring(
      storage.objects.name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid
      and reserved_media.storage_path = storage.objects.name
      and reserved_media.remote_url is null
      and reserved_media.upload_status = 'pending'
      and public.has_project_permission(
        reserved_media.project_id,
        'media.write'
      )
  )
);

-- Deliberately no UPDATE policy. A Storage object is immutable at its reserved
-- path in WP-2.8B; replacement/upsert and rename must fail closed.

create policy project_private_media_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-private'
  and exists (
    select 1
    from public.media reserved_media
    where reserved_media.project_id = substring(
      storage.objects.name
      from '^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/media/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[A-Za-z0-9][A-Za-z0-9._-]{0,63}$'
    )::uuid
      and reserved_media.storage_path = storage.objects.name
      and reserved_media.remote_url is null
      and reserved_media.upload_status = 'pending'
      and public.has_project_permission(
        reserved_media.project_id,
        'media.write'
      )
  )
);

comment on policy project_private_media_select on storage.objects is
  'WP-2.8B: ready private objects require media.read; pending objects require media.write; exact storage_path reservation is mandatory.';
comment on policy project_private_media_insert on storage.objects is
  'WP-2.8B: upload is allowed only at the exact same-project pending media reservation path with live media.write.';
comment on policy project_private_media_delete on storage.objects is
  'WP-2.8B: cleanup may delete only the exact pending media reservation object with live media.write; ready binaries are terminal.';
