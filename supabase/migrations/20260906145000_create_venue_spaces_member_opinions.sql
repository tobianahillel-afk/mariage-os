create table public.venue_spaces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  venue_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 160),
  space_type text not null check (char_length(btrim(space_type)) between 1 and 80),
  indoor boolean null,
  area_m2 numeric(10, 2) null check (area_m2 > 0),
  length_m numeric(10, 2) null check (length_m > 0),
  width_m numeric(10, 2) null check (width_m > 0),
  height_m numeric(10, 2) null check (height_m > 0),
  capacity_seated integer null check (capacity_seated >= 0),
  capacity_cocktail integer null check (capacity_cocktail >= 0),
  sort_order integer not null default 0,
  notes text null check (notes is null or char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_at timestamptz not null default now(),
  updated_by uuid not null default auth.uid() references auth.users(id),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, id),
  foreign key (project_id, venue_id)
    references public.venues(project_id, id)
    on delete cascade
);

create index venue_spaces_venue_sort_idx
  on public.venue_spaces (project_id, venue_id, sort_order, name);

create table public.member_entity_preferences (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null,
  target_type text not null check (char_length(target_type) between 1 and 80),
  target_id uuid not null,
  favorite boolean not null default false,
  personal_note text null check (personal_note is null or char_length(personal_note) <= 5000),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, user_id, target_type, target_id),
  foreign key (project_id, user_id)
    references public.project_members(project_id, user_id)
    on delete cascade
);

create index member_entity_preferences_target_idx
  on public.member_entity_preferences (project_id, target_type, target_id);

create table public.member_ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null,
  target_type text not null check (char_length(target_type) between 1 and 80),
  target_id uuid not null,
  dimension_key text not null check (
    dimension_key in (
      'love_score',
      'interior_aesthetic_score_personal',
      'exterior_aesthetic_score_personal',
      'logistics_score_personal',
      'value_for_money_score_personal'
    )
  ),
  rating numeric(4, 2) not null check (rating between 0 and 10),
  updated_at timestamptz not null default now(),
  revision bigint not null default 1 check (revision > 0),
  unique (project_id, user_id, target_type, target_id, dimension_key),
  foreign key (project_id, user_id)
    references public.project_members(project_id, user_id)
    on delete cascade
);

create index member_ratings_target_idx
  on public.member_ratings (project_id, target_type, target_id, dimension_key);

create or replace function public.validate_member_opinion_target()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.target_type <> 'venue'
    or not exists (
      select 1
      from public.venues v
      where v.project_id = new.project_id
        and v.id = new.target_id
    ) then
    raise exception 'member opinion target unavailable' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_member_opinion_target()
from public, anon, authenticated;

create trigger member_entity_preferences_validate_target
before insert or update of project_id, target_type, target_id
on public.member_entity_preferences
for each row
execute function public.validate_member_opinion_target();

create trigger member_ratings_validate_target
before insert or update of project_id, target_type, target_id
on public.member_ratings
for each row
execute function public.validate_member_opinion_target();

create or replace function public.touch_member_opinion_revision()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  new.revision := old.revision + 1;
  return new;
end;
$$;

revoke all on function public.touch_member_opinion_revision()
from public, anon, authenticated;

create trigger member_entity_preferences_touch_revision
before update on public.member_entity_preferences
for each row
execute function public.touch_member_opinion_revision();

create trigger member_ratings_touch_revision
before update on public.member_ratings
for each row
execute function public.touch_member_opinion_revision();

create trigger venue_spaces_touch_audit
before update on public.venue_spaces
for each row
execute function public.touch_venue_audit();

alter table public.venue_spaces enable row level security;
alter table public.member_entity_preferences enable row level security;
alter table public.member_ratings enable row level security;

revoke all on table public.venue_spaces from public, anon, authenticated;
revoke all on table public.member_entity_preferences from public, anon, authenticated;
revoke all on table public.member_ratings from public, anon, authenticated;

grant select on table public.venue_spaces to authenticated;
grant select on table public.member_entity_preferences to authenticated;
grant select on table public.member_ratings to authenticated;

create policy venue_spaces_select_authorized
on public.venue_spaces
for select
to authenticated
using (public.has_project_permission(project_id, 'venues.read'));

create policy member_entity_preferences_select_self
on public.member_entity_preferences
for select
to authenticated
using (
  user_id = auth.uid()
  and target_type = 'venue'
  and public.has_project_permission(project_id, 'venues.read')
);

create policy member_ratings_select_authorized
on public.member_ratings
for select
to authenticated
using (
  target_type = 'venue'
  and public.has_project_permission(project_id, 'venues.read')
);

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
    or (target_area_m2 is not null and target_area_m2 <= 0)
    or (target_length_m is not null and target_length_m <= 0)
    or (target_width_m is not null and target_width_m <= 0)
    or (target_height_m is not null and target_height_m <= 0)
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
    or (target_area_m2 is not null and target_area_m2 <= 0)
    or (target_length_m is not null and target_length_m <= 0)
    or (target_width_m is not null and target_width_m <= 0)
    or (target_height_m is not null and target_height_m <= 0)
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

