-- WP-2.8B: fail closed on NULL/unknown lifecycle actions at the public RPC boundary.
-- Keep the previously verified implementation behind a revoked internal entrypoint.

alter function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) rename to venue_private_media_manage_impl;

revoke all on function public.venue_private_media_manage_impl(
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
begin
  if target_action is null
    or target_action not in (
      'reserve_original',
      'finalize_original',
      'abandon_original',
      'reserve_derivative',
      'finalize_derivative',
      'abandon_derivative'
    ) then
    raise exception 'venue private media unavailable' using errcode = '22023';
  end if;

  return public.venue_private_media_manage_impl(
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

comment on function public.manage_venue_private_media(
  text, uuid, uuid, uuid, uuid, uuid, text, text, text, text,
  bigint, text, integer, integer, uuid, text, integer
) is
  'WP-2.8B public lifecycle boundary: explicit six-action allowlist before delegation to the revoked private media implementation.';
