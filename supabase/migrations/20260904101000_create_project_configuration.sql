create table public.wedding_date_options (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  event_date date not null,
  label text null check (label is null or char_length(label) between 1 and 160),
  status text not null default 'candidate' check (status in ('candidate', 'selected', 'rejected', 'archived')),
  notes text null,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id)
);

create unique index wedding_date_options_active_date_idx
  on public.wedding_date_options (project_id, event_date)
  where status in ('candidate', 'selected');

create unique index wedding_date_options_one_selected_idx
  on public.wedding_date_options (project_id)
  where status = 'selected';

create table public.project_reference_origins (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 160),
  address_text text null check (address_text is null or char_length(address_text) between 1 and 500),
  latitude numeric(9, 6) null check (latitude between -90 and 90),
  longitude numeric(9, 6) null check (longitude between -180 and 180),
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id)
);

create unique index project_reference_origins_one_default_idx
  on public.project_reference_origins (project_id)
  where is_default;

create table public.user_project_preferences (
  project_id uuid not null,
  user_id uuid not null,
  preferences_json jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences_json) = 'object'),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  primary key (project_id, user_id),
  foreign key (project_id, user_id)
    references public.project_members(project_id, user_id)
    on delete cascade
);

create table public.project_rsvp_intent_settings (
  project_id uuid primary key references public.projects(id) on delete cascade,
  rsvp_method text not null default 'later' check (rsvp_method in ('mariage_os_links', 'manual', 'later')),
  rsvp_deadline date null,
  ask_dietary boolean not null default false,
  ask_accessibility boolean not null default false,
  ask_transport boolean not null default false,
  ask_accommodation boolean not null default false,
  ask_guest_message boolean not null default false,
  planned_email boolean not null default false,
  planned_sms boolean not null default false,
  planned_whatsapp boolean not null default false,
  planned_manual_link boolean not null default false,
  contact_data_readiness text not null default 'not_yet'
    check (contact_data_readiness in ('emails', 'phones', 'emails_and_phones', 'import_later', 'not_yet')),
  automatic_channel_setup_intent text not null default 'not_applicable'
    check (automatic_channel_setup_intent in ('configure_now', 'later', 'not_applicable')),
  created_at timestamptz not null default now(),
  created_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id),
  revision bigint not null default 1 check (revision > 0)
);

alter table public.wedding_date_options enable row level security;
alter table public.project_reference_origins enable row level security;
alter table public.user_project_preferences enable row level security;
alter table public.project_rsvp_intent_settings enable row level security;

revoke all on table public.wedding_date_options from public, anon, authenticated;
revoke all on table public.project_reference_origins from public, anon, authenticated;
revoke all on table public.user_project_preferences from public, anon, authenticated;
revoke all on table public.project_rsvp_intent_settings from public, anon, authenticated;

grant select on table public.wedding_date_options to authenticated;
grant select on table public.project_reference_origins to authenticated;
grant select on table public.user_project_preferences to authenticated;
grant select on table public.project_rsvp_intent_settings to authenticated;

create policy wedding_date_options_select_member
on public.wedding_date_options
for select
to authenticated
using (public.has_project_permission(project_id, 'project.read'));

create policy project_reference_origins_select_authorized
on public.project_reference_origins
for select
to authenticated
using (public.has_project_permission(project_id, 'access.read'));

create policy user_project_preferences_select_self
on public.user_project_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  and public.has_project_permission(project_id, 'project.read')
);

create policy project_rsvp_intent_settings_select_member
on public.project_rsvp_intent_settings
for select
to authenticated
using (public.has_project_permission(project_id, 'project.read'));