create or replace function public.set_venue_member_preference(
  target_project_id uuid,
  target_venue_id uuid,
  target_favorite boolean,
  target_personal_note text,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.member_entity_preferences%rowtype;
  saved_row public.member_entity_preferences%rowtype;
  normalized_note text;
begin
  if auth.uid() is null then
    raise exception 'venue preference unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue preference unavailable' using errcode = '42501';
  end if;

  if target_favorite is null
    or target_expected_revision is null
    or target_expected_revision < 0 then
    raise exception 'venue preference unavailable' using errcode = '22023';
  end if;

  normalized_note := nullif(btrim(target_personal_note), '');
  if normalized_note is not null and char_length(normalized_note) > 5000 then
    raise exception 'venue preference unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue preference unavailable' using errcode = '42501';
  end if;

  select * into current_row
  from public.member_entity_preferences mep
  where mep.project_id = target_project_id
    and mep.user_id = auth.uid()
    and mep.target_type = 'venue'
    and mep.target_id = target_venue_id
  for update;

  if found then
    if current_row.revision <> target_expected_revision then
      raise exception 'venue preference unavailable' using errcode = '40001';
    end if;

    update public.member_entity_preferences
    set favorite = target_favorite,
        personal_note = normalized_note
    where id = current_row.id
    returning * into saved_row;
  else
    if target_expected_revision <> 0 then
      raise exception 'venue preference unavailable' using errcode = '40001';
    end if;

    insert into public.member_entity_preferences (
      project_id,
      user_id,
      target_type,
      target_id,
      favorite,
      personal_note
    )
    values (
      target_project_id,
      auth.uid(),
      'venue',
      target_venue_id,
      target_favorite,
      normalized_note
    )
    returning * into saved_row;
  end if;

  if not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue preference unavailable' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'user_id', saved_row.user_id,
    'target_type', saved_row.target_type,
    'target_id', saved_row.target_id,
    'favorite', saved_row.favorite,
    'personal_note', saved_row.personal_note,
    'revision', saved_row.revision
  );
end;
$$;

create or replace function public.set_venue_member_rating(
  target_project_id uuid,
  target_venue_id uuid,
  target_dimension_key text,
  target_rating numeric,
  target_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  current_row public.member_ratings%rowtype;
  saved_row public.member_ratings%rowtype;
begin
  if auth.uid() is null then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  perform 1
  from public.project_members pm
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.membership_status = 'active'
  for share;

  if not found
    or not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  if target_dimension_key not in (
      'love_score',
      'interior_aesthetic_score_personal',
      'exterior_aesthetic_score_personal',
      'logistics_score_personal',
      'value_for_money_score_personal'
    )
    or target_rating is null
    or target_rating < 0
    or target_rating > 10
    or target_expected_revision is null
    or target_expected_revision < 0 then
    raise exception 'venue rating unavailable' using errcode = '22023';
  end if;

  perform 1
  from public.venues v
  where v.project_id = target_project_id
    and v.id = target_venue_id;

  if not found then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  select * into current_row
  from public.member_ratings mr
  where mr.project_id = target_project_id
    and mr.user_id = auth.uid()
    and mr.target_type = 'venue'
    and mr.target_id = target_venue_id
    and mr.dimension_key = target_dimension_key
  for update;

  if found then
    if current_row.revision <> target_expected_revision then
      raise exception 'venue rating unavailable' using errcode = '40001';
    end if;

    update public.member_ratings
    set rating = target_rating
    where id = current_row.id
    returning * into saved_row;
  else
    if target_expected_revision <> 0 then
      raise exception 'venue rating unavailable' using errcode = '40001';
    end if;

    insert into public.member_ratings (
      project_id,
      user_id,
      target_type,
      target_id,
      dimension_key,
      rating
    )
    values (
      target_project_id,
      auth.uid(),
      'venue',
      target_venue_id,
      target_dimension_key,
      target_rating
    )
    returning * into saved_row;
  end if;

  if not public.has_project_permission(target_project_id, 'venues.read') then
    raise exception 'venue rating unavailable' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'id', saved_row.id,
    'project_id', saved_row.project_id,
    'user_id', saved_row.user_id,
    'target_type', saved_row.target_type,
    'target_id', saved_row.target_id,
    'dimension_key', saved_row.dimension_key,
    'rating', saved_row.rating,
    'revision', saved_row.revision
  );
end;
$$;

revoke all on function public.create_venue_space(
  uuid, uuid, text, text, boolean, numeric, numeric, numeric, numeric,
  integer, integer, integer, text
) from public, anon, authenticated;
grant execute on function public.create_venue_space(
  uuid, uuid, text, text, boolean, numeric, numeric, numeric, numeric,
  integer, integer, integer, text
) to authenticated;

revoke all on function public.update_venue_space(
  uuid, uuid, bigint, text, text, boolean, numeric, numeric, numeric,
  numeric, integer, integer, integer, text
) from public, anon, authenticated;
grant execute on function public.update_venue_space(
  uuid, uuid, bigint, text, text, boolean, numeric, numeric, numeric,
  numeric, integer, integer, integer, text
) to authenticated;

revoke all on function public.set_venue_member_preference(uuid, uuid, boolean, text, bigint)
from public, anon, authenticated;
grant execute on function public.set_venue_member_preference(uuid, uuid, boolean, text, bigint)
to authenticated;

revoke all on function public.set_venue_member_rating(uuid, uuid, text, numeric, bigint)
from public, anon, authenticated;
grant execute on function public.set_venue_member_rating(uuid, uuid, text, numeric, bigint)
to authenticated;

comment on table public.venue_spaces is
  'Physical Venue spaces with independent geometry/capacity. Wedding-specific sourced suitability remains in Facts/Criteria.';
comment on table public.member_entity_preferences is
  'Generic member-scoped entity favorite/private note storage. WP-2.2 exposes Venue targets only; direct writes are denied.';
comment on table public.member_ratings is
  'Generic member-scoped rating storage with controlled initial dimension keys. Venue ratings are partner-readable but author-only writable.';
