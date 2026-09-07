create table public.sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (
    source_type in (
      'contract', 'written_confirmation', 'quote', 'official_website',
      'phone_call_note', 'in_person_visit', 'specialized_directory',
      'public_third_party', 'user_estimate',
      'import_without_primary_source', 'other'
    )
  ),
  title text null check (
    title is null or char_length(btrim(title)) between 1 and 240
  ),
  url text null check (
    url is null or public.fact_url_valid(to_jsonb(url))
  ),
  evidence_level text not null check (
    evidence_level in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
  ),
  observed_at timestamptz null,
  notes text null check (notes is null or char_length(notes) <= 5000),
  status text not null check (
    status in (
      'active', 'broken', 'replaced', 'superseded', 'contradictory', 'archived'
    )
  ),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id)
);

create index sources_project_status_idx
  on public.sources (project_id, status, source_type);

create table public.fact_observations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  fact_id uuid not null,
  value jsonb null,
  raw_value_text text null check (
    raw_value_text is null or char_length(raw_value_text) <= 5000
  ),
  evidence_level text not null check (
    evidence_level in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
  ),
  confidence text not null check (confidence in ('high', 'medium', 'low', 'unknown')),
  observation_status text not null default 'active' check (
    observation_status in ('active', 'superseded', 'withdrawn')
  ),
  superseded_by_observation_id uuid null,
  observed_at timestamptz not null,
  import_id uuid null,
  note text null check (note is null or char_length(note) <= 5000),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  unique (project_id, id),
  foreign key (project_id, fact_id)
    references public.facts(project_id, id)
    on delete cascade,
  foreign key (project_id, superseded_by_observation_id)
    references public.fact_observations(project_id, id)
    on delete restrict,
  check (superseded_by_observation_id is null or superseded_by_observation_id <> id),
  check (
    (observation_status = 'superseded' and superseded_by_observation_id is not null)
    or (observation_status <> 'superseded' and superseded_by_observation_id is null)
  )
);

create index fact_observations_fact_idx
  on public.fact_observations (project_id, fact_id, observation_status, observed_at desc);

create table public.observation_sources (
  project_id uuid not null references public.projects(id) on delete cascade,
  observation_id uuid not null,
  source_id uuid not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (project_id, observation_id, source_id),
  foreign key (project_id, observation_id)
    references public.fact_observations(project_id, id)
    on delete cascade,
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on delete restrict
);

create index observation_sources_source_idx
  on public.observation_sources (project_id, source_id, observation_id);

alter table public.facts
  add constraint facts_retained_observation_same_project_fk
  foreign key (project_id, retained_observation_id)
  references public.fact_observations(project_id, id)
  on delete restrict;

create or replace function public.validate_fact_observation_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  fact_row public.facts%rowtype;
  definition_row public.fact_definitions%rowtype;
  replacement_row public.fact_observations%rowtype;
begin
  select * into fact_row
  from public.facts f
  where f.project_id = new.project_id
    and f.id = new.fact_id;

  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '23514';
  end if;

  select * into definition_row
  from public.fact_definitions fd
  where fd.project_id = fact_row.project_id
    and fd.id = fact_row.definition_id;

  if not found
    or (new.value is not null and not public.fact_value_valid(
      definition_row.value_type,
      definition_row.options_json,
      new.value
    )) then
    raise exception 'venue fact observation unavailable' using errcode = '23514';
  end if;

  if new.superseded_by_observation_id is not null then
    select * into replacement_row
    from public.fact_observations observation_row
    where observation_row.project_id = new.project_id
      and observation_row.id = new.superseded_by_observation_id;

    if not found or replacement_row.fact_id <> new.fact_id then
      raise exception 'venue fact observation unavailable' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' and (
    new.project_id is distinct from old.project_id
    or new.fact_id is distinct from old.fact_id
    or new.value is distinct from old.value
    or new.raw_value_text is distinct from old.raw_value_text
    or new.evidence_level is distinct from old.evidence_level
    or new.confidence is distinct from old.confidence
    or new.observed_at is distinct from old.observed_at
    or new.import_id is distinct from old.import_id
    or new.note is distinct from old.note
    or new.created_at is distinct from old.created_at
    or new.created_by is distinct from old.created_by
  ) then
    raise exception 'venue fact observations are append-only' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_fact_observation_row()
