alter function public.link_venue_fact_observation_source(
  uuid, uuid, uuid, boolean
) rename to link_venue_fact_observation_source_primary_core;

revoke all on function public.link_venue_fact_observation_source_primary_core(
  uuid, uuid, uuid, boolean
) from public, anon, authenticated;

create or replace function public.link_venue_fact_observation_source(
  target_project_id uuid,
  target_observation_id uuid,
  target_source_id uuid,
  target_is_primary boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if target_is_primary is null then
    raise exception 'venue fact evidence link unavailable' using errcode = '22023';
  end if;

  return public.link_venue_fact_observation_source_primary_core(
    target_project_id,
    target_observation_id,
    target_source_id,
    target_is_primary
  );
end;
$$;

revoke all on function public.link_venue_fact_observation_source(
  uuid, uuid, uuid, boolean
) from public, anon;
grant execute on function public.link_venue_fact_observation_source(
  uuid, uuid, uuid, boolean
) to authenticated;