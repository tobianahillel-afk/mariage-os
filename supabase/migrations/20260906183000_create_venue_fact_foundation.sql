create table public.fact_definitions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  key text not null check (
    char_length(key) between 1 and 120
    and key ~ '^[a-z][a-z0-9]*(_[a-z0-9]+)*$'
  ),
  label text not null check (char_length(btrim(label)) between 1 and 240),
  entity_type text not null check (entity_type = 'venue'),
  value_type text not null check (
    value_type in (
      'boolean', 'number', 'money', 'text', 'date', 'time', 'rating',
      'select', 'multiselect', 'duration', 'distance', 'url'
    )
  ),
  unit text null check (unit is null or char_length(btrim(unit)) between 1 and 80),
  priority text not null check (
    priority in ('blocking', 'important', 'bonus', 'informational')
  ),
  weight numeric(8, 3) null check (weight is null or weight >= 0),
  freshness_policy text null check (
    freshness_policy is null
    or char_length(btrim(freshness_policy)) between 1 and 160
  ),
  system_defined boolean not null default false,
  options_json jsonb null,
  evaluation_rule_json jsonb null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  unique (project_id, entity_type, key)
);

create index fact_definitions_project_entity_idx
  on public.fact_definitions (project_id, entity_type, priority, key);

create table public.facts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  target_type text not null check (target_type = 'venue'),
  target_id uuid not null,
  definition_id uuid not null,
  state text not null check (
    state in ('known', 'unknown', 'not_applicable', 'conflict')
  ),
  retained_value jsonb null,
  retained_observation_id uuid null,
  resolution_note text null check (
    resolution_note is null or char_length(resolution_note) <= 5000
  ),
  resolved_by uuid null references auth.users(id),
  resolved_at timestamptz null,
  last_verified_at timestamptz null,
  stale_at timestamptz null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  unique (project_id, target_type, target_id, definition_id),
  foreign key (project_id, definition_id)
    references public.fact_definitions(project_id, id)
    on delete restrict,
  foreign key (project_id, target_id)
    references public.venues(project_id, id)
    on delete cascade
);

create index facts_target_idx
  on public.facts (project_id, target_type, target_id, state);
create index facts_definition_idx
  on public.facts (project_id, definition_id, state);

