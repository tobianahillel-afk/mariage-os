alter function public.fact_evaluation_rule_valid(text, jsonb, jsonb)
rename to fact_evaluation_rule_shape_valid;

revoke all on function public.fact_evaluation_rule_shape_valid(text, jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.fact_rule_finite_number_valid(
  target_value jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  numeric_value numeric;
begin
  if target_value is null or jsonb_typeof(target_value) <> 'number' then
    return false;
  end if;

  numeric_value := (target_value #>> '{}')::numeric;
  return abs(numeric_value) <= 1e308::numeric;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_rule_finite_number_valid(jsonb)
from public, anon, authenticated;

create or replace function public.fact_evaluation_rule_numeric_bounds_valid(
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
  if target_rule is null then
    return true;
  end if;

  if jsonb_typeof(target_rule) <> 'object'
    or jsonb_typeof(target_rule -> 'type') <> 'string' then
    return false;
  end if;

  rule_type := target_rule ->> 'type';

  if rule_type in ('number_min', 'rating_min') then
    return public.fact_rule_finite_number_valid(target_rule -> 'minimum');
  end if;

  if rule_type = 'number_max' then
    return public.fact_rule_finite_number_valid(target_rule -> 'maximum');
  end if;

  if rule_type = 'number_range' then
    return public.fact_rule_finite_number_valid(target_rule -> 'minimum')
      and public.fact_rule_finite_number_valid(target_rule -> 'maximum');
  end if;

  return true;
end;
$$;

revoke all on function public.fact_evaluation_rule_numeric_bounds_valid(jsonb)
from public, anon, authenticated;

create or replace function public.fact_evaluation_rule_valid(
  target_value_type text,
  target_options jsonb,
  target_rule jsonb
)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select public.fact_evaluation_rule_shape_valid(
      target_value_type,
      target_options,
      target_rule
    )
    and public.fact_evaluation_rule_numeric_bounds_valid(target_rule);
$$;

revoke all on function public.fact_evaluation_rule_valid(text, jsonb, jsonb)
from public, anon, authenticated;