from public, anon, authenticated;

create trigger fact_observations_validate
before insert or update on public.fact_observations
for each row execute function public.validate_fact_observation_row();

create or replace function public.validate_retained_fact_row()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  definition_row public.fact_definitions%rowtype;
  observation_row public.fact_observations%rowtype;
begin
  select * into definition_row
  from public.fact_definitions fd
  where fd.project_id = new.project_id
    and fd.id = new.definition_id;

  if not found
    or new.target_type <> 'venue'
    or definition_row.entity_type <> new.target_type
    or not exists (
      select 1 from public.venues v
      where v.project_id = new.project_id and v.id = new.target_id
    ) then
    raise exception 'retained venue fact unavailable' using errcode = '23514';
  end if;

  if new.retained_observation_id is null then
    if new.resolution_note is not null
      or new.resolved_by is not null
      or new.resolved_at is not null
      or not public.retained_fact_value_valid(
        definition_row.value_type,
        definition_row.options_json,
        new.state,
        new.retained_value
      ) then
      raise exception 'retained venue fact unavailable' using errcode = '23514';
    end if;
  else
    select * into observation_row
    from public.fact_observations observation_candidate
    where observation_candidate.project_id = new.project_id
      and observation_candidate.id = new.retained_observation_id
      and observation_candidate.fact_id = new.id;

    if not found
      or new.state not in ('known', 'conflict')
      or observation_row.value is null
      or new.retained_value is distinct from observation_row.value
      or not public.fact_value_valid(
        definition_row.value_type,
        definition_row.options_json,
        new.retained_value
      )
      or new.resolved_by is null
      or new.resolved_at is null
      or (
        new.state = 'conflict'
        and (new.resolution_note is null or char_length(btrim(new.resolution_note)) = 0)
      ) then
      raise exception 'retained venue fact unavailable' using errcode = '23514';
    end if;
  end if;

  if new.stale_at is not null
    and (new.last_verified_at is null or new.stale_at < new.last_verified_at) then
    raise exception 'retained venue fact freshness unavailable' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_retained_fact_row()
from public, anon, authenticated;

alter table public.sources enable row level security;
alter table public.fact_observations enable row level security;
alter table public.observation_sources enable row level security;

revoke all on table public.sources from public, anon, authenticated;
revoke all on table public.fact_observations from public, anon, authenticated;
revoke all on table public.observation_sources from public, anon, authenticated;

grant select on table public.sources to authenticated;
grant select on table public.fact_observations to authenticated;
grant select on table public.observation_sources to authenticated;

create policy sources_select_authorized
on public.sources for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create policy fact_observations_select_authorized
on public.fact_observations for select to authenticated
using (
  exists (
    select 1 from public.facts f
    where f.project_id = fact_observations.project_id
      and f.id = fact_observations.fact_id
      and f.target_type = 'venue'
      and public.has_project_permission(f.project_id, 'venues.read')
  )
);

create policy observation_sources_select_authorized
on public.observation_sources for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

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
declare
  saved_row public.sources%rowtype;
  normalized_title text := nullif(btrim(target_title), '');
begin
  if auth.uid() is null then
    raise exception 'venue fact source unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact source unavailable' using errcode = '42501';
  end if;

  if target_source_type not in (
      'contract', 'written_confirmation', 'quote', 'official_website',
      'phone_call_note', 'in_person_visit', 'specialized_directory',
      'public_third_party', 'user_estimate',
      'import_without_primary_source', 'other'
    )
    or (target_title is not null and normalized_title is null)
    or (normalized_title is not null and char_length(normalized_title) > 240)
    or (target_url is not null and not public.fact_url_valid(to_jsonb(target_url)))
    or target_evidence_level not in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
    or (target_notes is not null and char_length(target_notes) > 5000)
    or target_status not in (
      'active', 'broken', 'replaced', 'superseded', 'contradictory', 'archived'
    ) then
    raise exception 'venue fact source unavailable' using errcode = '22023';
  end if;

  insert into public.sources (
    project_id, source_type, title, url, evidence_level, observed_at,
    notes, status, created_by, updated_by
  ) values (
    target_project_id, target_source_type, normalized_title, target_url,
    target_evidence_level, target_observed_at, target_notes, target_status,
    auth.uid(), auth.uid()
  ) returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) from public, anon;
