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
      current_status in ('selected', 'rejected', 'archived')
      and target_event_date <> current_event_date
    )
    or (
      current_status = 'selected'
      and target_status is not null
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

comment on function public.update_wedding_date_option(uuid, uuid, date, text, text, text) is
  'Owner-only date metadata/lifecycle edit. Selected, rejected and archived rows preserve their civil date; historical rows must return to candidate before their date can be edited.';
