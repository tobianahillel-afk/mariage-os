-- WP-2.12R remediation: reject NULL replay metadata and compare replay
-- intent with NULL-safe semantics.
--
-- Forward-only follow-up to 20261005094000. The earlier migration remains
-- immutable; this replaces only the internal replay core while preserving the
-- authenticated wrapper signature and privilege boundary.

create or replace function public.append_venue_fact_observation_replay_core(
  target_project_id uuid,
  target_fact_id uuid,
  target_observation_id uuid,
  target_value jsonb,
  target_raw_value_text text,
  target_evidence_level text,
  target_confidence text,
  target_observed_at timestamptz,
  target_note text,
  target_supersedes_observation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  fact_row public.facts%rowtype;
  definition_row public.fact_definitions%rowtype;
  superseded_row public.fact_observations%rowtype;
  existing_row public.fact_observations%rowtype;
  saved_row public.fact_observations%rowtype;
  canonical_value jsonb := target_value;
begin
  if auth.uid() is null then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  if target_observation_id is null then
    raise exception 'venue fact observation unavailable' using errcode = '22023';
  end if;

  select * into fact_row
  from public.facts f
  where f.project_id = target_project_id
    and f.id = target_fact_id
    and f.target_type = 'venue'
  for share;

  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  select * into definition_row
  from public.fact_definitions fd
  where fd.project_id = target_project_id
    and fd.id = fact_row.definition_id
  for share;

  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  if canonical_value is not null
    and definition_row.value_type = 'multiselect' then
    canonical_value := public.fact_multiselect_canonical_value(
      canonical_value,
      definition_row.options_json
    );
    if canonical_value is null then
      raise exception 'venue fact observation unavailable' using errcode = '22023';
    end if;
  end if;

  if (
      canonical_value is not null
      and not public.fact_value_valid(
        definition_row.value_type,
        definition_row.options_json,
        canonical_value
      )
    )
    or (
      target_raw_value_text is not null
      and char_length(target_raw_value_text) > 5000
    )
    or target_evidence_level is null
    or target_evidence_level not in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
    or target_confidence is null
    or target_confidence not in ('high', 'medium', 'low', 'unknown')
    or target_observed_at is null
    or (target_note is not null and char_length(target_note) > 5000) then
    raise exception 'venue fact observation unavailable' using errcode = '22023';
  end if;

  select * into existing_row
  from public.fact_observations observation_row
  where observation_row.id = target_observation_id;

  if found then
    if existing_row.project_id <> target_project_id then
      raise exception 'venue fact observation unavailable' using errcode = '42501';
    end if;

    if existing_row.fact_id <> target_fact_id
      or existing_row.value is distinct from canonical_value
      or existing_row.raw_value_text is distinct from target_raw_value_text
      or existing_row.evidence_level is distinct from target_evidence_level
      or existing_row.confidence is distinct from target_confidence
      or existing_row.observed_at <> target_observed_at
      or existing_row.note is distinct from target_note then
      raise exception 'venue fact observation conflict' using errcode = '23505';
    end if;

    if target_supersedes_observation_id is null then
      if exists (
        select 1
        from public.fact_observations prior
        where prior.project_id = target_project_id
          and prior.fact_id = target_fact_id
          and prior.superseded_by_observation_id = target_observation_id
      ) then
        raise exception 'venue fact observation conflict' using errcode = '23505';
      end if;
    else
      select * into superseded_row
      from public.fact_observations prior
      where prior.project_id = target_project_id
        and prior.id = target_supersedes_observation_id
        and prior.fact_id = target_fact_id;

      if not found
        or superseded_row.observation_status <> 'superseded'
        or superseded_row.superseded_by_observation_id <> target_observation_id then
        raise exception 'venue fact observation conflict' using errcode = '23505';
      end if;
    end if;

    return to_jsonb(existing_row);
  end if;

  if target_supersedes_observation_id is not null then
    select * into superseded_row
    from public.fact_observations prior
    where prior.project_id = target_project_id
      and prior.id = target_supersedes_observation_id
      and prior.fact_id = target_fact_id
    for update;

    if not found then
      raise exception 'venue fact observation unavailable' using errcode = '40001';
    end if;

    if superseded_row.observation_status = 'superseded'
      and superseded_row.superseded_by_observation_id = target_observation_id then
      select * into existing_row
      from public.fact_observations observation_row
      where observation_row.id = target_observation_id;

      if not found
        or existing_row.project_id <> target_project_id
        or existing_row.fact_id <> target_fact_id
        or existing_row.value is distinct from canonical_value
        or existing_row.raw_value_text is distinct from target_raw_value_text
        or existing_row.evidence_level is distinct from target_evidence_level
        or existing_row.confidence is distinct from target_confidence
        or existing_row.observed_at <> target_observed_at
        or existing_row.note is distinct from target_note then
        raise exception 'venue fact observation conflict' using errcode = '23505';
      end if;

      return to_jsonb(existing_row);
    end if;

    if superseded_row.observation_status <> 'active'
      or superseded_row.superseded_by_observation_id is not null then
      raise exception 'venue fact observation unavailable' using errcode = '40001';
    end if;
  end if;

  insert into public.fact_observations (
    id,
    project_id,
    fact_id,
    value,
    raw_value_text,
    evidence_level,
    confidence,
    observation_status,
    observed_at,
    note,
    created_by
  ) values (
    target_observation_id,
    target_project_id,
    target_fact_id,
    canonical_value,
    target_raw_value_text,
    target_evidence_level,
    target_confidence,
    'active',
    target_observed_at,
    target_note,
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_row;

  if not found then
    select * into existing_row
    from public.fact_observations observation_row
    where observation_row.id = target_observation_id;

    if not found or existing_row.project_id <> target_project_id then
      raise exception 'venue fact observation unavailable' using errcode = '42501';
    end if;

    if existing_row.fact_id <> target_fact_id
      or existing_row.value is distinct from canonical_value
      or existing_row.raw_value_text is distinct from target_raw_value_text
      or existing_row.evidence_level is distinct from target_evidence_level
      or existing_row.confidence is distinct from target_confidence
      or existing_row.observed_at <> target_observed_at
      or existing_row.note is distinct from target_note then
      raise exception 'venue fact observation conflict' using errcode = '23505';
    end if;

    if target_supersedes_observation_id is null then
      if exists (
        select 1
        from public.fact_observations prior
        where prior.project_id = target_project_id
          and prior.fact_id = target_fact_id
          and prior.superseded_by_observation_id = target_observation_id
      ) then
        raise exception 'venue fact observation conflict' using errcode = '23505';
      end if;
    else
      select * into superseded_row
      from public.fact_observations prior
      where prior.project_id = target_project_id
        and prior.id = target_supersedes_observation_id
        and prior.fact_id = target_fact_id;

      if not found
        or superseded_row.observation_status <> 'superseded'
        or superseded_row.superseded_by_observation_id <> target_observation_id then
        raise exception 'venue fact observation conflict' using errcode = '23505';
      end if;
    end if;

    return to_jsonb(existing_row);
  end if;

  if target_supersedes_observation_id is not null then
    update public.fact_observations
    set observation_status = 'superseded',
        superseded_by_observation_id = target_observation_id
    where project_id = target_project_id
      and id = target_supersedes_observation_id;
  end if;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.append_venue_fact_observation_replay_core(
  uuid, uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) from public, anon, authenticated;
