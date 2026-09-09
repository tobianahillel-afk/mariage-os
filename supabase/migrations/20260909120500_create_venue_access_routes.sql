create table public.venue_access_routes (
  id uuid primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  venue_id uuid not null,
  reference_origin_id uuid null,
  route_type text not null check (
    route_type in (
      'reference_to_venue',
      'reference_to_tgv_station',
      'tgv_station_to_venue',
      'airport_to_venue',
      'custom'
    )
  ),
  origin_label text null check (
    origin_label is null
    or (
      origin_label = public.fact_ecmascript_trim(origin_label)
      and char_length(origin_label) between 1 and 500
    )
  ),
  destination_label text null check (
    destination_label is null
    or (
      destination_label = public.fact_ecmascript_trim(destination_label)
      and char_length(destination_label) between 1 and 500
    )
  ),
  mode text not null check (
    mode in (
      'car',
      'train',
      'public_transport',
      'taxi_vtc',
      'shuttle',
      'coach',
      'walk',
      'mixed',
      'other'
    )
  ),
  duration_minutes integer null check (duration_minutes >= 0),
  distance_meters integer null check (distance_meters >= 0),
  transfers_count integer null check (transfers_count >= 0),
  observed_at timestamptz not null check (
    public.fact_instant_in_application_domain(observed_at)
  ),
  source_id uuid null,
  notes text null check (
    notes is null
    or (
      notes = public.fact_ecmascript_trim(notes)
      and char_length(notes) between 1 and 5000
    )
  ),
  reference_origin_address_snapshot text null check (
    reference_origin_address_snapshot is null
    or char_length(reference_origin_address_snapshot) between 1 and 500
  ),
  reference_origin_latitude_snapshot numeric(9, 6) null check (
    reference_origin_latitude_snapshot between -90 and 90
  ),
  reference_origin_longitude_snapshot numeric(9, 6) null check (
    reference_origin_longitude_snapshot between -180 and 180
  ),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision = 1),
  unique (project_id, id),
  foreign key (project_id, venue_id)
    references public.venues(project_id, id)
    on update restrict
    on delete cascade,
  foreign key (project_id, reference_origin_id)
    references public.project_reference_origins(project_id, id)
    on update restrict
    on delete no action,
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on update restrict
    on delete restrict,
  constraint venue_access_routes_reference_snapshot_consistency check (
    reference_origin_id is not null
    or (
      reference_origin_address_snapshot is null
      and reference_origin_latitude_snapshot is null
      and reference_origin_longitude_snapshot is null
    )
  ),
  constraint venue_access_routes_snapshot_coordinate_pair check (
    (reference_origin_latitude_snapshot is null)
    = (reference_origin_longitude_snapshot is null)
  )
);

create index venue_access_routes_history_idx
  on public.venue_access_routes (
    project_id,
    venue_id,
    observed_at desc,
    created_at desc,
    id asc
  );

create index venue_access_routes_summary_idx
  on public.venue_access_routes (
    project_id,
    venue_id,
    reference_origin_id,
    route_type,
    mode,
    observed_at desc,
    created_at desc,
    id asc
  );

create or replace function public.protect_venue_access_route_immutable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception 'venue access route is immutable' using errcode = '23514';
end;
$$;

revoke all on function public.protect_venue_access_route_immutable()
from public, anon, authenticated;

create trigger venue_access_routes_protect_update
before update on public.venue_access_routes
for each row execute function public.protect_venue_access_route_immutable();

create trigger venue_access_routes_protect_delete
before delete on public.venue_access_routes
for each row execute function public.protect_venue_access_route_immutable();

alter table public.venue_access_routes enable row level security;

revoke all on table public.venue_access_routes from public, anon, authenticated;
grant select on table public.venue_access_routes to authenticated;

create policy venue_access_routes_select_authorized
on public.venue_access_routes for select to authenticated
using (public.has_project_permission(project_id, 'access.read'));

create or replace function public.venue_access_route_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'venue access route unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'access.write') then
    raise exception 'venue access route unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_access_route_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.append_venue_access_route(
  target_project_id uuid,
  target_venue_id uuid,
  target_route_id uuid,
  target_reference_origin_id uuid,
  target_route_type text,
  target_origin_label text,
  target_destination_label text,
  target_mode text,
  target_duration_minutes integer,
  target_distance_meters integer,
  target_transfers_count integer,
  target_observed_at text,
  target_source_id uuid,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  normalized_origin_label text;
  normalized_destination_label text;
  normalized_notes text;
  parsed_observed_at timestamptz;
  current_origin public.project_reference_origins%rowtype;
  existing_row public.venue_access_routes%rowtype;
  saved_row public.venue_access_routes%rowtype;
