alter function public.fact_options_valid(text, text, jsonb)
rename to fact_options_shape_valid;

revoke all on function public.fact_options_shape_valid(text, text, jsonb)
from public, anon, authenticated;

create or replace function public.fact_integer_interval_has_safe_value(
  target_minimum numeric,
  target_maximum numeric
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  lower_value numeric := greatest(
    coalesce(target_minimum, -9007199254740991::numeric),
    -9007199254740991::numeric
  );
  upper_value numeric := least(
    coalesce(target_maximum, 9007199254740991::numeric),
    9007199254740991::numeric
  );
begin
  return ceil(lower_value) <= floor(upper_value);
end;
$$;

revoke all on function public.fact_integer_interval_has_safe_value(numeric, numeric)
from public, anon, authenticated;

create or replace function public.fact_numeric_options_semantically_valid(
  target_value_type text,
  target_options jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  minimum_value numeric;
  maximum_value numeric;
  integer_requested boolean := false;
begin
  if target_value_type not in ('number', 'rating', 'duration', 'distance') then
    return true;
  end if;

  if target_options is not null and target_options ? 'min' then
    minimum_value := (target_options ->> 'min')::numeric;
  end if;
  if target_options is not null and target_options ? 'max' then
    maximum_value := (target_options ->> 'max')::numeric;
  end if;
  if target_options is not null and target_options ? 'integer' then
    integer_requested := (target_options ->> 'integer')::boolean;
  end if;

  if target_value_type = 'rating' then
    minimum_value := coalesce(minimum_value, 0);
    maximum_value := coalesce(maximum_value, 10);
    if minimum_value > maximum_value then
      return false;
    end if;
    return not integer_requested
      or public.fact_integer_interval_has_safe_value(minimum_value, maximum_value);
  end if;

  if target_value_type in ('duration', 'distance') then
    if target_options is not null
      and target_options ? 'integer'
      and not integer_requested then
      return false;
    end if;
    minimum_value := greatest(coalesce(minimum_value, 0), 0);
    maximum_value := least(
      coalesce(maximum_value, 9007199254740991::numeric),
      9007199254740991::numeric
    );
    return public.fact_integer_interval_has_safe_value(
      minimum_value,
      maximum_value
    );
  end if;

  return not integer_requested
    or public.fact_integer_interval_has_safe_value(minimum_value, maximum_value);
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_numeric_options_semantically_valid(text, jsonb)
from public, anon, authenticated;

create or replace function public.fact_options_valid(
  target_value_type text,
  target_unit text,
  target_options jsonb
)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select public.fact_options_shape_valid(
      target_value_type,
      target_unit,
      target_options
    )
    and public.fact_numeric_options_semantically_valid(
      target_value_type,
      target_options
    );
$$;

revoke all on function public.fact_options_valid(text, text, jsonb)
from public, anon, authenticated;

create or replace function public.fact_multiselect_canonical_value(
  target_value jsonb,
  target_options jsonb
)
returns jsonb
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  canonical_value jsonb;
begin
  if not public.fact_multiselect_value_valid(target_value, target_options) then
    return null;
  end if;

  select coalesce(
    jsonb_agg(requested #>> '{}' order by (requested #>> '{}') collate "C"),
    '[]'::jsonb
  )
  into canonical_value
  from jsonb_array_elements(target_value) as requested;

  return canonical_value;
exception
  when others then
    return null;
end;
$$;

revoke all on function public.fact_multiselect_canonical_value(jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.fact_url_host_valid(target_host text)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  labels text[];
  final_label text;
begin
  if target_host is null
    or char_length(target_host) not between 1 and 253
    or target_host ~ '^[0-9.]+$' then
    return false;
  end if;

  labels := string_to_array(target_host, '.');
  if exists (
    select 1
    from unnest(labels) as label
    where char_length(label) not between 1 and 63
      or label !~ '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$'
      or label ~* '^xn--'
  ) then
    return false;
  end if;

  if cardinality(labels) = 1 then
    return true;
  end if;

  final_label := labels[cardinality(labels)];
  return final_label ~ '^[A-Za-z]{2,63}$';
end;
$$;

revoke all on function public.fact_url_host_valid(text)
from public, anon, authenticated;

create or replace function public.fact_url_valid(target_value jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  value_text text;
  matched text[];
  host_text text;
  port_text text;
begin
  if target_value is null or jsonb_typeof(target_value) <> 'string' then
    return false;
  end if;

  value_text := target_value #>> '{}';
  if char_length(value_text) not between 1 and 2048 then
    return false;
  end if;

  matched := regexp_match(
    value_text,
    '^https?://([^/:?#[:space:]]+)(:([0-9]{1,5}))?([/?#][^[:space:][:cntrl:]]*)?$',
    'i'
  );
  if matched is null then
    return false;
  end if;

  host_text := matched[1];
  port_text := matched[3];
  if not public.fact_url_host_valid(host_text) then
    return false;
  end if;
  if port_text is not null and port_text::integer > 65535 then
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_url_valid(jsonb)
from public, anon, authenticated;
