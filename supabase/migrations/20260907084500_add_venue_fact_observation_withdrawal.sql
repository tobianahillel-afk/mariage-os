create or replace function public.withdraw_venue_fact_observation(
  target_project_id uuid,
  target_fact_id uuid,
  target_observation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.fact_observations%rowtype;
  saved_row public.fact_observations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.facts f
    where f.project_id = target_project_id
      and f.id = target_fact_id
      and f.target_type = 'venue'
  ) then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  select * into current_row from public.fact_observations observation_row
  where observation_row.project_id = target_project_id
    and observation_row.fact_id = target_fact_id
    and observation_row.id = target_observation_id
  for update;

  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;
  if current_row.observation_status <> 'active' then
    raise exception 'stale venue fact observation' using errcode = '40001';
  end if;

  update public.fact_observations
  set observation_status = 'withdrawn',
      superseded_by_observation_id = null
  where project_id = target_project_id
    and fact_id = target_fact_id
    and id = target_observation_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.withdraw_venue_fact_observation(uuid, uuid, uuid)
from public, anon;
grant execute on function public.withdraw_venue_fact_observation(uuid, uuid, uuid)
to authenticated;
