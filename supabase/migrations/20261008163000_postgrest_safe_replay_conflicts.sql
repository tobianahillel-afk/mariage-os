-- WP-2.12U
-- PostgREST-safe business/precondition conflict signaling.
--
-- PostgREST 14 may retry RPC transactions that deliberately raise SQLSTATE
-- 40001 because that code means serialization_failure. These three accepted
-- replay boundaries used 40001 for application-level stale/precondition
-- conflicts, not for genuine PostgreSQL serialization failures.
--
-- PT412 maps to HTTP 412 Precondition Failed and is intentionally not in the
-- retry class. Authorization, replay identity, function signatures, grants,
-- receipt semantics and all non-conflict SQLSTATEs remain unchanged.

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
      raise exception 'venue fact observation unavailable' using errcode = 'PT412';
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
      raise exception 'venue fact observation unavailable' using errcode = 'PT412';
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

create or replace function public.set_venue_member_rating(
  target_project_id uuid,
  target_venue_id uuid,
  target_dimension_key text,
  target_rating numeric,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $
declare
  current_row public.member_ratings%rowtype;
  saved_row public.member_ratings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  if target_dimension_key not in (
      'love_score',
      'interior_aesthetic_score_personal',
      'exterior_aesthetic_score_personal',
      'logistics_score_personal',
      'value_for_money_score_personal'
    )
    or target_rating is null
    or target_rating < 0
    or target_rating > 10
    or target_rating <> round(target_rating, 2)
    or target_expected_revision is null
    or target_expected_revision < 0 then
    raise exception 'venue rating unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  select * into current_row
  from public.member_ratings mr
  where mr.project_id = target_project_id
    and mr.user_id = auth.uid()
    and mr.target_type = 'venue'
    and mr.target_id = target_venue_id
    and mr.dimension_key = target_dimension_key
  for update;

  if found then
    if current_row.revision <> target_expected_revision then
      raise exception 'venue rating unavailable' using errcode = 'PT412';
    end if;

    update public.member_ratings
    set rating = target_rating
    where id = current_row.id
    returning * into saved_row;
  else
    if target_expected_revision <> 0 then
      raise exception 'venue rating unavailable' using errcode = 'PT412';
    end if;

    insert into public.member_ratings (
      project_id,
      user_id,
      target_type,
      target_id,
      dimension_key,
      rating
    )
    values (
      target_project_id,
      auth.uid(),
      'venue',
      target_venue_id,
      target_dimension_key,
      target_rating
    )
    returning * into saved_row;
  end if;

  if not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'user_id', saved_row.user_id,
    'target_type', saved_row.target_type,
    'target_id', saved_row.target_id,
    'dimension_key', saved_row.dimension_key,
    'rating', saved_row.rating,
    'revision', saved_row.revision
  );
end;
$;

