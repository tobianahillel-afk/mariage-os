-- WP-2.8B: broaden the accepted WP-2.8A media model without weakening
-- the remote-reference contract. Private rows are either pending recovery
-- reservations or finalized immutable media metadata.

alter table public.media
  alter column remote_url drop not null;

alter table public.media
  add column derivative_kind text null,
  add column derivative_version integer null;

alter table public.media
  drop constraint media_upload_status_check,
  drop constraint media_wp28a_remote_reference_state;

alter table public.media
  add constraint media_upload_status_check check (
    upload_status in ('pending', 'ready')
  ),
  add constraint media_derivative_identity_check check (
    (derivative_of_id is null and derivative_kind is null and derivative_version is null)
    or (
      derivative_of_id is not null
      and derivative_kind in ('thumbnail', 'preview')
      and derivative_version between 1 and 32767
      and derivative_of_id <> id
    )
  ),
  add constraint media_wp28ab_storage_mode_check check (
    (
      remote_url is not null
      and storage_path is null
      and original_filename is null
      and mime_type is null
      and size_bytes is null
      and sha256 is null
      and width_px is null
      and height_px is null
      and derivative_of_id is null
      and derivative_kind is null
      and derivative_version is null
      and is_original
      and upload_status = 'ready'
    )
    or (
      remote_url is null
      and source_page_url is null
      and storage_path is not null
      and mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and size_bytes between 1 and 20000000
      and sha256 ~ '^[0-9a-f]{64}$'
      and width_px between 1 and 16384
      and height_px between 1 and 16384
      and width_px::bigint * height_px::bigint <= 50000000
      and upload_status in ('pending', 'ready')
      and (
        (
          is_original
          and derivative_of_id is null
          and derivative_kind is null
          and derivative_version is null
          and original_filename is not null
          and char_length(original_filename) between 1 and 512
          and original_filename !~ '[[:cntrl:]]'
          and storage_path = (
            project_id::text || '/media/' || id::text || '/original'
          )
        )
        or (
          not is_original
          and derivative_of_id is not null
          and derivative_kind in ('thumbnail', 'preview')
          and derivative_version between 1 and 32767
          and original_filename is null
          and category is null
          and caption is null
          and storage_path = (
            project_id::text || '/media/' || id::text || '/'
            || derivative_kind || '-v' || derivative_version::text
          )
        )
      )
    )
  );

create unique index media_derivative_version_unique_idx
  on public.media (
    project_id,
    derivative_of_id,
    derivative_kind,
    derivative_version
  )
  where derivative_of_id is not null;

create index media_private_original_hash_idx
  on public.media (project_id, sha256, id)
  where remote_url is null
    and is_original
    and upload_status = 'ready';

create or replace function public.assert_media_derivative_parent()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  if new.derivative_of_id is null then
    return new;
  end if;

  perform 1
  from public.media parent
  where parent.project_id = new.project_id
    and parent.id = new.derivative_of_id
    and parent.remote_url is null
    and parent.storage_path is not null
    and parent.is_original
    and parent.derivative_of_id is null
    and parent.upload_status = 'ready';

  if not found then
    raise exception 'media derivative parent unavailable' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.assert_media_derivative_parent()
from public, anon, authenticated;

create trigger media_assert_derivative_parent
before insert or update of project_id, derivative_of_id, derivative_kind, derivative_version
on public.media
for each row
execute function public.assert_media_derivative_parent();

drop policy media_select_authorized on public.media;
create policy media_select_authorized
on public.media for select to authenticated
using (
  (
    upload_status = 'ready'
    and public.has_project_permission(project_id, 'media.read')
  )
  or (
    remote_url is null
    and upload_status = 'pending'
    and public.has_project_permission(project_id, 'media.write')
  )
);

drop policy media_links_select_authorized on public.media_links;
create policy media_links_select_authorized
on public.media_links for select to authenticated
using (
  exists (
    select 1
    from public.media linked_media
    where linked_media.project_id = media_links.project_id
      and linked_media.id = media_links.media_id
      and (
        (
          linked_media.upload_status = 'ready'
          and public.has_project_permission(media_links.project_id, 'media.read')
        )
        or (
          linked_media.remote_url is null
          and linked_media.upload_status = 'pending'
          and public.has_project_permission(media_links.project_id, 'media.write')
        )
      )
  )
);

comment on constraint media_wp28ab_storage_mode_check on public.media is
  'WP-2.8A/B: remote references and private Storage rows are mutually exclusive; private originals/derivatives use frozen opaque paths and validated metadata bounds.';
comment on policy media_select_authorized on public.media is
  'WP-2.8B: ready media requires media.read; private pending recovery metadata requires media.write and is not ordinary committed media.';
comment on policy media_links_select_authorized on public.media_links is
  'WP-2.8B: links to pending private media are writer-recovery data, not viewer-visible committed gallery truth.';
