-- WP-2.8B / MED-006 remediation.
-- Preserve the accepted lifecycle implementation and wrap only original finalization
-- so same-project exact-byte duplicate IDs become part of the durable replay receipt.

alter function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) rename to venue_private_media_manage_core;

revoke all on function public.venue_private_media_manage_core(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) from public, anon, authenticated;

create function public.manage_venue_private_media(
  target_action text,
  target_operation_id uuid,
  target_project_id uuid,
  target_media_id uuid,
  target_venue_id uuid default null,
  target_link_id uuid default null,
  target_category text default null,
  target_caption text default null,
  target_original_filename text default null,
  target_mime_type text default null,
  target_size_bytes bigint default null,
  target_sha256 text default null,
  target_width_px integer default null,
  target_height_px integer default null,
  target_derivative_of_id uuid default null,
  target_derivative_kind text default null,
  target_derivative_version integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  receipt jsonb;
  target_original_sha256 text;
  duplicate_original_media_ids jsonb;
begin
  receipt := public.venue_private_media_manage_core(
    target_action,
    target_operation_id,
    target_project_id,
    target_media_id,
    target_venue_id,
    target_link_id,
    target_category,
    target_caption,
    target_original_filename,
    target_mime_type,
    target_size_bytes,
    target_sha256,
    target_width_px,
    target_height_px,
    target_derivative_of_id,
    target_derivative_kind,
    target_derivative_version
  );

  if target_action <> 'finalize_original' then
    return receipt;
  end if;

  -- Replays after the first enriched finalization must return the exact stored
  -- duplicate snapshot rather than recomputing against newer project state.
  if receipt ? 'duplicateOriginalMediaIds' then
    return receipt;
  end if;

  select m.sha256 into target_original_sha256
  from public.media m
  where m.project_id = target_project_id
    and m.id = target_media_id
    and m.remote_url is null
    and m.storage_path is not null
    and m.is_original
    and m.derivative_of_id is null
    and m.upload_status = 'ready';

  if not found or target_original_sha256 is null then
    raise exception 'venue private media unavailable' using errcode = '55000';
  end if;

  select coalesce(
    jsonb_agg(candidate.id::text order by candidate.id),
    '[]'::jsonb
  ) into duplicate_original_media_ids
  from public.media candidate
  where candidate.project_id = target_project_id
    and candidate.id <> target_media_id
    and candidate.remote_url is null
    and candidate.storage_path is not null
    and candidate.is_original
    and candidate.derivative_of_id is null
    and candidate.upload_status = 'ready'
    and candidate.sha256 = target_original_sha256;

  receipt := receipt || jsonb_build_object(
    'duplicateOriginalMediaIds', duplicate_original_media_ids
  );

  update public.activity_log al
  set metadata_json = jsonb_set(
    al.metadata_json,
    '{receipt}',
    receipt,
    true
  )
  where al.project_id = target_project_id
    and al.event_type = 'venue_private_media_finalize_original'
    and al.operation_id = target_operation_id
    and al.entity_id = target_media_id;

  if not found then
    raise exception 'venue private media unavailable' using errcode = '55000';
  end if;

  return receipt;
end;
$$;

revoke all on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) from public, anon;

grant execute on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) to authenticated;

comment on function public.venue_private_media_manage_core(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) is
  'WP-2.8B internal lifecycle core retained behind the MED-006 finalization receipt wrapper; direct client execution is revoked.';

comment on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) is
  'WP-2.8B protected private Venue media lifecycle. finalize_original returns a durable project-scoped detect-only duplicateOriginalMediaIds snapshot for MED-006.';