create or replace function public.set_venue_member_rating(
  target_project_id uuid,
  target_venue_id uuid,
  target_dimension_key text,
  target_rating numeric,
  target_expected_revision bigint,
  target_operation_id uuid,
  target_device_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.member_ratings%rowtype;
  saved_row public.member_ratings%rowtype;
  receipt_row public.sync_mutation_receipts%rowtype;
  receipt_created integer;
begin
  if auth.uid() is null
    or target_operation_id is null
    or target_device_id is null then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  if target_dimension_key not in (
      'love_score',
      'interior_aesthetic_score_personal',
      'exterior_aesthetic_score_personal',
      'logistics_score_personal',
      'value_for_money_score_personal'
    )
    or target_rating is null
    or target_rating < 0
    or target_rating > 10
    or target_rating <> round(target_rating, 2)
    or target_expected_revision is null
    or target_expected_revision < 0 then
    raise exception 'venue rating unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  insert into public.sync_mutation_receipts (
    operation_id,
    project_id,
    user_id,
    device_id,
    entity_type,
    entity_id
  )
  values (
    target_operation_id,
    target_project_id,
    auth.uid(),
    target_device_id,
    'venue_member_rating',
    null
  )
  on conflict (operation_id) do nothing;
  get diagnostics receipt_created = row_count;

  if receipt_created = 0 then
    select * into receipt_row
    from public.sync_mutation_receipts
    where operation_id = target_operation_id;

    if not found
      or receipt_row.project_id <> target_project_id
      or receipt_row.user_id <> auth.uid()
      or receipt_row.device_id is distinct from target_device_id
      or receipt_row.entity_type <> 'venue_member_rating'
      or receipt_row.entity_id is null
      or receipt_row.result_revision is null then
      raise exception 'venue rating unavailable' using errcode = '22023';
    end if;

    select * into current_row
    from public.member_ratings mr
    where mr.project_id = target_project_id
      and mr.user_id = auth.uid()
      and mr.target_type = 'venue'
      and mr.id = receipt_row.entity_id;

    if not found then
      raise exception 'venue rating conflict' using errcode = 'PT412';
    end if;

    if current_row.revision <> receipt_row.result_revision then
      raise exception 'venue rating conflict' using errcode = 'PT412';
    end if;

    if current_row.target_id is distinct from target_venue_id
      or current_row.dimension_key is distinct from target_dimension_key
      or current_row.rating is distinct from target_rating
      or receipt_row.result_revision <> target_expected_revision + 1 then
      raise exception 'venue rating unavailable' using errcode = '22023';
    end if;

    if not public.has_project_permission(target_project_id, 'venues.read') then
      raise exception 'venue rating unavailable' using errcode = '42501';
    end if;

    return jsonb_build_object(
      'id', current_row.id,
      'project_id', current_row.project_id,
      'user_id', current_row.user_id,
      'target_type', current_row.target_type,
      'target_id', current_row.target_id,
      'dimension_key', current_row.dimension_key,
      'rating', current_row.rating,
      'revision', current_row.revision
    );
  end if;

  select * into current_row
  from public.member_ratings mr
  where mr.project_id = target_project_id
    and mr.user_id = auth.uid()
    and mr.target_type = 'venue'
    and mr.target_id = target_venue_id
    and mr.dimension_key = target_dimension_key
  for update;

  if found then
    if current_row.revision <> target_expected_revision then
      raise exception 'venue rating unavailable' using errcode = 'PT412';
    end if;

    update public.member_ratings
    set rating = target_rating
    where id = current_row.id
    returning * into saved_row;
  else
    if target_expected_revision <> 0 then
      raise exception 'venue rating unavailable' using errcode = 'PT412';
    end if;

    insert into public.member_ratings (
      project_id,
      user_id,
      target_type,
      target_id,
      dimension_key,
      rating
    )
    values (
      target_project_id,
      auth.uid(),
      'venue',
      target_venue_id,
      target_dimension_key,
      target_rating
    )
    returning * into saved_row;
  end if;

  if not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  update public.sync_mutation_receipts
  set entity_id = saved_row.id,
      result_revision = saved_row.revision
  where operation_id = target_operation_id;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'user_id', saved_row.user_id,
    'target_type', saved_row.target_type,
    'target_id', saved_row.target_id,
    'dimension_key', saved_row.dimension_key,
    'rating', saved_row.rating,
    'revision', saved_row.revision
  );
end;
$$;

create or replace function public.link_venue_fact_observation_source_checked(
  target_project_id uuid,
  target_observation_id uuid,
  target_source_id uuid,
  target_is_primary boolean,
  target_expected_source_type text,
  target_expected_source_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  source_row public.sources%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  if target_is_primary is null
    or target_expected_source_type is null
    or target_expected_source_type <> 'in_person_visit'
    or target_expected_source_revision is null
    or target_expected_source_revision < 1 then
    raise exception 'venue fact evidence link unavailable' using errcode = '22023';
  end if;

  select *
  into source_row
  from public.sources s
  where s.project_id = target_project_id
    and s.id = target_source_id
  for update;

  if not found then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  if source_row.source_type <> target_expected_source_type
    or source_row.revision <> target_expected_source_revision then
    raise exception 'stale venue fact evidence source provenance'
      using errcode = 'PT412';
  end if;

  return public.link_venue_fact_observation_source(
    target_project_id,
    target_observation_id,
    target_source_id,
    target_is_primary
  );
end;
$$;

comment on function public.append_venue_fact_observation_replay_core(
  uuid, uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) is
  'Internal replay-safe Venue Fact observation core. Application-level stale supersession preconditions use PT412; genuine database serialization failures remain 40001.';

comment on function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint
) is
  'Legacy self-authored Venue rating compatibility command. Application-level stale revision preconditions use PT412 so retained PostgREST callers do not enter serialization retry loops.';

comment on function public.set_venue_member_rating(
  uuid, uuid, text, numeric, bigint, uuid, uuid
) is
  'Receipt-aware self-authored Venue rating command with stable operation/device identity. Application-level stale replay/revision preconditions use PT412; genuine database serialization failures remain 40001.';

comment on function public.link_venue_fact_observation_source_checked(
  uuid, uuid, uuid, boolean, text, bigint
) is
  'Atomic checked in-person Venue Fact provenance link. Stale source type/revision preconditions use PT412; genuine database serialization failures remain 40001.';