create or replace function public.fact_json_has_exact_keys(
  target_value jsonb,
  target_keys text[]
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_value is null or jsonb_typeof(target_value) <> 'object' then
    return false;
  end if;

  return (
      select count(*)
      from jsonb_object_keys(target_value)
    ) = cardinality(target_keys)
    and not exists (
      select 1
      from jsonb_object_keys(target_value) as key_name
      where not (key_name = any(target_keys))
    );
end;
$$;

revoke all on function public.fact_json_has_exact_keys(jsonb, text[])
from public, anon, authenticated;

create or replace function public.fact_option_key_exists(
  target_options jsonb,
  target_key text
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_options is null
    or jsonb_typeof(target_options) <> 'object'
    or jsonb_typeof(target_options -> 'options') <> 'array' then
    return false;
  end if;

  return exists (
    select 1
    from jsonb_array_elements(target_options -> 'options') as option_row
    where option_row ->> 'key' = target_key
  );
end;
$$;

revoke all on function public.fact_option_key_exists(jsonb, text)
from public, anon, authenticated;

create or replace function public.fact_numeric_options_valid(
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
begin
  if target_options is null then
    return true;
  end if;

  if jsonb_typeof(target_options) <> 'object'
    or exists (
      select 1
      from jsonb_object_keys(target_options) as key_name
      where key_name not in ('min', 'max', 'integer')
    ) then
    return false;
  end if;

  if target_options ? 'min' then
    if jsonb_typeof(target_options -> 'min') <> 'number' then
      return false;
    end if;
    minimum_value := (target_options ->> 'min')::numeric;
    if abs(minimum_value) > 1e308::numeric then
      return false;
    end if;
  end if;

  if target_options ? 'max' then
    if jsonb_typeof(target_options -> 'max') <> 'number' then
      return false;
    end if;
    maximum_value := (target_options ->> 'max')::numeric;
    if abs(maximum_value) > 1e308::numeric then
      return false;
    end if;
  end if;

  if target_options ? 'integer'
    and jsonb_typeof(target_options -> 'integer') <> 'boolean' then
    return false;
  end if;

  return minimum_value is null
    or maximum_value is null
    or minimum_value <= maximum_value;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_numeric_options_valid(jsonb)
from public, anon, authenticated;

create or replace function public.fact_select_options_valid(
  target_options jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  option_count integer;
begin
  if not public.fact_json_has_exact_keys(target_options, array['options'])
    or jsonb_typeof(target_options -> 'options') <> 'array' then
    return false;
  end if;

  option_count := jsonb_array_length(target_options -> 'options');
  if option_count < 1 or option_count > 100 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(target_options -> 'options') as option_row
    where not public.fact_json_has_exact_keys(option_row, array['key', 'labelKey'])
      or jsonb_typeof(option_row -> 'key') <> 'string'
      or jsonb_typeof(option_row -> 'labelKey') <> 'string'
      or char_length(option_row ->> 'key') not between 1 and 80
      or option_row ->> 'key' !~ '^[a-z][a-z0-9]*(_[a-z0-9]+)*$'
      or char_length(option_row ->> 'labelKey') not between 1 and 160
      or option_row ->> 'labelKey' <> btrim(option_row ->> 'labelKey')
  ) then
    return false;
  end if;

  return option_count = (
    select count(distinct option_row ->> 'key')
    from jsonb_array_elements(target_options -> 'options') as option_row
  );
end;
$$;

revoke all on function public.fact_select_options_valid(jsonb)
from public, anon, authenticated;

create or replace function public.fact_options_valid(
  target_value_type text,
  target_unit text,
  target_options jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_value_type = 'duration' and target_unit is distinct from 'minutes' then
    return false;
  end if;
  if target_value_type = 'distance' and target_unit is distinct from 'meters' then
    return false;
  end if;

  if target_value_type in ('number', 'rating', 'duration', 'distance') then
    return public.fact_numeric_options_valid(target_options);
  end if;
  if target_value_type in ('select', 'multiselect') then
    return public.fact_select_options_valid(target_options);
  end if;
  return target_options is null;
end;
$$;

revoke all on function public.fact_options_valid(text, text, jsonb)
from public, anon, authenticated;

create or replace function public.fact_clock_valid(target_clock text)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select coalesce(target_clock ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$', false);
$$;

revoke all on function public.fact_clock_valid(text)
from public, anon, authenticated;

create or replace function public.fact_money_valid(target_value jsonb)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  minor_value numeric;
begin
  if not public.fact_json_has_exact_keys(target_value, array['minor', 'currency'])
    or jsonb_typeof(target_value -> 'minor') <> 'number'
    or jsonb_typeof(target_value -> 'currency') <> 'string' then
    return false;
  end if;

  minor_value := (target_value ->> 'minor')::numeric;
  return minor_value = trunc(minor_value)
    and minor_value between 0 and 9007199254740991
    and (target_value ->> 'currency') ~ '^[A-Z]{3}$';
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_money_valid(jsonb)
from public, anon, authenticated;

create or replace function public.fact_rule_string_set_valid(
  target_values jsonb,
  target_options jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_values is null or jsonb_typeof(target_values) <> 'array'
    or jsonb_array_length(target_values) < 1 then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(target_values) as item
    where jsonb_typeof(item) <> 'string'
      or not public.fact_option_key_exists(target_options, item #>> '{}')
  ) then
    return false;
  end if;

  return jsonb_array_length(target_values) = (
    select count(distinct item #>> '{}')
    from jsonb_array_elements(target_values) as item
  );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_rule_string_set_valid(jsonb, jsonb)
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
  minimum_value numeric;
  maximum_value numeric;
begin
  if target_rule is null then
    return true;
  end if;
  if jsonb_typeof(target_rule) <> 'object'
    or jsonb_typeof(target_rule -> 'type') <> 'string' then
    return false;
  end if;

  rule_type := target_rule ->> 'type';

  if rule_type = 'boolean_equals' then
    return target_value_type = 'boolean'
      and public.fact_json_has_exact_keys(target_rule, array['type', 'expected'])
      and jsonb_typeof(target_rule -> 'expected') = 'boolean';
  end if;

  if rule_type in ('number_min', 'number_max') then
    if target_value_type not in ('number', 'duration', 'distance') then
      return false;
    end if;
    if rule_type = 'number_min' then
      return public.fact_json_has_exact_keys(target_rule, array['type', 'minimum'])
        and jsonb_typeof(target_rule -> 'minimum') = 'number';
    end if;
    return public.fact_json_has_exact_keys(target_rule, array['type', 'maximum'])
      and jsonb_typeof(target_rule -> 'maximum') = 'number';
  end if;

  if rule_type = 'number_range' then
    if target_value_type not in ('number', 'duration', 'distance')
      or not public.fact_json_has_exact_keys(
        target_rule,
        array['type', 'minimum', 'maximum']
      )
      or jsonb_typeof(target_rule -> 'minimum') <> 'number'
      or jsonb_typeof(target_rule -> 'maximum') <> 'number' then
      return false;
    end if;
    minimum_value := (target_rule ->> 'minimum')::numeric;
    maximum_value := (target_rule ->> 'maximum')::numeric;
    return abs(minimum_value) <= 1e308::numeric
      and abs(maximum_value) <= 1e308::numeric
      and minimum_value <= maximum_value;
  end if;

  if rule_type = 'rating_min' then
    return target_value_type = 'rating'
      and public.fact_json_has_exact_keys(target_rule, array['type', 'minimum'])
      and jsonb_typeof(target_rule -> 'minimum') = 'number';
  end if;

  if rule_type in ('select_in', 'select_not_in') then
    if target_value_type <> 'select' then
      return false;
    end if;
    if rule_type = 'select_in' then
      return public.fact_json_has_exact_keys(target_rule, array['type', 'accepted'])
        and public.fact_rule_string_set_valid(
          target_rule -> 'accepted',
          target_options
        );
    end if;
    return public.fact_json_has_exact_keys(target_rule, array['type', 'rejected'])
      and public.fact_rule_string_set_valid(
        target_rule -> 'rejected',
        target_options
      );
  end if;

  if rule_type in ('time_at_or_after', 'time_at_or_before') then
    return target_value_type = 'time'
      and public.fact_json_has_exact_keys(
        target_rule,
        array['type', 'time', 'dayOffset']
      )
      and jsonb_typeof(target_rule -> 'time') = 'string'
      and public.fact_clock_valid(target_rule ->> 'time')
      and jsonb_typeof(target_rule -> 'dayOffset') = 'number'
      and (target_rule ->> 'dayOffset')::numeric =
        trunc((target_rule ->> 'dayOffset')::numeric)
      and (target_rule ->> 'dayOffset')::numeric between 0 and 2;
  end if;

  if rule_type = 'money_max' then
    return target_value_type = 'money'
      and public.fact_json_has_exact_keys(target_rule, array['type', 'maximum'])
      and public.fact_money_valid(target_rule -> 'maximum');
  end if;

  if rule_type = 'project_target_guest_count_supported' then
    return target_value_type = 'boolean'
      and public.fact_json_has_exact_keys(target_rule, array['type']);
  end if;

  if rule_type = 'custom_manual_assessment' then
    return target_value_type in ('boolean', 'select', 'rating')
      and public.fact_json_has_exact_keys(target_rule, array['type']);
  end if;

  return false;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_evaluation_rule_valid(text, jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.fact_iso_date_valid(target_date text)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  parsed_date date;
begin
  if target_date is null or target_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
    return false;
  end if;
  parsed_date := target_date::date;
  return to_char(parsed_date, 'YYYY-MM-DD') = target_date;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_iso_date_valid(text)
from public, anon, authenticated;

create or replace function public.fact_numeric_value_valid(
  target_value jsonb,
  target_options jsonb,
  default_minimum numeric,
  default_maximum numeric,
  require_integer boolean
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  numeric_value numeric;
  minimum_value numeric := default_minimum;
  maximum_value numeric := default_maximum;
  integer_required boolean := require_integer;
begin
  if target_value is null or jsonb_typeof(target_value) <> 'number' then
    return false;
  end if;

  numeric_value := (target_value #>> '{}')::numeric;
  if abs(numeric_value) > 1e308::numeric then
    return false;
  end if;
  if target_options is not null and target_options ? 'min' then
    minimum_value := (target_options ->> 'min')::numeric;
  end if;
  if target_options is not null and target_options ? 'max' then
    maximum_value := (target_options ->> 'max')::numeric;
  end if;
  if target_options is not null and target_options ? 'integer' then
    integer_required := integer_required
      or (target_options ->> 'integer')::boolean;
  end if;

  return (minimum_value is null or numeric_value >= minimum_value)
    and (maximum_value is null or numeric_value <= maximum_value)
    and (
      not integer_required
      or (
        numeric_value = trunc(numeric_value)
        and abs(numeric_value) <= 9007199254740991
      )
    );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_numeric_value_valid(
  jsonb, jsonb, numeric, numeric, boolean
) from public, anon, authenticated;

create or replace function public.fact_multiselect_value_valid(
  target_value jsonb,
  target_options jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
begin
  if target_value is null or jsonb_typeof(target_value) <> 'array' then
    return false;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(target_value) as item
    where jsonb_typeof(item) <> 'string'
      or not public.fact_option_key_exists(target_options, item #>> '{}')
  ) then
    return false;
  end if;

  return jsonb_array_length(target_value) = (
    select count(distinct item #>> '{}')
    from jsonb_array_elements(target_value) as item
  );
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_multiselect_value_valid(jsonb, jsonb)
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

  select coalesce(jsonb_agg(option_row ->> 'key' order by option_order), '[]'::jsonb)
  into canonical_value
  from jsonb_array_elements(target_options -> 'options')
    with ordinality as configured(option_row, option_order)
  where exists (
    select 1
    from jsonb_array_elements(target_value) as requested
    where requested #>> '{}' = option_row ->> 'key'
  );

  return canonical_value;
exception
  when others then
    return null;
end;
$$;

revoke all on function public.fact_multiselect_canonical_value(jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.fact_value_valid(
  target_value_type text,
  target_options jsonb,
  target_value jsonb
)
returns boolean
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  value_text text;
  time_row jsonb;
begin
  if target_value is null then
    return false;
  end if;

  if target_value_type = 'boolean' then
    return jsonb_typeof(target_value) = 'boolean';
  end if;
  if target_value_type = 'number' then
    return public.fact_numeric_value_valid(
      target_value, target_options, null, null, false
    );
  end if;
  if target_value_type = 'rating' then
    return public.fact_numeric_value_valid(
      target_value, target_options, 0, 10, false
    );
  end if;
  if target_value_type = 'money' then
    return public.fact_money_valid(target_value);
  end if;
  if target_value_type = 'text' then
    return jsonb_typeof(target_value) = 'string'
      and char_length(target_value #>> '{}') <= 5000;
  end if;
  if target_value_type = 'url' then
    if jsonb_typeof(target_value) <> 'string' then
      return false;
    end if;
    value_text := target_value #>> '{}';
    return char_length(value_text) <= 2048
      and value_text ~* '^https?://[^[:space:]/?#]+(?:[/:?#].*)?$';
  end if;
  if target_value_type = 'date' then
    return jsonb_typeof(target_value) = 'string'
      and public.fact_iso_date_valid(target_value #>> '{}');
  end if;
  if target_value_type = 'time' then
    time_row := target_value;
    return public.fact_json_has_exact_keys(time_row, array['time', 'dayOffset'])
      and jsonb_typeof(time_row -> 'time') = 'string'
      and public.fact_clock_valid(time_row ->> 'time')
      and jsonb_typeof(time_row -> 'dayOffset') = 'number'
      and (time_row ->> 'dayOffset')::numeric =
        trunc((time_row ->> 'dayOffset')::numeric)
      and (time_row ->> 'dayOffset')::numeric between 0 and 2;
  end if;
  if target_value_type in ('duration', 'distance') then
    return public.fact_numeric_value_valid(
      target_value, target_options, 0, null, true
    );
  end if;
  if target_value_type = 'select' then
    return jsonb_typeof(target_value) = 'string'
      and public.fact_option_key_exists(target_options, target_value #>> '{}');
  end if;
  if target_value_type = 'multiselect' then
    return public.fact_multiselect_value_valid(target_value, target_options);
  end if;
  return false;
exception
  when others then
    return false;
end;
$$;

revoke all on function public.fact_value_valid(text, jsonb, jsonb)
from public, anon, authenticated;

create or replace function public.retained_fact_value_valid(
  target_value_type text,
  target_options jsonb,
  target_state text,
  target_value jsonb
)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select case
    when target_state = 'known'
      then target_value is not null
        and public.fact_value_valid(target_value_type, target_options, target_value)
    when target_state in ('unknown', 'not_applicable', 'conflict')
      then target_value is null
    else false
  end;
$$;

revoke all on function public.retained_fact_value_valid(text, jsonb, text, jsonb)
from public, anon, authenticated;

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
        and f.state = 'known'
        and not public.fact_value_valid(
          new.value_type,
          new.options_json,
          f.retained_value
        )
    ) then
      raise exception 'fact definition invalidates retained truth'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_fact_definition_row()
from public, anon, authenticated;

create trigger fact_definitions_validate
before insert or update on public.fact_definitions
for each row
execute function public.validate_fact_definition_row();

create or replace function public.validate_retained_fact_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  definition_row public.fact_definitions%rowtype;
begin
  select *
  into definition_row
  from public.fact_definitions fd
  where fd.project_id = new.project_id
    and fd.id = new.definition_id;

  if not found
    or new.target_type <> 'venue'
    or definition_row.entity_type <> new.target_type
    or not exists (
      select 1
      from public.venues v
      where v.project_id = new.project_id
        and v.id = new.target_id
    )
    or not public.retained_fact_value_valid(
      definition_row.value_type,
      definition_row.options_json,
      new.state,
      new.retained_value
    ) then
    raise exception 'retained venue fact unavailable' using errcode = '23514';
  end if;

  if new.retained_observation_id is not null
    or new.resolution_note is not null
    or new.resolved_by is not null
    or new.resolved_at is not null
    or new.last_verified_at is not null
    or new.stale_at is not null then
    raise exception 'observation fields unavailable in WP-2.3' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_retained_fact_row()
from public, anon, authenticated;

create trigger facts_validate
before insert or update on public.facts
for each row
execute function public.validate_retained_fact_row();

create or replace function public.touch_fact_audit()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.touch_fact_audit()
from public, anon, authenticated;

create trigger fact_definitions_touch_audit
before update on public.fact_definitions
for each row
execute function public.touch_fact_audit();

create trigger facts_touch_audit
before update on public.facts
for each row
execute function public.touch_fact_audit();

alter table public.fact_definitions enable row level security;
alter table public.facts enable row level security;

revoke all on table public.fact_definitions from public, anon, authenticated;
revoke all on table public.facts from public, anon, authenticated;

grant select on table public.fact_definitions to authenticated;
grant select on table public.facts to authenticated;

create policy fact_definitions_select_authorized
on public.fact_definitions
for select
to authenticated
using (
  entity_type = 'venue'
  and public.has_project_permission(project_id, 'venues.read')
);

create policy facts_select_authorized
on public.facts
for select
to authenticated
using (
  target_type = 'venue'
  and public.has_project_permission(project_id, 'venues.read')
);

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
  saved_row public.fact_definitions%rowtype;
  normalized_key text := btrim(target_key);
  normalized_label text := btrim(target_label);
  normalized_unit text := nullif(btrim(target_unit), '');
  normalized_freshness text := nullif(btrim(target_freshness_policy), '');
begin
  if auth.uid() is null then
    raise exception 'fact definition unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'fact definition unavailable' using errcode = '42501';
  end if;

  if normalized_key is null
    or char_length(normalized_key) not between 1 and 120
    or normalized_key !~ '^[a-z][a-z0-9]*(_[a-z0-9]+)*$'
    or normalized_label is null
    or char_length(normalized_label) not between 1 and 240
    or target_value_type not in (
      'boolean', 'number', 'money', 'text', 'date', 'time', 'rating',
      'select', 'multiselect', 'duration', 'distance', 'url'
    )
    or target_priority not in ('blocking', 'important', 'bonus', 'informational')
    or (
      target_weight is not null
      and (
        target_weight < 0
        or target_weight > 99999.999
        or target_weight <> trunc(target_weight, 3)
      )
    )
    or (normalized_unit is not null and char_length(normalized_unit) > 80)
    or (
      normalized_freshness is not null
      and char_length(normalized_freshness) > 160
    )
    or not public.fact_options_valid(
      target_value_type,
      normalized_unit,
      target_options_json
    )
    or not public.fact_evaluation_rule_valid(
      target_value_type,
      target_options_json,
      target_evaluation_rule_json
    ) then
    raise exception 'fact definition unavailable' using errcode = '22023';
  end if;

  insert into public.fact_definitions (
    project_id,
    key,
    label,
    entity_type,
    value_type,
    unit,
    priority,
    weight,
    freshness_policy,
    system_defined,
    options_json,
    evaluation_rule_json,
    created_by,
    updated_by
  ) values (
    target_project_id,
    normalized_key,
    normalized_label,
    'venue',
    target_value_type,
    normalized_unit,
    target_priority,
    target_weight,
    normalized_freshness,
    false,
    target_options_json,
    target_evaluation_rule_json,
    auth.uid(),
    auth.uid()
  )
  returning * into saved_row;

  return to_jsonb(saved_row);
exception
  when unique_violation then
    raise exception 'fact definition unavailable' using errcode = '23505';
end;
$$;

revoke all on function public.create_venue_fact_definition(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) from public, anon;
grant execute on function public.create_venue_fact_definition(
  uuid, text, text, text, text, text, numeric, text, jsonb, jsonb
) to authenticated;

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
  current_row public.fact_definitions%rowtype;
  saved_row public.fact_definitions%rowtype;
  normalized_label text := btrim(target_label);
  normalized_freshness text := nullif(btrim(target_freshness_policy), '');
begin
  if auth.uid() is null then
    raise exception 'fact definition unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'fact definition unavailable' using errcode = '42501';
  end if;

  select *
  into current_row
  from public.fact_definitions fd
  where fd.project_id = target_project_id
    and fd.id = target_definition_id
    and fd.entity_type = 'venue'
  for update;

  if not found then
    raise exception 'fact definition unavailable' using errcode = '42501';
  end if;
  if target_expected_revision is null
    or target_expected_revision < 1
    or current_row.revision <> target_expected_revision then
    raise exception 'stale fact definition' using errcode = '40001';
  end if;

  if normalized_label is null
    or char_length(normalized_label) not between 1 and 240
    or target_priority not in ('blocking', 'important', 'bonus', 'informational')
    or (
      target_weight is not null
      and (
        target_weight < 0
        or target_weight > 99999.999
        or target_weight <> trunc(target_weight, 3)
      )
    )
    or (
      normalized_freshness is not null
      and char_length(normalized_freshness) > 160
    )
    or not public.fact_options_valid(
      current_row.value_type,
      current_row.unit,
      target_options_json
    )
    or not public.fact_evaluation_rule_valid(
      current_row.value_type,
      target_options_json,
      target_evaluation_rule_json
    ) then
    raise exception 'fact definition unavailable' using errcode = '22023';
  end if;

  if current_row.system_defined and (
    target_options_json is distinct from current_row.options_json
    or target_evaluation_rule_json is distinct from current_row.evaluation_rule_json
  ) then
    raise exception 'system fact definition semantics are protected'
      using errcode = '42501';
  end if;

  update public.fact_definitions
  set label = normalized_label,
      priority = target_priority,
      weight = target_weight,
      freshness_policy = normalized_freshness,
      options_json = target_options_json,
      evaluation_rule_json = target_evaluation_rule_json
  where project_id = target_project_id
    and id = target_definition_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.update_venue_fact_definition(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) from public, anon;
grant execute on function public.update_venue_fact_definition(
  uuid, uuid, bigint, text, text, numeric, text, jsonb, jsonb
) to authenticated;

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
  definition_row public.fact_definitions%rowtype;
  current_row public.facts%rowtype;
  saved_row public.facts%rowtype;
  canonical_value jsonb := target_retained_value;
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

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  select *
  into definition_row
  from public.fact_definitions fd
  where fd.project_id = target_project_id
    and fd.id = target_definition_id
    and fd.entity_type = 'venue'
  for share;

  if not found then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  if target_state = 'known'
    and definition_row.value_type = 'multiselect' then
    canonical_value := public.fact_multiselect_canonical_value(
      target_retained_value,
      definition_row.options_json
    );
    if canonical_value is null then
      raise exception 'retained venue fact unavailable' using errcode = '22023';
    end if;
  end if;

  if not public.retained_fact_value_valid(
    definition_row.value_type,
    definition_row.options_json,
    target_state,
    canonical_value
  ) then
    raise exception 'retained venue fact unavailable' using errcode = '22023';
  end if;

  select *
  into current_row
  from public.facts f
  where f.project_id = target_project_id
    and f.target_type = 'venue'
    and f.target_id = target_venue_id
    and f.definition_id = target_definition_id
  for update;

  if not found then
    if target_expected_revision is not null then
      raise exception 'stale retained venue fact' using errcode = '40001';
    end if;

    insert into public.facts (
      project_id,
      target_type,
      target_id,
      definition_id,
      state,
      retained_value,
      created_by,
      updated_by
    ) values (
      target_project_id,
      'venue',
      target_venue_id,
      target_definition_id,
      target_state,
      canonical_value,
      auth.uid(),
      auth.uid()
    )
    returning * into saved_row;

    return to_jsonb(saved_row);
  end if;

  if target_expected_revision is null
    or target_expected_revision < 1
    or current_row.revision <> target_expected_revision then
    raise exception 'stale retained venue fact' using errcode = '40001';
  end if;

  update public.facts
  set state = target_state,
      retained_value = canonical_value,
      retained_observation_id = null,
      resolution_note = null,
      resolved_by = null,
      resolved_at = null,
      last_verified_at = null,
      stale_at = null
  where project_id = target_project_id
    and id = current_row.id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.set_retained_venue_fact(
  uuid, uuid, uuid, bigint, text, jsonb
) from public, anon;
grant execute on function public.set_retained_venue_fact(
  uuid, uuid, uuid, bigint, text, jsonb
) to authenticated;
