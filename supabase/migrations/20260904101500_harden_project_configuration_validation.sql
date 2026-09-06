alter table public.project_reference_origins
add constraint project_reference_origins_coordinate_pair
check ((latitude is null) = (longitude is null));

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
  normalized_timezone text;
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
  normalized_timezone := btrim(project_timezone);
  normalized_currency := upper(btrim(project_currency));

  if normalized_name is null
    or char_length(normalized_name) not between 1 and 160
    or normalized_locale is null
    or normalized_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
    or normalized_timezone is null
    or not exists (
      select 1
      from pg_catalog.pg_timezone_names tz
      where tz.name = normalized_timezone
    )
    or normalized_currency is null
    or normalized_currency !~ '^[A-Z]{3}$'
    or project_target_guest_count < 0 then
    raise exception 'project settings unavailable' using errcode = '22023';
  end if;

  update public.projects
  set name = normalized_name,
      locale = normalized_locale,
      timezone = normalized_timezone,
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
    or ((target_latitude is null) <> (target_longitude is null))
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