grant execute on function public.create_venue_fact_source(
  uuid, text, text, text, text, timestamptz, text, text
) to authenticated;

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
declare
  current_row public.sources%rowtype;
  saved_row public.sources%rowtype;
  normalized_title text := nullif(btrim(target_title), '');
begin
  if auth.uid() is null then
    raise exception 'venue fact source unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact source unavailable' using errcode = '42501';
  end if;

  select * into current_row from public.sources s
  where s.project_id = target_project_id and s.id = target_source_id
  for update;

  if not found then
    raise exception 'venue fact source unavailable' using errcode = '42501';
  end if;
  if target_expected_revision is null
    or target_expected_revision < 1
    or current_row.revision <> target_expected_revision then
    raise exception 'stale venue fact source' using errcode = '40001';
  end if;

  if target_source_type not in (
      'contract', 'written_confirmation', 'quote', 'official_website',
      'phone_call_note', 'in_person_visit', 'specialized_directory',
      'public_third_party', 'user_estimate',
      'import_without_primary_source', 'other'
    )
    or (target_title is not null and normalized_title is null)
    or (normalized_title is not null and char_length(normalized_title) > 240)
    or (target_url is not null and not public.fact_url_valid(to_jsonb(target_url)))
    or target_evidence_level not in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
    or (target_notes is not null and char_length(target_notes) > 5000)
    or target_status not in (
      'active', 'broken', 'replaced', 'superseded', 'contradictory', 'archived'
    ) then
    raise exception 'venue fact source unavailable' using errcode = '22023';
  end if;

  update public.sources
  set source_type = target_source_type,
      title = normalized_title,
      url = target_url,
      evidence_level = target_evidence_level,
      observed_at = target_observed_at,
      notes = target_notes,
      status = target_status,
      updated_at = now(),
      updated_by = auth.uid(),
      revision = current_row.revision + 1
  where project_id = target_project_id and id = target_source_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) from public, anon;
grant execute on function public.update_venue_fact_source(
  uuid, uuid, bigint, text, text, text, text, timestamptz, text, text
) to authenticated;

