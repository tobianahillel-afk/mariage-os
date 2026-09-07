create or replace function public.set_venue_fact_freshness(
  target_project_id uuid,
  target_fact_id uuid,
  target_expected_revision bigint,
  target_last_verified_at timestamptz,
  target_stale_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.facts%rowtype;
  saved_row public.facts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue fact freshness unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact freshness unavailable' using errcode = '42501';
  end if;

  select * into current_row from public.facts f
  where f.project_id = target_project_id
    and f.id = target_fact_id
    and f.target_type = 'venue'
  for update;

  if not found then
    raise exception 'venue fact freshness unavailable' using errcode = '42501';
  end if;

  if target_expected_revision is null
    or target_expected_revision < 1
    or current_row.revision <> target_expected_revision then
    raise exception 'stale retained venue fact' using errcode = '40001';
  end if;

  if target_stale_at is not null
    and (
      target_last_verified_at is null
      or target_stale_at < target_last_verified_at
    ) then
    raise exception 'venue fact freshness unavailable' using errcode = '22023';
  end if;

  update public.facts
  set last_verified_at = target_last_verified_at,
      stale_at = target_stale_at
  where project_id = target_project_id
    and id = target_fact_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.set_venue_fact_freshness(
  uuid, uuid, bigint, timestamptz, timestamptz
) from public, anon;
grant execute on function public.set_venue_fact_freshness(
  uuid, uuid, bigint, timestamptz, timestamptz
) to authenticated;
