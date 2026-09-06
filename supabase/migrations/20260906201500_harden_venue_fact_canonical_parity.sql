alter function public.fact_value_valid(text, jsonb, jsonb)
rename to fact_value_shape_valid;

revoke all on function public.fact_value_shape_valid(text, jsonb, jsonb)
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
  if char_length(value_text) > 2048 then
    return false;
  end if;

  matched := regexp_match(
    value_text,
    '^https?://([A-Za-z0-9._~-]+)(:([0-9]{1,5}))?([/?#][^[:space:]]*)?$',
    'i'
  );
  if matched is null then
    return false;
  end if;

  host_text := matched[1];
  port_text := matched[3];
  if host_text ~ '^[0-9.]+$' then
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
  if target_date is null
    or target_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or substring(target_date from 1 for 4) = '0000' then
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

create or replace function public.fact_value_valid(
  target_value_type text,
  target_options jsonb,
  target_value jsonb
)
returns boolean
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select case
    when target_value_type = 'url'
      then public.fact_url_valid(target_value)
    else public.fact_value_shape_valid(
      target_value_type,
      target_options,
      target_value
    )
  end;
$$;

revoke all on function public.fact_value_valid(text, jsonb, jsonb)
from public, anon, authenticated;
