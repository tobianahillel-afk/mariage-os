alter table public.venue_access_routes
  add constraint venue_access_routes_origin_label_160_check
  check (origin_label is null or char_length(origin_label) <= 160),
  add constraint venue_access_routes_destination_label_160_check
  check (destination_label is null or char_length(destination_label) <= 160);

alter function public.append_venue_access_route(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) rename to append_venue_access_route_text_bound_core;

revoke all on function public.append_venue_access_route_text_bound_core(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) from public, anon, authenticated;

create or replace function public.append_venue_access_route(
  target_project_id uuid,
  target_venue_id uuid,
  target_route_id uuid,
  target_reference_origin_id uuid,
  target_route_type text,
  target_origin_label text,
  target_destination_label text,
  target_mode text,
  target_duration_minutes integer,
  target_distance_meters integer,
  target_transfers_count integer,
  target_observed_at text,
  target_source_id uuid,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_origin_label text := nullif(
    public.fact_ecmascript_trim(target_origin_label),
    ''
  );
  normalized_destination_label text := nullif(
    public.fact_ecmascript_trim(target_destination_label),
    ''
  );
begin
  if (
      target_reference_origin_id is null
      and normalized_origin_label is not null
      and char_length(normalized_origin_label) > 160
    )
    or (
      normalized_destination_label is not null
      and char_length(normalized_destination_label) > 160
    ) then
    raise exception 'venue access route unavailable' using errcode = '22023';
  end if;

  return public.append_venue_access_route_text_bound_core(
    target_project_id,
    target_venue_id,
    target_route_id,
    target_reference_origin_id,
    target_route_type,
    target_origin_label,
    target_destination_label,
    target_mode,
    target_duration_minutes,
    target_distance_meters,
    target_transfers_count,
    target_observed_at,
    target_source_id,
    target_notes
  );
end;
$$;

revoke all on function public.append_venue_access_route(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) from public, anon;

grant execute on function public.append_venue_access_route(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) to authenticated;
