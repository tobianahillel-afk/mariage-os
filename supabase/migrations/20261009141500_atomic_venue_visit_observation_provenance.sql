-- WP-2.12V: one PostgreSQL transaction for replay-safe visit observation
-- and checked in-person provenance. No R/S/T/U signature is changed.
create function public.append_venue_fact_observation_visit_atomic(
  target_project_id uuid,
  target_fact_id uuid,
  target_observation_id uuid,
  target_value jsonb,
  target_raw_value_text text,
  target_evidence_level text,
  target_confidence text,
  target_observed_at text,
  target_note text,
  target_supersedes_observation_id uuid,
  target_source_id uuid,
  target_expected_source_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  source_row public.sources%rowtype;
  parsed_observed_at timestamptz;
  observation_receipt jsonb;
  link_receipt jsonb;
  superseded_predecessor_id uuid;
begin
  if auth.uid() is null then
    raise exception 'venue visit observation unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue visit observation unavailable' using errcode = '42501';
  end if;

  if target_project_id is null
    or target_fact_id is null
    or target_observation_id is null
    or target_source_id is null
    or target_expected_source_revision is null
    or target_expected_source_revision < 1
    or target_observed_at is null then
    raise exception 'venue visit observation invalid' using errcode = '22023';
  end if;

  parsed_observed_at :=
    public.fact_parse_application_instant(target_observed_at);
  if parsed_observed_at is null then
    raise exception 'venue visit observation invalid' using errcode = '22023';
  end if;

  -- Serialize by the stable observation identity, not by a source row:
  -- concurrent calls may target *different* sources for the same observation.
  -- An absent primary link cannot be protected with a row lock alone.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      'wp212v:' || target_project_id::text || ':' ||
      target_observation_id::text,
      0
    )
  );

  -- This lock is acquired BEFORE invoking the accepted observation append.
  -- It is retained until the entire enclosing RPC transaction commits.
  select * into source_row
  from public.sources s
  where s.project_id = target_project_id
    and s.id = target_source_id
  for update;

  if not found then
    raise exception 'venue visit observation unavailable' using errcode = '42501';
  end if;

  if source_row.source_type <> 'in_person_visit'
    or source_row.revision <> target_expected_source_revision then
    raise exception 'stale venue visit source provenance' using errcode = 'PT412';
  end if;

  -- Do not silently convert a historically committed observation tied to a
  -- different primary source. The transaction-scoped observation advisory
  -- lock serializes this absent-row check against other atomic visit calls.
  perform 1
  from public.observation_sources os
  where os.project_id = target_project_id
    and os.observation_id = target_observation_id
    and os.is_primary
    and os.source_id <> target_source_id
  for update;

  if found then
    raise exception 'venue visit observation provenance conflict'
      using errcode = '23505';
  end if;

  -- Both accepted operations run inside the *same* PostgreSQL transaction.
  -- Any failure in the following checked link rolls back a new append.
  observation_receipt := public.append_venue_fact_observation_replay_core(
    target_project_id,
    target_fact_id,
    target_observation_id,
    target_value,
    target_raw_value_text,
    target_evidence_level,
    target_confidence,
    parsed_observed_at,
    target_note,
    target_supersedes_observation_id
  );

  if observation_receipt ->> 'created_by' is distinct from auth.uid()::text then
    raise exception 'venue visit observation unavailable' using errcode = '42501';
  end if;

  -- A new observation contains only its successor identity. Verify the
  -- predecessor row actually points to this exact observation before the
  -- receipt can claim the requested supersession succeeded.
  select prior.id into superseded_predecessor_id
  from public.fact_observations prior
  where prior.project_id = target_project_id
    and prior.fact_id = target_fact_id
    and prior.superseded_by_observation_id = target_observation_id
    and prior.observation_status = 'superseded'
  for share;

  if superseded_predecessor_id is distinct from
      target_supersedes_observation_id
    or exists (
      select 1 from public.fact_observations other_prior
      where other_prior.project_id = target_project_id
        and other_prior.fact_id = target_fact_id
        and other_prior.superseded_by_observation_id = target_observation_id
        and other_prior.id is distinct from target_supersedes_observation_id
    ) then
    raise exception 'venue visit observation supersession conflict'
      using errcode = '23505';
  end if;

  link_receipt := public.link_venue_fact_observation_source_checked(
    target_project_id,
    target_observation_id,
    target_source_id,
    true,
    'in_person_visit',
    target_expected_source_revision
  );

  if link_receipt ->> 'project_id' is distinct from target_project_id::text
    or link_receipt ->> 'observation_id' is distinct from target_observation_id::text
    or link_receipt ->> 'source_id' is distinct from target_source_id::text
    or link_receipt ->> 'is_primary' is distinct from 'true' then
    raise exception 'venue visit observation provenance invalid'
      using errcode = '23505';
  end if;

  return pg_catalog.jsonb_build_object(
    'observation', observation_receipt || pg_catalog.jsonb_build_object(
      'supersedes_observation_id', superseded_predecessor_id
    ),
    'link', link_receipt,
    'checkedSource', pg_catalog.jsonb_build_object(
      'projectId', target_project_id,
      'sourceId', source_row.id,
      'sourceType', source_row.source_type,
      'checkedRevision', source_row.revision,
      'checkedBy', auth.uid()
    )
  );
end;
$$;

revoke all on function public.append_venue_fact_observation_visit_atomic(
  uuid, uuid, uuid, jsonb, text, text, text, text, text, uuid, uuid, bigint
) from public, anon;

grant execute on function public.append_venue_fact_observation_visit_atomic(
  uuid, uuid, uuid, jsonb, text, text, text, text, text, uuid, uuid, bigint
) to authenticated;

comment on function public.append_venue_fact_observation_visit_atomic(
  uuid, uuid, uuid, jsonb, text, text, text, text, text, uuid, uuid, bigint
) is
  'WP-2.12V single-transaction replay-safe Fact observation and checked in-person source link, with locked source revision/type, PT412 stale conflicts and independent receipt components.';
