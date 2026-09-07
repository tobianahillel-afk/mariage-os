create or replace function public.fact_ecmascript_trim(target_value text)
returns text
language sql
immutable
security definer
set search_path = pg_catalog
as $$
  select case
    when target_value is null then null
    else btrim(
      target_value,
      chr(9) || chr(10) || chr(11) || chr(12) || chr(13) || chr(32)
      || chr(160) || chr(5760)
      || chr(8192) || chr(8193) || chr(8194) || chr(8195) || chr(8196)
      || chr(8197) || chr(8198) || chr(8199) || chr(8200) || chr(8201)
      || chr(8202) || chr(8232) || chr(8233) || chr(8239) || chr(8287)
      || chr(12288) || chr(65279)
    )
  end;
$$;

revoke all on function public.fact_ecmascript_trim(text)
from public, anon, authenticated;

alter table public.sources
  add constraint sources_title_ecmascript_canonical_check
  check (
    title is null
    or (
      title = public.fact_ecmascript_trim(title)
      and char_length(title) between 1 and 240
    )
  );

alter table public.facts
  add constraint facts_conflict_resolution_note_nonblank_check
  check (
    not (state = 'conflict' and retained_observation_id is not null)
    or (
      resolution_note is not null
      and public.fact_ecmascript_trim(resolution_note) <> ''
    )
  );

alter function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) rename to create_venue_fact_source_core;

revoke all on function public.create_venue_fact_source_core(
  uuid, text, text, text, text, timestamptz, text, text
) from public, anon, authenticated;

create or replace function public.create_venue_fact_source(
  target_project_id uuid,
  target_source_type text,
  target_title text,
  target_url text,
  target_evidence_level text,
  target_observed_at timestamptz,
  target_notes text,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  return public.create_venue_fact_source_core(
    target_project_id,
    target_source_type,
    case
      when target_title is null then null
      else public.fact_ecmascript_trim(target_title)
    end,
    target_url,
    target_evidence_level,
    target_observed_at,
    target_notes,
    target_status
  );
end;
$$;

revoke all on function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) from public, anon;
grant execute on function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) to authenticated;

alter function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) rename to update_venue_fact_source_core;

revoke all on function public.update_venue_fact_source_core(
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
  target_observed_at timestamptz,
  target_notes text,
  target_status text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  return public.update_venue_fact_source_core(
    target_project_id,
    target_source_id,
    target_expected_revision,
    target_source_type,
    case
      when target_title is null then null
      else public.fact_ecmascript_trim(target_title)
    end,
    target_url,
    target_evidence_level,
    target_observed_at,
    target_notes,
    target_status
  );
end;
$$;

revoke all on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) from public, anon;
grant execute on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) to authenticated;

alter function public.resolve_venue_fact_from_observation(
  uuid, uuid, uuid, bigint, text, text
) rename to resolve_venue_fact_from_observation_core;

revoke all on function public.resolve_venue_fact_from_observation_core(
  uuid, uuid, uuid, bigint, text, text
) from public, anon, authenticated;

create or replace function public.resolve_venue_fact_from_observation(
  target_project_id uuid,
  target_fact_id uuid,
  target_observation_id uuid,
  target_expected_revision bigint,
  target_state text,
  target_resolution_note text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if target_state = 'conflict'
    and (
      target_resolution_note is null
      or public.fact_ecmascript_trim(target_resolution_note) = ''
    ) then
    raise exception 'retained venue fact unavailable' using errcode = '22023';
  end if;

  return public.resolve_venue_fact_from_observation_core(
    target_project_id,
    target_fact_id,
    target_observation_id,
    target_expected_revision,
    target_state,
    target_resolution_note
  );
end;
$$;

revoke all on function public.resolve_venue_fact_from_observation(
  uuid, uuid, uuid, bigint, text, text
) from public, anon;
grant execute on function public.resolve_venue_fact_from_observation(
  uuid, uuid, uuid, bigint, text, text
) to authenticated;
