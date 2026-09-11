-- WP-2.8C: recoverable soft-delete/restore for accepted A-style Venue
-- remote-media metadata. Private Storage-backed media remains outside this command.

alter table public.media
  add column deleted_at timestamptz null;

create index media_project_active_remote_idx
  on public.media (project_id, created_at desc, id asc)
  where remote_url is not null
    and storage_path is null
    and upload_status = 'ready'
    and deleted_at is null;

create or replace function public.transition_venue_remote_media_lifecycle(
  target_project_id uuid,
  target_media_id uuid,
  target_action text,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_media public.media%rowtype;
  saved_media public.media%rowtype;
  saved_link public.media_links%rowtype;
  same_state boolean;
  transition_time timestamptz;
begin
  perform public.venue_remote_media_assert_writer(target_project_id);

  if target_media_id is null
    or target_action is null
    or target_action not in ('soft_delete', 'restore')
    or target_expected_revision is null
    or target_expected_revision < 1 then
    raise exception 'venue remote media lifecycle unavailable'
      using errcode = '22023';
  end if;

  select m.* into current_media
  from public.media m
  where m.id = target_media_id
  for update;

  if not found or current_media.project_id <> target_project_id then
    raise exception 'venue remote media lifecycle unavailable'
      using errcode = '42501';
  end if;

  -- Re-check live writer authorization after the target row lock. This keeps a
  -- permission downgrade/revocation from becoming a stale capability grant.
  perform public.venue_remote_media_assert_writer(target_project_id);

  if current_media.media_type <> 'image'
    or current_media.storage_path is not null
    or current_media.remote_url is null
    or current_media.original_filename is not null
    or current_media.mime_type is not null
    or current_media.size_bytes is not null
    or current_media.sha256 is not null
    or current_media.width_px is not null
    or current_media.height_px is not null
    or current_media.derivative_of_id is not null
    or current_media.derivative_kind is not null
    or current_media.derivative_version is not null
    or not current_media.is_original
    or current_media.upload_status <> 'ready' then
    raise exception 'venue remote media lifecycle conflict'
      using errcode = '23505';
  end if;

  select ml.* into saved_link
  from public.media_links ml
  where ml.project_id = target_project_id
    and ml.media_id = target_media_id
    and ml.target_type = 'venue'
    and ml.relationship_type = 'gallery'
  order by ml.id
  limit 1;

  if not found then
    raise exception 'venue remote media lifecycle conflict'
      using errcode = '23505';
  end if;

  same_state :=
    (target_action = 'soft_delete' and current_media.deleted_at is not null)
    or (target_action = 'restore' and current_media.deleted_at is null);

  if same_state then
    return jsonb_build_object(
      'action', target_action,
      'replayed', true,
      'media', to_jsonb(current_media),
      'link', to_jsonb(saved_link)
    );
  end if;

  if current_media.revision <> target_expected_revision then
    raise exception 'stale venue remote media'
      using errcode = '40001';
  end if;

  transition_time := now();

  update public.media
  set deleted_at = case
        when target_action = 'soft_delete' then transition_time
        else null
      end,
      updated_at = transition_time,
      updated_by = auth.uid(),
      revision = revision + 1
  where project_id = target_project_id
    and id = target_media_id
  returning * into saved_media;

  return jsonb_build_object(
    'action', target_action,
    'replayed', false,
    'media', to_jsonb(saved_media),
    'link', to_jsonb(saved_link)
  );
end;
$$;

revoke all on function public.transition_venue_remote_media_lifecycle(
  uuid, uuid, text, bigint
) from public, anon, authenticated;

grant execute on function public.transition_venue_remote_media_lifecycle(
  uuid, uuid, text, bigint
) to authenticated;

comment on column public.media.deleted_at is
  'WP-2.8C recoverable metadata lifecycle marker: null is active; non-null is soft-deleted. Private binary deletion is out of scope.';

comment on function public.transition_venue_remote_media_lifecycle(
  uuid, uuid, text, bigint
) is
  'WP-2.8C protected A-style remote Venue media soft-delete/restore command with live media.write authorization, same-state replay and optimistic revision control.';
