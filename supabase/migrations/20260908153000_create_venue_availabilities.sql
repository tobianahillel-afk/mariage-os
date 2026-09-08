create table public.venue_availabilities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  venue_id uuid not null,
  date_option_id uuid null,
  event_date date not null,
  status text not null check (
    status in ('unknown', 'available', 'unavailable', 'option_held', 'expired')
  ),
  option_expires_at timestamptz null,
  observed_at timestamptz not null,
  source_id uuid null,
  notes text null check (
    notes is null
    or (
      notes = public.fact_ecmascript_trim(notes)
      and char_length(notes) between 1 and 5000
    )
  ),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  foreign key (project_id, venue_id)
    references public.venues(project_id, id)
    on delete cascade,
  foreign key (project_id, date_option_id)
    references public.wedding_date_options(project_id, id)
    on delete restrict,
  foreign key (project_id, source_id)
    references public.sources(project_id, id)
    on delete restrict,
  check (public.fact_instant_in_application_domain(observed_at)),
  check (
    option_expires_at is null
    or (
      status = 'option_held'
      and public.fact_instant_in_application_domain(option_expires_at)
    )
  )
);

create index venue_availabilities_history_idx
  on public.venue_availabilities (
    project_id,
    venue_id,
    event_date,
    observed_at desc,
    created_at desc,
    id asc
  );

create or replace function public.validate_venue_availability_insert()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  option_event_date date;
begin
  if new.date_option_id is not null then
    select wdo.event_date into option_event_date
    from public.wedding_date_options wdo
    where wdo.project_id = new.project_id
      and wdo.id = new.date_option_id;

    if not found or option_event_date is distinct from new.event_date then
      raise exception 'venue availability unavailable' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.validate_venue_availability_insert()
from public, anon, authenticated;

create trigger venue_availabilities_validate_insert
before insert on public.venue_availabilities
for each row execute function public.validate_venue_availability_insert();

create or replace function public.protect_venue_availability_immutable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  raise exception 'venue availability is immutable' using errcode = '23514';
end;
$$;

revoke all on function public.protect_venue_availability_immutable()
from public, anon, authenticated;

create trigger venue_availabilities_protect_update
before update on public.venue_availabilities
for each row execute function public.protect_venue_availability_immutable();

create trigger venue_availabilities_protect_delete
before delete on public.venue_availabilities
for each row execute function public.protect_venue_availability_immutable();

alter table public.venue_availabilities enable row level security;

revoke all on table public.venue_availabilities from public, anon, authenticated;
grant select on table public.venue_availabilities to authenticated;

create policy venue_availabilities_select_authorized
on public.venue_availabilities for select to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create or replace function public.venue_availability_assert_writer(
  target_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue availability unavailable' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.venue_availability_assert_writer(uuid)
from public, anon, authenticated;

create or replace function public.append_venue_availability(
  target_project_id uuid,
  target_venue_id uuid,
  target_availability_id uuid,
  target_date_option_id uuid,
  target_event_date text,
  target_status text,
  target_option_expires_at text,
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
  parsed_event_date date;
  parsed_option_expires_at timestamptz;
  parsed_observed_at timestamptz;
  normalized_notes text;
  saved_row public.venue_availabilities%rowtype;
  existing_row public.venue_availabilities%rowtype;
begin
  perform public.venue_availability_assert_writer(target_project_id);

  if target_availability_id is null
    or target_venue_id is null
    or target_event_date is null
    or target_status is null
    or target_observed_at is null then
    raise exception 'venue availability unavailable' using errcode = '22023';
  end if;

  parsed_event_date := public.venue_commercial_parse_date(target_event_date);
  parsed_observed_at := public.fact_parse_application_instant(target_observed_at);
  parsed_option_expires_at := public.fact_parse_application_instant(target_option_expires_at);
  normalized_notes := nullif(public.fact_ecmascript_trim(target_notes), '');

  if parsed_event_date is null
    or parsed_observed_at is null
    or target_status not in (
      'unknown', 'available', 'unavailable', 'option_held', 'expired'
    )
    or (target_option_expires_at is not null and parsed_option_expires_at is null)
    or (parsed_option_expires_at is not null and target_status <> 'option_held')
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue availability unavailable' using errcode = '22023';
  end if;

  perform 1 from public.venues v
  where v.project_id = target_project_id and v.id = target_venue_id;
  if not found then
    raise exception 'venue availability unavailable' using errcode = '42501';
  end if;

  if target_date_option_id is not null then
    perform 1 from public.wedding_date_options wdo
    where wdo.project_id = target_project_id
      and wdo.id = target_date_option_id
      and wdo.event_date = parsed_event_date;
    if not found then
      raise exception 'venue availability unavailable' using errcode = '42501';
    end if;
  end if;

  if target_source_id is not null then
    perform 1 from public.sources s
    where s.project_id = target_project_id and s.id = target_source_id;
    if not found then
      raise exception 'venue availability unavailable' using errcode = '42501';
    end if;
  end if;

  insert into public.venue_availabilities (
    id,
    project_id,
    venue_id,
    date_option_id,
    event_date,
    status,
    option_expires_at,
    observed_at,
    source_id,
    notes,
    created_by,
    updated_by
  ) values (
    target_availability_id,
    target_project_id,
    target_venue_id,
    target_date_option_id,
    parsed_event_date,
    target_status,
    parsed_option_expires_at,
    parsed_observed_at,
    target_source_id,
    normalized_notes,
    auth.uid(),
    auth.uid()
  )
  on conflict (id) do nothing
  returning * into saved_row;

  if found then
    return to_jsonb(saved_row);
  end if;

  select va.* into existing_row
  from public.venue_availabilities va
  where va.id = target_availability_id;

  if found
    and existing_row.project_id = target_project_id
    and existing_row.venue_id = target_venue_id
    and existing_row.date_option_id is not distinct from target_date_option_id
    and existing_row.event_date = parsed_event_date
    and existing_row.status = target_status
    and existing_row.option_expires_at is not distinct from parsed_option_expires_at
    and existing_row.observed_at = parsed_observed_at
    and existing_row.source_id is not distinct from target_source_id
    and existing_row.notes is not distinct from normalized_notes then
    return to_jsonb(existing_row);
  end if;

  raise exception 'venue availability conflict' using errcode = '23505';
end;
$$;

revoke all on function public.append_venue_availability(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid, text
) from public, anon;

grant execute on function public.append_venue_availability(
  uuid, uuid, uuid, uuid, text, text, text, text, uuid, text
) to authenticated;
