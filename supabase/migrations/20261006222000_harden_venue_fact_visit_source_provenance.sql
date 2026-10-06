create or replace function public.link_venue_fact_observation_source_checked(
  target_project_id uuid,
  target_observation_id uuid,
  target_source_id uuid,
  target_is_primary boolean,
  target_expected_source_type text,
  target_expected_source_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  source_row public.sources%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  if target_is_primary is null
    or target_expected_source_type is null
    or target_expected_source_type <> 'in_person_visit'
    or target_expected_source_revision is null
    or target_expected_source_revision < 1 then
    raise exception 'venue fact evidence link unavailable' using errcode = '22023';
  end if;

  select *
  into source_row
  from public.sources s
  where s.project_id = target_project_id
    and s.id = target_source_id
  for update;

  if not found then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  if source_row.source_type <> target_expected_source_type
    or source_row.revision <> target_expected_source_revision then
    raise exception 'stale venue fact evidence source provenance'
      using errcode = '40001';
  end if;

  return public.link_venue_fact_observation_source(
    target_project_id,
    target_observation_id,
    target_source_id,
    target_is_primary
  );
end;
$$;

revoke all on function public.link_venue_fact_observation_source_checked(
  uuid, uuid, uuid, boolean, text, bigint
) from public, anon;

grant execute on function public.link_venue_fact_observation_source_checked(
  uuid, uuid, uuid, boolean, text, bigint
) to authenticated;
