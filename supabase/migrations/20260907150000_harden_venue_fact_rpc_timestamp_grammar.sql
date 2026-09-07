create or replace function public.fact_parse_application_instant(
  target_value text
)
returns timestamptz
language plpgsql
immutable
security definer
set search_path = pg_catalog
as $$
declare
  parts text[];
  year_value integer;
  month_value integer;
  day_value integer;
  hour_value integer;
  minute_value integer;
  second_value integer;
  fraction_text text;
  microsecond_value integer;
  offset_text text;
  offset_hours integer;
  offset_minutes_component integer;
  signed_offset_minutes integer;
  local_timestamp timestamp without time zone;
  parsed_timestamp timestamptz;
begin
  if target_value is null then
    return null;
  end if;

  parts := regexp_match(
    target_value,
    '^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.([0-9]{1,6}))?(Z|[+-][0-9]{2}:[0-9]{2})$'
  );
  if parts is null then
    return null;
  end if;

  year_value := parts[1]::integer;
  month_value := parts[2]::integer;
  day_value := parts[3]::integer;
  hour_value := parts[4]::integer;
  minute_value := parts[5]::integer;
  second_value := parts[6]::integer;
  fraction_text := coalesce(parts[7], '');
  microsecond_value := rpad(fraction_text, 6, '0')::integer;
  offset_text := parts[8];

  if year_value not between 1 and 9999
    or month_value not between 1 and 12
    or day_value not between 1 and 31
    or hour_value not between 0 and 23
    or minute_value not between 0 and 59
    or second_value not between 0 and 59 then
    return null;
  end if;

  if offset_text = 'Z' then
    signed_offset_minutes := 0;
  else
    offset_hours := substring(offset_text from 2 for 2)::integer;
    offset_minutes_component := substring(offset_text from 5 for 2)::integer;
    if offset_hours > 14
      or offset_minutes_component > 59
      or (offset_hours = 14 and offset_minutes_component <> 0) then
      return null;
    end if;
    signed_offset_minutes := offset_hours * 60 + offset_minutes_component;
    if substring(offset_text from 1 for 1) = '-' then
      signed_offset_minutes := -signed_offset_minutes;
    end if;
  end if;

  local_timestamp := make_timestamp(
    year_value,
    month_value,
    day_value,
    hour_value,
    minute_value,
    second_value + microsecond_value / 1000000.0
  );
  parsed_timestamp := local_timestamp at time zone 'UTC';
  parsed_timestamp := parsed_timestamp - make_interval(mins => signed_offset_minutes);

  if not public.fact_instant_in_application_domain(parsed_timestamp) then
    return null;
  end if;
  return parsed_timestamp;
exception
  when others then
    return null;
end;
$$;

revoke all on function public.fact_parse_application_instant(text)
from public, anon, authenticated;

alter function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) rename to create_venue_fact_source_timestamp_core;
revoke all on function public.create_venue_fact_source_timestamp_core(
  uuid, text, text, text, text, timestamptz, text, text
) from public, anon, authenticated;

create or replace function public.create_venue_fact_source(
  target_project_id uuid,
  target_source_type text,
  target_title text,
  target_url text,
  target_evidence_level text,
  target_observed_at text,
  target_notes text,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  parsed_observed_at timestamptz := public.fact_parse_application_instant(target_observed_at);
begin
  if target_observed_at is not null and parsed_observed_at is null then
    raise exception 'venue fact source unavailable' using errcode = '22023';
  end if;
  return public.create_venue_fact_source_timestamp_core(
    target_project_id, target_source_type, target_title, target_url,
    target_evidence_level, parsed_observed_at, target_notes, target_status
  );
end;
$$;
revoke all on function public.create_venue_fact_source(
  uuid, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.create_venue_fact_source(
  uuid, text, text, text, text, text, text, text
) to authenticated;

alter function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) rename to update_venue_fact_source_timestamp_core;
revoke all on function public.update_venue_fact_source_timestamp_core(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) from public, anon, authenticated;

create or replace function public.update_venue_fact_source(
  target_project_id uuid,
  target_source_id uuid,
  target_expected_revision bigint,
  target_source_type text,
  target_title text,
  target_url text,
  target_evidence_level text,
  target_observed_at text,
  target_notes text,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  parsed_observed_at timestamptz := public.fact_parse_application_instant(target_observed_at);
begin
  if target_observed_at is not null and parsed_observed_at is null then
    raise exception 'venue fact source unavailable' using errcode = '22023';
  end if;
  return public.update_venue_fact_source_timestamp_core(
    target_project_id, target_source_id, target_expected_revision,
    target_source_type, target_title, target_url, target_evidence_level,
    parsed_observed_at, target_notes, target_status
  );
end;
$$;
revoke all on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, text, text, text
) from public, anon;
grant execute on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, text, text, text
) to authenticated;

alter function public.append_venue_fact_observation(
  uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) rename to append_venue_fact_observation_timestamp_core;
revoke all on function public.append_venue_fact_observation_timestamp_core(
  uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) from public, anon, authenticated;

create or replace function public.append_venue_fact_observation(
  target_project_id uuid,
  target_fact_id uuid,
  target_value jsonb,
  target_raw_value_text text,
  target_evidence_level text,
  target_confidence text,
  target_observed_at text,
  target_note text,
  target_supersedes_observation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  parsed_observed_at timestamptz := public.fact_parse_application_instant(target_observed_at);
begin
  if target_observed_at is null or parsed_observed_at is null then
    raise exception 'venue fact observation unavailable' using errcode = '22023';
  end if;
  return public.append_venue_fact_observation_timestamp_core(
    target_project_id, target_fact_id, target_value, target_raw_value_text,
    target_evidence_level, target_confidence, parsed_observed_at, target_note,
    target_supersedes_observation_id
  );
end;
$$;
revoke all on function public.append_venue_fact_observation(
  uuid, uuid, jsonb, text, text, text, text, text, uuid
) from public, anon;
grant execute on function public.append_venue_fact_observation(
  uuid, uuid, jsonb, text, text, text, text, text, uuid
) to authenticated;

alter function public.set_venue_fact_freshness(
  uuid, uuid, bigint, timestamptz, timestamptz
) rename to set_venue_fact_freshness_timestamp_core;
revoke all on function public.set_venue_fact_freshness_timestamp_core(
  uuid, uuid, bigint, timestamptz, timestamptz
) from public, anon, authenticated;

create or replace function public.set_venue_fact_freshness(
  target_project_id uuid,
  target_fact_id uuid,
  target_expected_revision bigint,
  target_last_verified_at text,
  target_stale_at text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  parsed_last_verified_at timestamptz := public.fact_parse_application_instant(target_last_verified_at);
  parsed_stale_at timestamptz := public.fact_parse_application_instant(target_stale_at);
begin
  if (target_last_verified_at is not null and parsed_last_verified_at is null)
    or (target_stale_at is not null and parsed_stale_at is null) then
    raise exception 'venue fact freshness unavailable' using errcode = '22023';
  end if;
  return public.set_venue_fact_freshness_timestamp_core(
    target_project_id, target_fact_id, target_expected_revision,
    parsed_last_verified_at, parsed_stale_at
  );
end;
$$;
revoke all on function public.set_venue_fact_freshness(
  uuid, uuid, bigint, text, text
) from public, anon;
grant execute on function public.set_venue_fact_freshness(
  uuid, uuid, bigint, text, text
) to authenticated;