create or replace function public.update_project_settings(
  target_project_id uuid,
  project_name text,
  project_locale text,
  project_timezone text,
  project_currency text,
  project_target_guest_count integer
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  next_revision bigint;
  normalized_name text;
  normalized_locale text;
  normalized_currency text;
begin
  if auth.uid() is null then
    raise exception 'project settings unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.settings.update') then
    raise exception 'project settings unavailable' using errcode = '42501';
  end if;

  normalized_name := btrim(project_name);
  normalized_locale := btrim(project_locale);
  normalized_currency := upper(btrim(project_currency));

  if normalized_name is null
    or char_length(normalized_name) not between 1 and 160
    or normalized_locale is null
    or normalized_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    or project_timezone is null
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names tz
      where tz.name = project_timezone
    )
    or normalized_currency !~ '^[A-Z]{3}$'
    or project_target_guest_count < 0 then
    raise exception 'project settings unavailable' using errcode = '22023';
  end if;

  update public.projects
  set name = normalized_name,
      locale = normalized_locale,
      timezone = project_timezone,
      currency = normalized_currency,
      target_guest_count = project_target_guest_count,
      updated_at = now(),
      updated_by = auth.uid(),
      revision = revision + 1
  where id = target_project_id
  returning revision into next_revision;

  return next_revision;
end;
$$;

