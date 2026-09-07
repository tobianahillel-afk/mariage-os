alter function public.fact_evaluation_rule_valid(text, jsonb, jsonb)
rename to fact_evaluation_rule_pre_wp25_valid;

revoke all on function public.fact_evaluation_rule_pre_wp25_valid(text, jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.fact_evaluation_rule_valid(
  target_value_type text,
  target_options jsonb,
  target_rule jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  rule_type text;
begin
  if target_rule is not null
    and jsonb_typeof(target_rule) = 'object'
    and jsonb_typeof(target_rule -> 'type') = 'string' then
    rule_type := target_rule ->> 'type';
  end if;

  if rule_type = 'custom_manual_assessment' then
    return target_value_type in ('boolean', 'select', 'rating')
      and public.fact_json_has_exact_keys(
        target_rule,
        array['type', 'accepted']
      )
      and public.fact_value_valid(
        target_value_type,
        target_options,
        target_rule -> 'accepted'
      );
  end if;

  return public.fact_evaluation_rule_pre_wp25_valid(
    target_value_type,
    target_options,
    target_rule
  );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_evaluation_rule_valid(text, jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.validate_venue_criterion_system_shape()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  rule_type text := new.evaluation_rule_json ->> 'type';
begin
  if new.key = 'target_guest_count_supported' then
    if not (
      new.system_defined
      and new.entity_type = 'venue'
      and new.value_type = 'boolean'
      and new.unit is null
      and new.priority = 'blocking'
      and new.evaluation_rule_json =
        '{"type":"project_target_guest_count_supported"}'::jsonb
    ) then
      raise exception 'venue criterion system definition unavailable'
        using errcode = '23514';
    end if;
  elsif rule_type = 'project_target_guest_count_supported' then
    raise exception 'venue criterion system definition unavailable'
      using errcode = '23514';
  end if;

  if new.key = 'two_dance_areas_max_guest_estimate'
    and not (
      new.system_defined
      and new.entity_type = 'venue'
      and new.value_type = 'number'
      and new.unit = 'people'
      and new.priority = 'important'
    ) then
    raise exception 'venue criterion system definition unavailable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_venue_criterion_system_shape()
from public, anon, authenticated;

create trigger fact_definitions_wp25_system_shape
before insert or update on public.fact_definitions
for each row execute function public.validate_venue_criterion_system_shape();

create or replace function public.is_derived_venue_fact_definition(
  target_project_id uuid,
  target_definition_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.fact_definitions fd
    where fd.project_id = target_project_id
      and fd.id = target_definition_id
      and fd.entity_type = 'venue'
      and fd.key = 'target_guest_count_supported'
  );
$$;

revoke all on function public.is_derived_venue_fact_definition(uuid, uuid)
from public, anon, authenticated;

create or replace function public.reject_derived_venue_fact_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if public.is_derived_venue_fact_definition(
    new.project_id,
    new.definition_id
  ) then
    raise exception 'derived venue criterion is read-only'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_derived_venue_fact_write()
from public, anon, authenticated;

create trigger facts_wp25_derived_read_only
before insert or update on public.facts
for each row execute function public.reject_derived_venue_fact_write();

create or replace function public.reject_derived_venue_fact_observation_write()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  fact_row public.facts%rowtype;
begin
  select * into fact_row
  from public.facts f
  where f.project_id = new.project_id
    and f.id = new.fact_id;

  if found and public.is_derived_venue_fact_definition(
    fact_row.project_id,
    fact_row.definition_id
  ) then
    raise exception 'derived venue criterion evidence is read-only'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function public.reject_derived_venue_fact_observation_write()
from public, anon, authenticated;

create trigger fact_observations_wp25_derived_read_only
before insert or update on public.fact_observations
for each row execute function public.reject_derived_venue_fact_observation_write();
