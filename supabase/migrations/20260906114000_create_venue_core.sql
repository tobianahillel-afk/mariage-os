create table public.venues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text null check (code is null or char_length(btrim(code)) between 1 and 40),
  name text not null check (char_length(btrim(name)) between 1 and 240),
  status text not null default 'research' check (
    status in (
      'research', 'shortlist', 'reserve', 'contacted', 'quote_requested',
      'quote_received', 'visit_planned', 'visited', 'reviewed', 'finalist',
      'option_held', 'selected', 'contract_sent', 'contract_signed',
      'deposit_paid', 'confirmed', 'completed', 'archived', 'rejected',
      'unavailable', 'withdrawn', 'paused'
    )
  ),
  rejection_reason text null check (
    rejection_reason is null or char_length(btrim(rejection_reason)) between 1 and 1000
  ),
  address_line1 text null check (address_line1 is null or char_length(address_line1) <= 500),
  address_line2 text null check (address_line2 is null or char_length(address_line2) <= 500),
  postal_code text null check (postal_code is null or char_length(postal_code) <= 32),
  city text null check (city is null or char_length(city) <= 160),
  region text null check (region is null or char_length(region) <= 160),
  country_code char(2) null default 'FR' check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  latitude numeric(9, 6) null check (latitude between -90 and 90),
  longitude numeric(9, 6) null check (longitude between -180 and 180),
  website_url text null check (website_url is null or char_length(website_url) <= 2048),
  phone text null check (phone is null or char_length(phone) <= 80),
  email text null check (email is null or char_length(email) <= 320),
  summary_note text null check (summary_note is null or char_length(summary_note) <= 5000),
  main_media_id uuid null,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  constraint venues_rejection_consistency check (
    (status = 'rejected' and rejection_reason is not null)
    or (status <> 'rejected' and rejection_reason is null)
  )
);

create index venues_project_status_idx on public.venues (project_id, status);
create index venues_project_name_idx on public.venues (project_id, name);

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_user_id uuid null references auth.users(id),
  device_id uuid null,
  event_type text not null check (char_length(event_type) between 1 and 120),
  entity_type text null check (entity_type is null or char_length(entity_type) between 1 and 80),
  entity_id uuid null,
  summary_key text null check (summary_key is null or char_length(summary_key) between 1 and 160),
  metadata_json jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata_json) = 'object'),
  occurred_at timestamptz not null default now(),
  operation_id uuid null
);

create index activity_log_project_time_idx
  on public.activity_log (project_id, occurred_at desc);
create index activity_log_entity_idx
  on public.activity_log (project_id, entity_type, entity_id, occurred_at desc);

create or replace function public.touch_venue_audit()
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

revoke all on function public.touch_venue_audit() from public, anon, authenticated;

create trigger venues_touch_audit
before update on public.venues
for each row
execute function public.touch_venue_audit();

alter table public.venues enable row level security;
alter table public.activity_log enable row level security;

revoke all on table public.venues from public, anon, authenticated;
revoke all on table public.activity_log from public, anon, authenticated;

grant select on table public.venues to authenticated;
grant insert (
  project_id, code, name, address_line1, address_line2, postal_code, city,
  region, country_code, latitude, longitude, website_url, phone, email,
  summary_note
) on table public.venues to authenticated;
grant update (
  code, name, address_line1, address_line2, postal_code, city, region,
  country_code, latitude, longitude, website_url, phone, email, summary_note
) on table public.venues to authenticated;
grant select on table public.activity_log to authenticated;

create policy venues_select_authorized
on public.venues
for select
to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create policy venues_insert_authorized
on public.venues
for insert
to authenticated
with check (
  public.has_project_permission(project_id, 'venues.write')
  and status = 'research'
  and rejection_reason is null
  and created_by = auth.uid()
  and updated_by = auth.uid()
  and revision = 1
);

create policy venues_update_authorized
on public.venues
for update
to authenticated
using (public.has_project_permission(project_id, 'venues.write'))
with check (public.has_project_permission(project_id, 'venues.write'));

create policy activity_log_select_authorized
on public.activity_log
for select
to authenticated
using (
  public.has_project_permission(project_id, 'audit.read')
  or (
    entity_type = 'venue'
    and public.has_project_permission(project_id, 'venues.read')
  )
);

create or replace function public.transition_venue_status(
  target_project_id uuid,
  target_venue_id uuid,
  target_status text,
  target_rejection_reason text default null,
  target_operation_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venues%rowtype;
  normalized_reason text;
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;

  if target_status not in (
    'research', 'shortlist', 'reserve', 'contacted', 'quote_requested',
    'quote_received', 'visit_planned', 'visited', 'reviewed', 'finalist',
    'option_held', 'selected', 'contract_sent', 'contract_signed',
    'deposit_paid', 'confirmed', 'completed', 'archived', 'rejected',
    'unavailable', 'withdrawn', 'paused'
  ) then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  normalized_reason := nullif(btrim(target_rejection_reason), '');
  if target_status = 'rejected' then
    if normalized_reason is null or char_length(normalized_reason) > 1000 then
      raise exception 'venue transition unavailable' using errcode = '22023';
    end if;
  elsif normalized_reason is not null then
    raise exception 'venue transition unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue transition unavailable' using errcode = '42501';
  end if;

  if current_row.status = target_status
    and current_row.rejection_reason is not distinct from normalized_reason then
    return current_row.revision;
  end if;

  update public.venues
  set status = target_status,
      rejection_reason = normalized_reason
  where project_id = target_project_id
    and id = target_venue_id
  returning revision into next_revision;

  insert into public.activity_log (
    project_id,
    actor_user_id,
    event_type,
    entity_type,
    entity_id,
    summary_key,
    metadata_json,
    operation_id
  )
  values (
    target_project_id,
    auth.uid(),
    'venue_status_changed',
    'venue',
    target_venue_id,
    'venue.status_changed',
    jsonb_build_object(
      'previousStatus', current_row.status,
      'previousRejectionReason', current_row.rejection_reason,
      'status', target_status,
      'rejectionReason', normalized_reason
    ),
    target_operation_id
  );

  return next_revision;
end;
$$;

revoke all on function public.transition_venue_status(uuid, uuid, text, text, uuid)
from public, anon;
grant execute on function public.transition_venue_status(uuid, uuid, text, text, uuid)
to authenticated;

comment on table public.venues is
  'Lot 2 WP-2.1 canonical venue identity. Ordinary clients cannot directly mutate lifecycle status/rejection metadata or hard-delete venue rows.';
comment on table public.activity_log is
  'Human-meaningful project history foundation. WP-2.1 uses it for retained venue lifecycle changes without exposing generic client writes.';
comment on function public.transition_venue_status(uuid, uuid, text, text, uuid) is
  'Explicit venue lifecycle command: live venues.write authorization, validated rejection semantics, reversible lifecycle changes and retained history.';
