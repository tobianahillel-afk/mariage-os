create or replace function public.create_venue_space(
  target_project_id uuid,
  target_venue_id uuid,
  target_name text,
  target_space_type text,
  target_indoor boolean,
  target_area_m2 numeric,
  target_length_m numeric,
  target_width_m numeric,
  target_height_m numeric,
  target_capacity_seated integer,
  target_capacity_cocktail integer,
  target_sort_order integer,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  saved_row public.venue_spaces%rowtype;
  normalized_name text;
  normalized_space_type text;
  normalized_notes text;
begin
  if auth.uid() is null then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  normalized_name := btrim(target_name);
  normalized_space_type := btrim(target_space_type);
  normalized_notes := nullif(btrim(target_notes), '');

  if normalized_name is null
    or char_length(normalized_name) not between 1 and 160
    or normalized_space_type is null
    or char_length(normalized_space_type) not between 1 and 80
    or (
      target_area_m2 is not null
      and (
        target_area_m2 <= 0
        or target_area_m2 > 99999999.99
        or target_area_m2 <> round(target_area_m2, 2)
      )
    )
    or (
      target_length_m is not null
      and (
        target_length_m <= 0
        or target_length_m > 99999999.99
        or target_length_m <> round(target_length_m, 2)
      )
    )
    or (
      target_width_m is not null
      and (
        target_width_m <= 0
        or target_width_m > 99999999.99
        or target_width_m <> round(target_width_m, 2)
      )
    )
    or (
      target_height_m is not null
      and (
        target_height_m <= 0
        or target_height_m > 99999999.99
        or target_height_m <> round(target_height_m, 2)
      )
    )
    or (target_capacity_seated is not null and target_capacity_seated < 0)
    or (target_capacity_cocktail is not null and target_capacity_cocktail < 0)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue space unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  insert into public.venue_spaces (
    project_id,
    venue_id,
    name,
    space_type,
    indoor,
    area_m2,
    length_m,
    width_m,
    height_m,
    capacity_seated,
    capacity_cocktail,
    sort_order,
    notes,
    created_by,
    updated_by
  )
  values (
    target_project_id,
    target_venue_id,
    normalized_name,
    normalized_space_type,
    target_indoor,
    target_area_m2,
    target_length_m,
    target_width_m,
    target_height_m,
    target_capacity_seated,
    target_capacity_cocktail,
    coalesce(target_sort_order, 0),
    normalized_notes,
    auth.uid(),
    auth.uid()
  )
  returning * into saved_row;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'venue_id', saved_row.venue_id,
    'name', saved_row.name,
    'space_type', saved_row.space_type,
    'indoor', saved_row.indoor,
    'area_m2', saved_row.area_m2,
    'length_m', saved_row.length_m,
    'width_m', saved_row.width_m,
    'height_m', saved_row.height_m,
    'capacity_seated', saved_row.capacity_seated,
    'capacity_cocktail', saved_row.capacity_cocktail,
    'sort_order', saved_row.sort_order,
    'notes', saved_row.notes,
    'revision', saved_row.revision
  );
end;
$$;

create or replace function public.update_venue_space(
  target_project_id uuid,
  target_space_id uuid,
  target_expected_revision bigint,
  target_name text,
  target_space_type text,
  target_indoor boolean,
  target_area_m2 numeric,
  target_length_m numeric,
  target_width_m numeric,
  target_height_m numeric,
  target_capacity_seated integer,
  target_capacity_cocktail integer,
  target_sort_order integer,
  target_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.venue_spaces%rowtype;
  saved_row public.venue_spaces%rowtype;
  normalized_name text;
  normalized_space_type text;
  normalized_notes text;
begin
  if auth.uid() is null then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  if target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'venue space unavailable' using errcode = '22023';
  end if;

  normalized_name := btrim(target_name);
  normalized_space_type := btrim(target_space_type);
  normalized_notes := nullif(btrim(target_notes), '');

  if normalized_name is null
    or char_length(normalized_name) not between 1 and 160
    or normalized_space_type is null
    or char_length(normalized_space_type) not between 1 and 80
    or (
      target_area_m2 is not null
      and (
        target_area_m2 <= 0
        or target_area_m2 > 99999999.99
        or target_area_m2 <> round(target_area_m2, 2)
      )
    )
    or (
      target_length_m is not null
      and (
        target_length_m <= 0
        or target_length_m > 99999999.99
        or target_length_m <> round(target_length_m, 2)
      )
    )
    or (
      target_width_m is not null
      and (
        target_width_m <= 0
        or target_width_m > 99999999.99
        or target_width_m <> round(target_width_m, 2)
      )
    )
    or (
      target_height_m is not null
      and (
        target_height_m <= 0
        or target_height_m > 99999999.99
        or target_height_m <> round(target_height_m, 2)
      )
    )
    or (target_capacity_seated is not null and target_capacity_seated < 0)
    or (target_capacity_cocktail is not null and target_capacity_cocktail < 0)
    or (normalized_notes is not null and char_length(normalized_notes) > 5000) then
    raise exception 'venue space unavailable' using errcode = '22023';
  end if;

  select * into current_row
  from public.venue_spaces vs
  where vs.project_id = target_project_id
    and vs.id = target_space_id
  for update;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.write') then
    raise exception 'venue space unavailable' using errcode = '42501';
  end if;

  if current_row.revision <> target_expected_revision then
    raise exception 'venue space unavailable' using errcode = '40001';
  end if;

  update public.venue_spaces
  set name = normalized_name,
      space_type = normalized_space_type,
      indoor = target_indoor,
      area_m2 = target_area_m2,
      length_m = target_length_m,
      width_m = target_width_m,
      height_m = target_height_m,
      capacity_seated = target_capacity_seated,
      capacity_cocktail = target_capacity_cocktail,
      sort_order = coalesce(target_sort_order, 0),
      notes = normalized_notes
  where project_id = target_project_id
    and id = target_space_id
  returning * into saved_row;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'venue_id', saved_row.venue_id,
    'name', saved_row.name,
    'space_type', saved_row.space_type,
    'indoor', saved_row.indoor,
    'area_m2', saved_row.area_m2,
    'length_m', saved_row.length_m,
    'width_m', saved_row.width_m,
    'height_m', saved_row.height_m,
    'capacity_seated', saved_row.capacity_seated,
    'capacity_cocktail', saved_row.capacity_cocktail,
    'sort_order', saved_row.sort_order,
    'notes', saved_row.notes,
    'revision', saved_row.revision
  );
end;
$$;

comment on function public.create_venue_space(
  uuid, uuid, text, text, boolean, numeric, numeric, numeric, numeric,
  integer, integer, integer, text
) is 'Creates a Venue space after exact numeric(10,2) validation and project authorization.';

comment on function public.update_venue_space(
  uuid, uuid, bigint, text, text, boolean, numeric, numeric, numeric,
  numeric, integer, integer, integer, text
) is 'Updates a Venue space with optimistic revision locking and exact numeric(10,2) validation.';