create or replace function public.append_venue_fact_observation(
  target_project_id uuid,
  target_fact_id uuid,
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
  saved_row public.fact_observations%rowtype;
  canonical_value jsonb := target_value;
begin
  if auth.uid() is null then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  select * into fact_row from public.facts f
  where f.project_id = target_project_id
    and f.id = target_fact_id
    and f.target_type = 'venue'
  for share;
  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  select * into definition_row from public.fact_definitions fd
  where fd.project_id = target_project_id and fd.id = fact_row.definition_id
  for share;
  if not found then
    raise exception 'venue fact observation unavailable' using errcode = '42501';
  end if;

  if canonical_value is not null and definition_row.value_type = 'multiselect' then
    canonical_value := public.fact_multiselect_canonical_value(
      canonical_value,
      definition_row.options_json
    );
    if canonical_value is null then
      raise exception 'venue fact observation unavailable' using errcode = '22023';
    end if;
  end if;

  if (canonical_value is not null and not public.fact_value_valid(
      definition_row.value_type, definition_row.options_json, canonical_value
    ))
    or (target_raw_value_text is not null and char_length(target_raw_value_text) > 5000)
    or target_evidence_level not in (
      'contractual', 'confirmed_for_event', 'official_general', 'observed',
      'third_party', 'estimated', 'unknown_source'
    )
    or target_confidence not in ('high', 'medium', 'low', 'unknown')
    or target_observed_at is null
    or (target_note is not null and char_length(target_note) > 5000) then
    raise exception 'venue fact observation unavailable' using errcode = '22023';
  end if;

  if target_supersedes_observation_id is not null then
    select * into superseded_row from public.fact_observations observation_row
    where observation_row.project_id = target_project_id
      and observation_row.id = target_supersedes_observation_id
      and observation_row.fact_id = target_fact_id
    for update;

    if not found
      or superseded_row.observation_status <> 'active'
      or superseded_row.superseded_by_observation_id is not null then
      raise exception 'venue fact observation unavailable' using errcode = '40001';
    end if;
  end if;

  insert into public.fact_observations (
    project_id, fact_id, value, raw_value_text, evidence_level, confidence,
    observation_status, observed_at, note, created_by
  ) values (
    target_project_id, target_fact_id, canonical_value, target_raw_value_text,
    target_evidence_level, target_confidence, 'active', target_observed_at,
    target_note, auth.uid()
  ) returning * into saved_row;

  if target_supersedes_observation_id is not null then
    update public.fact_observations
    set observation_status = 'superseded',
        superseded_by_observation_id = saved_row.id
    where project_id = target_project_id
      and id = target_supersedes_observation_id;
  end if;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.append_venue_fact_observation(
  uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) from public, anon;
grant execute on function public.append_venue_fact_observation(
  uuid, uuid, jsonb, text, text, text, timestamptz, text, uuid
) to authenticated;

create or replace function public.link_venue_fact_observation_source(
  target_project_id uuid,
  target_observation_id uuid,
  target_source_id uuid,
  target_is_primary boolean
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  saved_row public.observation_sources%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.fact_observations observation_row
  join public.facts f
    on f.project_id = observation_row.project_id and f.id = observation_row.fact_id
  where observation_row.project_id = target_project_id
    and observation_row.id = target_observation_id
    and f.target_type = 'venue';
  if not found or not exists (
    select 1 from public.sources s
    where s.project_id = target_project_id and s.id = target_source_id
  ) then
    raise exception 'venue fact evidence link unavailable' using errcode = '42501';
  end if;

  insert into public.observation_sources (
    project_id, observation_id, source_id, is_primary
  ) values (
    target_project_id, target_observation_id, target_source_id,
    coalesce(target_is_primary, false)
  )
  on conflict (project_id, observation_id, source_id)
  do update set is_primary = excluded.is_primary
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.link_venue_fact_observation_source(
  uuid, uuid, uuid, boolean
) from public, anon;
grant execute on function public.link_venue_fact_observation_source(
  uuid, uuid, uuid, boolean
) to authenticated;

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
declare
  current_row public.facts%rowtype;
  observation_row public.fact_observations%rowtype;
  definition_row public.fact_definitions%rowtype;
  saved_row public.facts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  perform 1 from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  select * into current_row from public.facts f
  where f.project_id = target_project_id
    and f.id = target_fact_id
    and f.target_type = 'venue'
  for update;
  if not found then
    raise exception 'retained venue fact unavailable' using errcode = '42501';
  end if;

  if target_expected_revision is null
    or target_expected_revision < 1
    or current_row.revision <> target_expected_revision then
    raise exception 'stale retained venue fact' using errcode = '40001';
  end if;

  if target_state not in ('known', 'conflict')
    or (target_resolution_note is not null and char_length(target_resolution_note) > 5000)
    or (
      target_state = 'conflict'
      and (target_resolution_note is null or char_length(btrim(target_resolution_note)) = 0)
    ) then
    raise exception 'retained venue fact unavailable' using errcode = '22023';
  end if;

  select * into observation_row from public.fact_observations observation_candidate
  where observation_candidate.project_id = target_project_id
    and observation_candidate.id = target_observation_id
    and observation_candidate.fact_id = target_fact_id
    and observation_candidate.observation_status = 'active'
  for share;
  if not found or observation_row.value is null then
    raise exception 'retained venue fact unavailable' using errcode = '22023';
  end if;

  select * into definition_row from public.fact_definitions fd
  where fd.project_id = target_project_id and fd.id = current_row.definition_id;
  if not found or not public.fact_value_valid(
    definition_row.value_type,
    definition_row.options_json,
    observation_row.value
  ) then
    raise exception 'retained venue fact unavailable' using errcode = '22023';
  end if;

  update public.facts
  set state = target_state,
      retained_value = observation_row.value,
      retained_observation_id = observation_row.id,
      resolution_note = target_resolution_note,
      resolved_by = auth.uid(),
      resolved_at = now()
  where project_id = target_project_id and id = target_fact_id
  returning * into saved_row;

  return to_jsonb(saved_row);
end;
$$;

revoke all on function public.resolve_venue_fact_from_observation(
  uuid, uuid, uuid, bigint, text, text
) from public, anon;
grant execute on function public.resolve_venue_fact_from_observation(
  uuid, uuid, uuid, bigint, text, text
) to authenticated;
