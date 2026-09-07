alter table public.fact_definitions
  add constraint fact_definitions_label_ecmascript_canonical_check
  check (
    label = public.fact_ecmascript_trim(label)
    and char_length(label) between 1 and 240
  ),
  add constraint fact_definitions_unit_ecmascript_canonical_check
  check (
    unit is null
    or (
      unit = public.fact_ecmascript_trim(unit)
      and char_length(unit) between 1 and 80
    )
  ),
  add constraint fact_definitions_freshness_ecmascript_canonical_check
  check (
    freshness_policy is null
    or (
      freshness_policy = public.fact_ecmascript_trim(freshness_policy)
      and char_length(freshness_policy) between 1 and 160
    )
  );

alter table public.sources
  add constraint sources_observed_at_finite_check
  check (observed_at is null or pg_catalog.isfinite(observed_at));

alter table public.fact_observations
  add constraint fact_observations_observed_at_finite_check
  check (pg_catalog.isfinite(observed_at));

alter table public.facts
  add constraint facts_resolved_at_finite_check
  check (resolved_at is null or pg_catalog.isfinite(resolved_at)),
  add constraint facts_last_verified_at_finite_check
  check (last_verified_at is null or pg_catalog.isfinite(last_verified_at)),
  add constraint facts_stale_at_finite_check
  check (stale_at is null or pg_catalog.isfinite(stale_at));

create or replace function public.validate_fact_definition_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.entity_type <> 'venue'
    or new.label <> public.fact_ecmascript_trim(new.label)
    or (
      new.unit is not null
      and new.unit <> public.fact_ecmascript_trim(new.unit)
    )
    or (
      new.freshness_policy is not null
      and new.freshness_policy <> public.fact_ecmascript_trim(new.freshness_policy)
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

alter function public.create_venue_fact_definition(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) rename to create_venue_fact_definition_core;

revoke all on function public.create_venue_fact_definition_core(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) from public, anon, authenticated;

create or replace function public.create_venue_fact_definition(
  target_project_id uuid,
  target_key text,
  target_label text,
  target_value_type text,
  target_unit text,
  target_priority text,
  target_weight numeric,
  target_freshness_policy text,
  target_options_json jsonb,
  target_evaluation_rule_json jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_key text := public.fact_ecmascript_trim(target_key);
  normalized_label text := public.fact_ecmascript_trim(target_label);
  normalized_unit text := case
    when target_unit is null then null
    else public.fact_ecmascript_trim(target_unit)
  end;
  normalized_freshness text := case
    when target_freshness_policy is null then null
    else public.fact_ecmascript_trim(target_freshness_policy)
  end;
begin
  if (target_unit is not null and normalized_unit = '')
    or (target_freshness_policy is not null and normalized_freshness = '') then
    raise exception 'fact definition unavailable' using errcode = '22023';
  end if;

  return public.create_venue_fact_definition_core(
    target_project_id,
    normalized_key,
    normalized_label,
    target_value_type,
    normalized_unit,
    target_priority,
    target_weight,
    normalized_freshness,
    target_options_json,
    target_evaluation_rule_json
  );
end;
$$;

revoke all on function public.create_venue_fact_definition(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) from public, anon;
grant execute on function public.create_venue_fact_definition(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) to authenticated;

alter function public.update_venue_fact_definition(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) rename to update_venue_fact_definition_core;

revoke all on function public.update_venue_fact_definition_core(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) from public, anon, authenticated;

create or replace function public.update_venue_fact_definition(
  target_project_id uuid,
  target_definition_id uuid,
  target_expected_revision bigint,
  target_label text,
  target_priority text,
  target_weight numeric,
  target_freshness_policy text,
  target_options_json jsonb,
  target_evaluation_rule_json jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_label text := public.fact_ecmascript_trim(target_label);
  normalized_freshness text := case
    when target_freshness_policy is null then null
    else public.fact_ecmascript_trim(target_freshness_policy)
  end;
begin
  if target_freshness_policy is not null and normalized_freshness = '' then
    raise exception 'fact definition unavailable' using errcode = '22023';
  end if;

  return public.update_venue_fact_definition_core(
    target_project_id,
    target_definition_id,
    target_expected_revision,
    normalized_label,
    target_priority,
    target_weight,
    normalized_freshness,
    target_options_json,
    target_evaluation_rule_json
  );
end;
$$;

revoke all on function public.update_venue_fact_definition(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) from public, anon;
grant execute on function public.update_venue_fact_definition(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) to authenticated;
