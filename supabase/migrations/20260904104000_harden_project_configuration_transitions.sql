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
  current_event_date date;
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

  select wdo.status, wdo.event_date
  into current_status, current_event_date
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
    or (target_status is not null and target_status not in ('candidate', 'rejected', 'archived'))
    or (
      current_status = 'selected'
      and (
        target_status is not null
        or target_event_date <> current_event_date
      )
    ) then
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
declare
  target_current_status text;
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
  into target_current_status
  from public.wedding_date_options wdo
  where wdo.project_id = target_project_id
    and wdo.id = target_option_id
  for update;

  if not found then
    raise exception 'wedding date unavailable' using errcode = '42501';
  end if;

  if target_current_status = 'selected' then
    return true;
  end if;

  if target_current_status <> 'candidate' then
    raise exception 'wedding date unavailable' using errcode = '22023';
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
    and status = 'candidate';

  return true;
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
  has_automatic_channel boolean;
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

  has_automatic_channel :=
    coalesce(target_planned_email, false)
    or coalesce(target_planned_sms, false)
    or coalesce(target_planned_whatsapp, false);

  if target_rsvp_method is null
    or target_contact_data_readiness is null
    or target_automatic_channel_setup_intent is null
    or target_rsvp_method not in ('mariage_os_links', 'manual', 'later')
    or target_contact_data_readiness not in ('emails', 'phones', 'emails_and_phones', 'import_later', 'not_yet')
    or target_automatic_channel_setup_intent not in ('configure_now', 'later', 'not_applicable')
    or (has_automatic_channel and target_automatic_channel_setup_intent = 'not_applicable')
    or (not has_automatic_channel and target_automatic_channel_setup_intent <> 'not_applicable') then
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

comment on function public.update_wedding_date_option(uuid, uuid, date, text, text, text) is
  'Owner-only metadata/lifecycle edit. A selected civil date or selected status cannot be changed through generic editing; selection changes use the protected selection command.';

comment on function public.select_wedding_date_option(uuid, uuid) is
  'Owner-only protected selection. Only a candidate can become selected; rejected/archived rows must first return to candidate explicitly.';