begin
  perform public.venue_access_route_assert_writer(target_project_id);

  normalized_origin_label := nullif(
    public.fact_ecmascript_trim(target_origin_label),
    ''
  );
  normalized_destination_label := nullif(
    public.fact_ecmascript_trim(target_destination_label),
    ''
  );
  normalized_notes := nullif(public.fact_ecmascript_trim(target_notes), '');
  parsed_observed_at := public.fact_parse_application_instant(target_observed_at);

  if target_venue_id is null
    or target_route_id is null
    or target_route_type is null
    or target_route_type not in (
      'reference_to_venue',
      'reference_to_tgv_station',
      'tgv_station_to_venue',
      'airport_to_venue',
      'custom'
    )
    or target_mode is null
    or target_mode not in (
      'car',
      'train',
      'public_transport',
      'taxi_vtc',
      'shuttle',
      'coach',
      'walk',
      'mixed',
      'other'
    )
    or parsed_observed_at is null
    or target_duration_minutes < 0
    or target_distance_meters < 0
    or target_transfers_count < 0
    or (normalized_origin_label is not null and char_length(normalized_origin_label) > 500)
    or (normalized_destination_label is not null and char_length(normalized_destination_label) > 500)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000)
    or (target_reference_origin_id is not null and target_origin_label is not null) then
    raise exception 'venue access route unavailable' using errcode = '22023';
  end if;

  select var.* into existing_row
  from public.venue_access_routes var
  where var.id = target_route_id;

  if found then
    if existing_row.project_id <> target_project_id then
      raise exception 'venue access route unavailable' using errcode = '42501';
    end if;

    if existing_row.venue_id = target_venue_id
      and existing_row.reference_origin_id is not distinct from target_reference_origin_id
      and existing_row.route_type = target_route_type
      and (
        target_reference_origin_id is not null
        or existing_row.origin_label is not distinct from normalized_origin_label
      )
      and existing_row.destination_label is not distinct from normalized_destination_label
      and existing_row.mode = target_mode
      and existing_row.duration_minutes is not distinct from target_duration_minutes
      and existing_row.distance_meters is not distinct from target_distance_meters
      and existing_row.transfers_count is not distinct from target_transfers_count
      and existing_row.observed_at = parsed_observed_at
      and existing_row.source_id is not distinct from target_source_id
      and existing_row.notes is not distinct from normalized_notes then
      return to_jsonb(existing_row);
    end if;

    raise exception 'venue access route conflict' using errcode = '23505';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;
  if not found then
    raise exception 'venue access route unavailable' using errcode = '42501';
  end if;

  if target_source_id is not null then
    perform 1
    from public.sources s
    where s.project_id = target_project_id
      and s.id = target_source_id;
    if not found then
      raise exception 'venue access route unavailable' using errcode = '42501';
    end if;
  end if;

  if target_reference_origin_id is not null then
    select pro.* into current_origin
    from public.project_reference_origins pro
    where pro.project_id = target_project_id
      and pro.id = target_reference_origin_id;
    if not found then
      raise exception 'venue access route unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.venue_access_routes (
    id,
    project_id,
    venue_id,
    reference_origin_id,
    route_type,
    origin_label,
    destination_label,
    mode,
    duration_minutes,
    distance_meters,
    transfers_count,
    observed_at,
    source_id,
    notes,
    reference_origin_address_snapshot,
    reference_origin_latitude_snapshot,
    reference_origin_longitude_snapshot,
    created_by,
    updated_by
  ) values (
    target_route_id,
    target_project_id,
    target_venue_id,
    target_reference_origin_id,
    target_route_type,
    case
      when target_reference_origin_id is null then normalized_origin_label
      else current_origin.label
    end,
    normalized_destination_label,
    target_mode,
    target_duration_minutes,
    target_distance_meters,
    target_transfers_count,
    parsed_observed_at,
    target_source_id,
    normalized_notes,
    case
      when target_reference_origin_id is null then null
      else current_origin.address_text
    end,
    case
      when target_reference_origin_id is null then null
      else current_origin.latitude
    end,
    case
      when target_reference_origin_id is null then null
      else current_origin.longitude
    end,
    auth.uid(),
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_row;

  if found then
    return to_jsonb(saved_row);
  end if;

  select var.* into existing_row
  from public.venue_access_routes var
  where var.id = target_route_id;

  if found and existing_row.project_id <> target_project_id then
    raise exception 'venue access route unavailable' using errcode = '42501';
  end if;

  if found
    and existing_row.venue_id = target_venue_id
    and existing_row.reference_origin_id is not distinct from target_reference_origin_id
    and existing_row.route_type = target_route_type
    and (
      target_reference_origin_id is not null
      or existing_row.origin_label is not distinct from normalized_origin_label
    )
    and existing_row.destination_label is not distinct from normalized_destination_label
    and existing_row.mode = target_mode
    and existing_row.duration_minutes is not distinct from target_duration_minutes
    and existing_row.distance_meters is not distinct from target_distance_meters
    and existing_row.transfers_count is not distinct from target_transfers_count
    and existing_row.observed_at = parsed_observed_at
    and existing_row.source_id is not distinct from target_source_id
    and existing_row.notes is not distinct from normalized_notes then
    return to_jsonb(existing_row);
  end if;

  raise exception 'venue access route conflict' using errcode = '23505';
end;
$$;

revoke all on function public.append_venue_access_route(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) from public, anon;

grant execute on function public.append_venue_access_route(
  uuid, uuid, uuid, uuid, text, text, text, text,
  integer, integer, integer, text, uuid, text
) to authenticated;

create or replace function public.delete_project_reference_origin(
  target_project_id uuid,
  target_origin_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'reference origin unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'access.write') then
    raise exception 'reference origin unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_reference_origins pro
  where pro.project_id = target_project_id
    and pro.id = target_origin_id
  for update;
  if not found then
    raise exception 'reference origin unavailable' using errcode = '42501';
  end if;

  if exists (
    select 1
    from public.venue_access_routes var
    where var.project_id = target_project_id
      and var.reference_origin_id = target_origin_id
  ) then
    raise exception 'reference origin unavailable' using errcode = '23503';
  end if;

  delete from public.project_reference_origins pro
  where pro.project_id = target_project_id
    and pro.id = target_origin_id;

  return true;
end;
$$;

revoke all on function public.delete_project_reference_origin(uuid, uuid)
from public, anon;
grant execute on function public.delete_project_reference_origin(uuid, uuid)
to authenticated;