create or replace function public.create_wedding_date_option(
  target_project_id uuid,
  target_event_date date,
  target_label text,
  target_notes text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  new_id uuid;
  normalized_label text;
begin
  if auth.uid() is null then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.settings.update') then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  normalized_label := nullif(btrim(target_label), '');
  if target_event_date is null
    or (normalized_label is not null and char_length(normalized_label) > 160) then
    raise exception 'wedding date unavailable' using errcode = '22023';
  end if;

  insert into public.wedding_date_options (
    project_id,
    event_date,
    label,
    status,
    notes,
    created_by,
    updated_by
  )
  values (
    target_project_id,
    target_event_date,
    normalized_label,
    'candidate',
    target_notes,
    auth.uid(),
    auth.uid()
  )
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function public.update_wedding_date_option(
  target_project_id uuid,
  target_option_id uuid,
  target_event_date date,
  target_label text,
  target_notes text,
  target_status text default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_status text;
  next_revision bigint;
  normalized_label text;
begin
  if auth.uid() is null then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.settings.update') then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  select wdo.status
  into current_status
  from public.wedding_date_options wdo
  where wdo.project_id = target_project_id
    and wdo.id = target_option_id
  for update;

  if not found then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  normalized_label := nullif(btrim(target_label), '');
  if target_event_date is null
    or (normalized_label is not null and char_length(normalized_label) > 160)
    or (target_status is not null and target_status not in ('candidate', 'rejected', 'archived')) then
    raise exception 'wedding date unavailable' using errcode = '22023';
  end if;

  update public.wedding_date_options
  set event_date = target_event_date,
      label = normalized_label,
      notes = target_notes,
      status = coalesce(target_status, current_status),
      updated_at = now(),
      updated_by = auth.uid(),
      revision = revision + 1
  where project_id = target_project_id
    and id = target_option_id
  returning revision into next_revision;

  return next_revision;
end;
$$;

create or replace function public.select_wedding_date_option(
  target_project_id uuid,
  target_option_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.settings.update') then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.wedding_date_options wdo
  where wdo.project_id = target_project_id
    and wdo.id = target_option_id
  for update;

  if not found then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  update public.wedding_date_options
  set status = 'candidate',
      updated_at = now(),
      updated_by = auth.uid(),
      revision = revision + 1
  where project_id = target_project_id
    and status = 'selected'
    and id <> target_option_id;

  update public.wedding_date_options
  set status = 'selected',
      updated_at = now(),
      updated_by = auth.uid(),
      revision = revision + 1
  where project_id = target_project_id
    and id = target_option_id
    and status <> 'selected';

  return true;
end;
$$;

create or replace function public.save_project_reference_origin(
  target_project_id uuid,
  target_origin_id uuid,
  target_label text,
  target_address_text text,
  target_latitude numeric,
  target_longitude numeric,
  target_is_default boolean,
  target_sort_order integer
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  saved_id uuid;
  normalized_label text;
  normalized_address text;
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

  normalized_label := btrim(target_label);
  normalized_address := nullif(btrim(target_address_text), '');
  if normalized_label is null
    or char_length(normalized_label) not between 1 and 160
    or (normalized_address is not null and char_length(normalized_address) > 500)
    or (target_latitude is not null and target_latitude not between -90 and 90)
    or (target_longitude is not null and target_longitude not between -180 and 180) then
    raise exception 'reference origin unavailable' using errcode = '22023';
  end if;

  if target_origin_id is not null then
    perform 1
    from public.project_reference_origins pro
    where pro.project_id = target_project_id
      and pro.id = target_origin_id
    for update;

    if not found then
      raise exception 'reference origin unavailable' using errcode = '42501';
    end if;
  end if;

  if coalesce(target_is_default, false) then
    update public.project_reference_origins
    set is_default = false,
        updated_at = now(),
        updated_by = auth.uid(),
        revision = revision + 1
    where project_id = target_project_id
      and is_default
      and (target_origin_id is null or id <> target_origin_id);
  end if;

  if target_origin_id is null then
    insert into public.project_reference_origins (
      project_id,
      label,
      address_text,
      latitude,
      longitude,
      is_default,
      sort_order,
      created_by,
      updated_by
    )
    values (
      target_project_id,
      normalized_label,
      normalized_address,
      target_latitude,
      target_longitude,
      coalesce(target_is_default, false),
      coalesce(target_sort_order, 0),
      auth.uid(),
      auth.uid()
    )
    returning id into saved_id;
  else
    update public.project_reference_origins
    set label = normalized_label,
        address_text = normalized_address,
        latitude = target_latitude,
        longitude = target_longitude,
        is_default = coalesce(target_is_default, false),
        sort_order = coalesce(target_sort_order, 0),
        updated_at = now(),
        updated_by = auth.uid(),
        revision = revision + 1
    where project_id = target_project_id
      and id = target_origin_id
    returning id into saved_id;
  end if;

  return saved_id;
end;
$$;

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

  delete from public.project_reference_origins pro
  where pro.project_id = target_project_id
    and pro.id = target_origin_id;

  if not found then
    raise exception 'reference origin unavailable' using errcode = '42501';
  end if;

  return true;
end;
$$;

create or replace function public.upsert_user_project_preferences(
  target_project_id uuid,
  target_preferences jsonb
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'preferences unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.read') then
    raise exception 'preferences unavailable' using errcode = '42501';
  end if;

  if target_preferences is null or jsonb_typeof(target_preferences) <> 'object' then
    raise exception 'preferences unavailable' using errcode = '22023';
  end if;

  insert into public.user_project_preferences (
    project_id,
    user_id,
    preferences_json,
    updated_at,
    revision
  )
  values (
    target_project_id,
    auth.uid(),
    target_preferences,
    now(),
    1
  )
  on conflict (project_id, user_id)
  do update
  set preferences_json = excluded.preferences_json,
      updated_at = now(),
      revision = public.user_project_preferences.revision + 1
  returning revision into next_revision;

  return next_revision;
end;
$$;

create or replace function public.upsert_project_rsvp_intent_settings(
  target_project_id uuid,
  target_rsvp_method text,
  target_rsvp_deadline date,
  target_ask_dietary boolean,
  target_ask_accessibility boolean,
  target_ask_transport boolean,
  target_ask_accommodation boolean,
  target_ask_guest_message boolean,
  target_planned_email boolean,
  target_planned_sms boolean,
  target_planned_whatsapp boolean,
  target_planned_manual_link boolean,
  target_contact_data_readiness text,
  target_automatic_channel_setup_intent text
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  next_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'RSVP settings unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.projects p
  where p.id = target_project_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'project.settings.update') then
    raise exception 'RSVP settings unavailable' using errcode = '42501';
  end if;

  if target_rsvp_method not in ('mariage_os_links', 'manual', 'later')
    or target_contact_data_readiness not in ('emails', 'phones', 'emails_and_phones', 'import_later', 'not_yet')
    or target_automatic_channel_setup_intent not in ('configure_now', 'later', 'not_applicable') then
    raise exception 'RSVP settings unavailable' using errcode = '22023';
  end if;

  insert into public.project_rsvp_intent_settings (
    project_id,
    rsvp_method,
    rsvp_deadline,
    ask_dietary,
    ask_accessibility,
    ask_transport,
    ask_accommodation,
    ask_guest_message,
    planned_email,
    planned_sms,
    planned_whatsapp,
    planned_manual_link,
    contact_data_readiness,
    automatic_channel_setup_intent,
    created_by,
    updated_by
  )
  values (
    target_project_id,
    target_rsvp_method,
    target_rsvp_deadline,
    coalesce(target_ask_dietary, false),
    coalesce(target_ask_accessibility, false),
    coalesce(target_ask_transport, false),
    coalesce(target_ask_accommodation, false),
    coalesce(target_ask_guest_message, false),
    coalesce(target_planned_email, false),
    coalesce(target_planned_sms, false),
    coalesce(target_planned_whatsapp, false),
    coalesce(target_planned_manual_link, false),
    target_contact_data_readiness,
    target_automatic_channel_setup_intent,
    auth.uid(),
    auth.uid()
  )
  on conflict (project_id)
  do update
  set rsvp_method = excluded.rsvp_method,
      rsvp_deadline = excluded.rsvp_deadline,
      ask_dietary = excluded.ask_dietary,
      ask_accessibility = excluded.ask_accessibility,
      ask_transport = excluded.ask_transport,
      ask_accommodation = excluded.ask_accommodation,
      ask_guest_message = excluded.ask_guest_message,
      planned_email = excluded.planned_email,
      planned_sms = excluded.planned_sms,
      planned_whatsapp = excluded.planned_whatsapp,
      planned_manual_link = excluded.planned_manual_link,
      contact_data_readiness = excluded.contact_data_readiness,
      automatic_channel_setup_intent = excluded.automatic_channel_setup_intent,
      updated_at = now(),
      updated_by = auth.uid(),
      revision = public.project_rsvp_intent_settings.revision + 1
  returning revision into next_revision;

  return next_revision;
end;
$$;

revoke all on function public.update_project_settings(uuid, text, text, text, text, integer) from public, anon;
revoke all on function public.create_wedding_date_option(uuid, date, text, text) from public, anon;
revoke all on function public.update_wedding_date_option(uuid, uuid, date, text, text, text) from public, anon;
revoke all on function public.select_wedding_date_option(uuid, uuid) from public, anon;
revoke all on function public.save_project_reference_origin(uuid, uuid, text, text, numeric, numeric, boolean, integer) from public, anon;
revoke all on function public.delete_project_reference_origin(uuid, uuid) from public, anon;
revoke all on function public.upsert_user_project_preferences(uuid, jsonb) from public, anon;
revoke all on function public.upsert_project_rsvp_intent_settings(uuid, text, date, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text) from public, anon;

grant execute on function public.update_project_settings(uuid, text, text, text, text, integer) to authenticated;
grant execute on function public.create_wedding_date_option(uuid, date, text, text) to authenticated;
grant execute on function public.update_wedding_date_option(uuid, uuid, date, text, text, text) to authenticated;
grant execute on function public.select_wedding_date_option(uuid, uuid) to authenticated;
grant execute on function public.save_project_reference_origin(uuid, uuid, text, text, numeric, numeric, boolean, integer) to authenticated;
grant execute on function public.delete_project_reference_origin(uuid, uuid) to authenticated;
grant execute on function public.upsert_user_project_preferences(uuid, jsonb) to authenticated;
grant execute on function public.upsert_project_rsvp_intent_settings(uuid, text, date, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text) to authenticated;

comment on table public.wedding_date_options is
  'Project-owned civil wedding date candidates. The selected date is derived from the sole selected row and is never duplicated on projects.';

comment on function public.select_wedding_date_option(uuid, uuid) is
  'Owner-only protected date selection serialized on the project row; any previous selected option is atomically demoted to candidate.';

comment on table public.project_reference_origins is
  'Private project origins used later for route/access comparisons; at most one default origin exists per project.';

comment on table public.user_project_preferences is
  'Cross-device member-personal preferences. RLS exposes only the authenticated author in an active project membership.';

comment on table public.project_rsvp_intent_settings is
  'Provider-neutral Lot-1 onboarding/settings intent only. Contains no guest capability, provider credential, token or send state.';
