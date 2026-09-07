create or replace function public.validate_fact_definition_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.entity_type <> 'venue'
    or new.label <> btrim(new.label)
    or (new.unit is not null and new.unit <> btrim(new.unit))
    or (
      new.freshness_policy is not null
      and new.freshness_policy <> btrim(new.freshness_policy)
    )
    or not public.fact_options_valid(new.value_type, new.unit, new.options_json)
    or not public.fact_evaluation_rule_valid(
      new.value_type,
      new.options_json,
      new.evaluation_rule_json
    ) then
    raise exception 'fact definition unavailable' using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id is distinct from old.project_id
      or new.entity_type is distinct from old.entity_type
      or new.key is distinct from old.key
      or new.value_type is distinct from old.value_type
      or new.unit is distinct from old.unit
      or new.system_defined is distinct from old.system_defined then
      raise exception 'fact definition immutable semantics' using errcode = '23514';
    end if;

    if old.system_defined and (
      new.options_json is distinct from old.options_json
      or new.evaluation_rule_json is distinct from old.evaluation_rule_json
    ) then
      raise exception 'system fact definition semantics are protected'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.facts f
      where f.project_id = old.project_id
        and f.definition_id = old.id
        and f.retained_value is not null
        and not public.fact_value_valid(
          new.value_type,
          new.options_json,
          f.retained_value
        )
    ) then
      raise exception 'fact definition invalidates retained truth'
        using errcode = '23514';
    end if;

    if exists (
      select 1
      from public.fact_observations observation_row
      join public.facts f
        on f.project_id = observation_row.project_id
        and f.id = observation_row.fact_id
      where f.project_id = old.project_id
        and f.definition_id = old.id
        and observation_row.value is not null
        and not public.fact_value_valid(
          new.value_type,
          new.options_json,
          observation_row.value
        )
    ) then
      raise exception 'fact definition invalidates observation history'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_fact_definition_row()
from public, anon, authenticated;

alter function public.set_retained_venue_fact(
  uuid, uuid, uuid, bigint, text, jsonb
) rename to set_retained_venue_fact_core;

revoke all on function public.set_retained_venue_fact_core(
  uuid, uuid, uuid, bigint, text, jsonb
) from public, anon, authenticated;

create or replace function public.set_retained_venue_fact(
  target_project_id uuid,
  target_venue_id uuid,
  target_definition_id uuid,
  target_expected_revision bigint,
  target_state text,
  target_retained_value jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_fact_id uuid;
begin
  if auth.uid() is null then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  select f.id
  into current_fact_id
  from public.facts f
  where f.project_id = target_project_id
    and f.target_type = 'venue'
    and f.target_id = target_venue_id
    and f.definition_id = target_definition_id
  for update;

  if found
    and target_state = 'known'
    and exists (
      select 1
      from public.fact_observations observation_row
      where observation_row.project_id = target_project_id
        and observation_row.fact_id = current_fact_id
    ) then
    raise exception 'retained venue fact requires observation resolution'
      using errcode = '23514';
  end if;

  return public.set_retained_venue_fact_core(
    target_project_id,
    target_venue_id,
    target_definition_id,
    target_expected_revision,
    target_state,
    target_retained_value
  );
end;
$$;

revoke all on function public.set_retained_venue_fact(
  uuid, uuid, uuid, bigint, text, jsonb
) from public, anon;
grant execute on function public.set_retained_venue_fact(
  uuid, uuid, uuid, bigint, text, jsonb
) to authenticated;
